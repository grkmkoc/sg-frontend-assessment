import {
  cleanup,
  fireEvent,
  render,
  screen,
  waitFor,
  within,
} from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { TierListPage } from './TierListPage'

describe('TierListPage', () => {
  beforeEach(() => {
    let id = 0
    vi.stubGlobal('crypto', { randomUUID: () => `test-${++id}` })
    Object.defineProperty(URL, 'createObjectURL', {
      configurable: true,
      value: vi.fn(() => 'blob:preview'),
    })
    Object.defineProperty(URL, 'revokeObjectURL', {
      configurable: true,
      value: vi.fn(),
    })
  })

  afterEach(() => {
    cleanup()
    vi.unstubAllGlobals()
  })

  it('validates an empty category name', async () => {
    const user = userEvent.setup()
    render(<TierListPage />)

    await user.click(screen.getByRole('button', { name: 'Add category' }))

    expect(screen.getByRole('alert')).toHaveTextContent(
      'Category name is required',
    )
  })

  it('imports a dropped image into Item List', () => {
    render(<TierListPage />)
    const itemList = screen.getByRole('article', { name: 'Item List' })
    const image = new File(['image'], 'dropped.png', { type: 'image/png' })

    fireEvent.drop(itemList, {
      dataTransfer: { files: [image], types: ['Files'], dropEffect: 'none' },
    })

    expect(within(itemList).getByText('dropped.png')).toBeVisible()
  })

  it('saves categorized images while leaving Item List images unsubmitted', async () => {
    const user = userEvent.setup()
    const fetchMock = vi.fn<typeof fetch>().mockResolvedValue(
      new Response(
        JSON.stringify({
          categoryCount: 1,
          itemCount: 1,
          files: [],
        }),
        { status: 201, headers: { 'Content-Type': 'application/json' } },
      ),
    )
    vi.stubGlobal('fetch', fetchMock)
    render(<TierListPage />)

    await user.type(screen.getByLabelText('New category'), 'Great')
    await user.click(screen.getByRole('button', { name: 'Add category' }))
    await user.upload(
      screen.getByLabelText('Add images'),
      [
        new File(['image'], 'camera.png', { type: 'image/png' }),
        new File(['queued'], 'queued.png', { type: 'image/png' }),
      ],
    )

    const itemList = screen.getByRole('article', { name: 'Item List' })
    await user.selectOptions(
      within(itemList).getByLabelText('Move camera.png to another container'),
      'category:test-1',
    )
    await user.click(screen.getByRole('button', { name: 'Save tier list' }))

    await waitFor(() =>
      expect(screen.getByText(/Saved successfully: 1 image/)).toBeVisible(),
    )
    const saveButton = screen.getByRole('button', { name: 'Save tier list' })
    expect(saveButton).toBeDisabled()
    expect(screen.getByText('No changes to save.')).toBeVisible()

    await user.click(saveButton)
    expect(fetchMock).toHaveBeenCalledOnce()

    const categoryName = screen.getByLabelText('Category name')
    await user.clear(categoryName)
    await user.type(categoryName, 'Excellent')
    await user.tab()
    expect(saveButton).toBeEnabled()

    const [, request] = fetchMock.mock.calls[0]
    expect(request).toMatchObject({ method: 'POST' })
    expect(request?.body).toBeInstanceOf(FormData)
    expect(request?.headers).toBeUndefined()
    const submitted = request?.body as FormData
    expect(submitted.has('image_test-2')).toBe(true)
    expect(submitted.has('image_test-3')).toBe(false)
  })

  it('keeps the board intact when saving fails', async () => {
    const user = userEvent.setup()
    vi.stubGlobal(
      'fetch',
      vi.fn<typeof fetch>().mockResolvedValue(
        new Response('Receiver unavailable', { status: 500 }),
      ),
    )
    render(<TierListPage />)

    await user.type(screen.getByLabelText('New category'), 'A')
    await user.click(screen.getByRole('button', { name: 'Add category' }))
    await user.upload(
      screen.getByLabelText('Add images'),
      new File(['image'], 'kept.png', { type: 'image/png' }),
    )
    await user.selectOptions(
      screen.getByLabelText('Move kept.png to another container'),
      'category:test-1',
    )
    await user.click(screen.getByRole('button', { name: 'Save tier list' }))

    expect(await screen.findByRole('alert')).toHaveTextContent(
      'Receiver unavailable',
    )
    expect(screen.getByText('kept.png')).toBeVisible()
  })
})

import { act, renderHook } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'
import { useTierListController, type ControllerDependencies } from './useTierListController'

describe('useTierListController image lifecycle', () => {
  it('creates previews and revokes them on removal and unmount', () => {
    const createPreviewUrl = vi
      .fn<(file: File) => string>()
      .mockReturnValueOnce('blob:one')
      .mockReturnValueOnce('blob:two')
    const revokePreviewUrl = vi.fn<(url: string) => void>()
    let nextId = 0
    const dependencies: Partial<ControllerDependencies> = {
      createId: () => `item-${++nextId}`,
      createPreviewUrl,
      revokePreviewUrl,
    }
    const { result, unmount } = renderHook(() =>
      useTierListController(dependencies),
    )
    const first = new File(['one'], 'one.png', { type: 'image/png' })
    const second = new File(['two'], 'two.png', { type: 'image/png' })

    act(() => result.current.addFiles([first, second]))
    expect(result.current.state.itemList).toEqual(['item-1', 'item-2'])
    expect(result.current.getPreviewUrl('item-1')).toBe('blob:one')

    act(() => result.current.deleteItem('item-1'))
    expect(revokePreviewUrl).toHaveBeenCalledWith('blob:one')

    unmount()
    expect(revokePreviewUrl).toHaveBeenCalledWith('blob:two')
    expect(revokePreviewUrl).toHaveBeenCalledTimes(2)
  })

  it('rejects non-image files without adding them', () => {
    const { result } = renderHook(() =>
      useTierListController({
        createPreviewUrl: vi.fn(),
        revokePreviewUrl: vi.fn(),
      }),
    )

    act(() =>
      result.current.addFiles([
        new File(['text'], 'notes.txt', { type: 'text/plain' }),
      ]),
    )

    expect(result.current.state.itemList).toEqual([])
    expect(result.current.fileError).toContain('only images')
  })
})

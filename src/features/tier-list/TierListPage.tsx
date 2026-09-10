import { useEffect, useState, type FormEvent } from 'react'
import { TierBoard } from './TierBoard'
import { useTierListController } from './useTierListController'

export function TierListPage() {
  const controller = useTierListController()
  const [newCategoryName, setNewCategoryName] = useState('')
  const [categoryError, setCategoryError] = useState<string | null>(null)

  useEffect(() => {
    const preventFileNavigation = (event: DragEvent) => {
      if (event.dataTransfer?.types.includes('Files')) event.preventDefault()
    }
    window.addEventListener('dragover', preventFileNavigation)
    window.addEventListener('drop', preventFileNavigation)
    return () => {
      window.removeEventListener('dragover', preventFileNavigation)
      window.removeEventListener('drop', preventFileNavigation)
    }
  }, [])

  const handleAddCategory = (event: FormEvent) => {
    event.preventDefault()
    const error = controller.addCategory(newCategoryName)
    setCategoryError(error)
    if (!error) setNewCategoryName('')
  }

  return (
    <main className="page-shell">
      <header className="hero">
        <p className="eyebrow">Image ranking workspace</p>
        <h1>Tier List Builder</h1>
        <p className="intro">
          Add images, create categories, and arrange every item before submitting
          your list.
        </p>
      </header>

      <section className="controls" aria-labelledby="build-controls-title">
        <h2 id="build-controls-title" className="visually-hidden">
          Build controls
        </h2>
        <label className={`file-button ${controller.isSaving ? 'disabled' : ''}`}>
          <span>Add images</span>
          <input
            type="file"
            accept="image/*"
            multiple
            disabled={controller.isSaving}
            onChange={(event) => {
              if (event.target.files) controller.addFiles(event.target.files)
              event.target.value = ''
            }}
          />
        </label>

        <form className="category-form" onSubmit={handleAddCategory}>
          <label htmlFor="new-category">New category</label>
          <div className="field-row">
            <input
              id="new-category"
              value={newCategoryName}
              disabled={controller.isSaving}
              placeholder="e.g. Excellent"
              onChange={(event) => {
                setNewCategoryName(event.target.value)
                setCategoryError(null)
              }}
              aria-describedby={categoryError ? 'category-error' : undefined}
              aria-invalid={Boolean(categoryError)}
            />
            <button type="submit" disabled={controller.isSaving}>
              Add category
            </button>
          </div>
          {categoryError && (
            <p className="field-error" id="category-error" role="alert">
              {categoryError}
            </p>
          )}
        </form>
      </section>

      {controller.fileError && (
        <p className="notice error" role="alert">
          {controller.fileError}
        </p>
      )}

      <TierBoard controller={controller} />

      <section className="save-panel" aria-labelledby="save-title">
        <div>
          <h2 id="save-title">Ready to submit?</h2>
          <p id="save-reason">
            {controller.saveDisabledReason ??
              'All images are categorized. Your list is ready.'}
          </p>
          {controller.isSaving && (
            <p role="status">Uploading images… Editing is temporarily disabled.</p>
          )}
        </div>
        <button
          className="primary-button"
          type="button"
          disabled={Boolean(controller.saveDisabledReason) || controller.isSaving}
          aria-describedby="save-reason"
          onClick={() => void controller.save()}
        >
          {controller.isSaving ? 'Saving…' : 'Save tier list'}
        </button>
      </section>

      <div className="save-message" aria-live="polite">
        {controller.saveState.kind === 'success' && (
          <p className="notice success">
            Saved successfully: {controller.saveState.summary.itemCount} image
            {controller.saveState.summary.itemCount === 1 ? '' : 's'} across{' '}
            {controller.saveState.summary.categoryCount} categor
            {controller.saveState.summary.categoryCount === 1 ? 'y' : 'ies'}.
          </p>
        )}
        {controller.saveState.kind === 'error' && (
          <p className="notice error" role="alert">
            {controller.saveState.message}
          </p>
        )}
      </div>
    </main>
  )
}

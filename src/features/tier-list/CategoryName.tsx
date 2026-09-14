import { useEffect, useState, type KeyboardEvent } from 'react'
import type { Category } from '../../domain/tierList'

export function CategoryName({
  category,
  disabled,
  onRename,
}: {
  category: Category
  disabled: boolean
  onRename: (id: string, name: string) => string | null
}) {
  const [name, setName] = useState(category.name)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => setName(category.name), [category.name])

  const commit = () => {
    if (name === category.name) return
    const validationError = onRename(category.id, name)
    setError(validationError)
    if (validationError) setName(category.name)
  }

  const handleKeyDown = (event: KeyboardEvent<HTMLInputElement>) => {
    if (event.key === 'Enter') {
      event.preventDefault()
      event.currentTarget.blur()
    }
    if (event.key === 'Escape') {
      setName(category.name)
      setError(null)
      event.currentTarget.blur()
    }
  }

  return (
    <div className="category-name-field">
      <label className="visually-hidden" htmlFor={`category-${category.id}`}>
        Category name
      </label>
      <input
        id={`category-${category.id}`}
        value={name}
        disabled={disabled}
        onChange={(event) => {
          setName(event.target.value)
          setError(null)
        }}
        onBlur={commit}
        onKeyDown={handleKeyDown}
        aria-invalid={Boolean(error)}
      />
      {error && <span className="field-error">{error}</span>}
    </div>
  )
}

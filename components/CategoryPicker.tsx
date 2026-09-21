'use client'

import { useCallback, useEffect, useId, useLayoutEffect, useMemo, useRef, useState } from 'react'
import { useGetCategoriesQuery } from '@/store/categoriesApi'
import type { Category } from '@/store/types'

export type CategorySelection =
  | { type: 'all' }
  | { type: 'group'; group: string }
  | { type: 'category'; slug: string }

type Option = {
  key: string
  /** Group this option belongs to, used for the section headings. */
  group: string
  label: string
  hint: string
  count: number
  selection: CategorySelection
}

function GridIcon() {
  return (
    <svg aria-hidden="true" viewBox="0 0 24 24" fill="none" stroke="currentColor">
      <rect x="3" y="3" width="7" height="7" rx="1" />
      <rect x="14" y="3" width="7" height="7" rx="1" />
      <rect x="3" y="14" width="7" height="7" rx="1" />
      <rect x="14" y="14" width="7" height="7" rx="1" />
    </svg>
  )
}

/**
 * Search-bar category picker.
 *
 * A real listbox rather than a decorative chevron:
 *  - type to filter (23 categories is too many to scan by eye)
 *  - full keyboard support: Up/Down, Home/End, Enter, Escape
 *  - groups mirror the category tree, with an "All <group>" entry per section
 *  - the panel is positioned with fixed coordinates so it can't be clipped by
 *    the search bar's `overflow: hidden` and stays on screen on mobile
 */
export default function CategoryPicker({
  value,
  onChange,
  className = '',
}: {
  value: CategorySelection
  onChange: (next: CategorySelection) => void
  className?: string
}) {
  const listId = useId()

  /**
   * Build a DOM-safe id from an option key.
   *
   * Option keys embed the group name (`group:Cars & Vehicles`), and React's
   * `useId()` contributes colons. Neither spaces nor `&` are legal in an HTML
   * `id`, and an id that fails to parse stops assistive tech resolving
   * `aria-activedescendant` to the highlighted row.
   */
  const domId = useCallback(
    (key: string) => `${listId}-${key}`.replace(/[^a-zA-Z0-9_-]/g, '-'),
    [listId]
  )

  const [open, setOpen] = useState(false)
  const [filter, setFilter] = useState('')
  const [activeIndex, setActiveIndex] = useState(0)
  const [box, setBox] = useState<{ left: number; top: number; width: number; maxHeight: number } | null>(
    null
  )

  const wrapRef = useRef<HTMLDivElement>(null)
  const buttonRef = useRef<HTMLButtonElement>(null)
  const inputRef = useRef<HTMLInputElement>(null)
  const listRef = useRef<HTMLUListElement>(null)
  /** Set when the panel is opened so focus lands exactly once, after it mounts. */
  const shouldFocusRef = useRef(false)

  const { data, isLoading } = useGetCategoriesQuery({ withCounts: 'true' })
  const categories = useMemo(() => data?.items ?? [], [data])

  /* ---- build the option list ---- */

  const options = useMemo<Option[]>(() => {
    const byGroup = new Map<string, Category[]>()
    for (const c of categories) {
      if (!byGroup.has(c.group)) byGroup.set(c.group, [])
      byGroup.get(c.group)!.push(c)
    }

    const all: Option[] = [
      {
        key: 'all',
        group: '',
        label: 'All categories',
        hint: 'Search the whole marketplace',
        count: categories.reduce((sum, c) => sum + (c.productCount ?? 0), 0),
        selection: { type: 'all' },
      },
    ]

    for (const [group, items] of byGroup) {
      // A category whose name matches its group represents the group itself.
      const subCategories = items.filter((c) => c.name !== group)
      const groupCount = items.reduce((sum, c) => sum + (c.productCount ?? 0), 0)

      all.push({
        key: `group:${group}`,
        group,
        label: `All ${group}`,
        hint: 'Every listing in this category',
        count: groupCount,
        selection: { type: 'group', group },
      })

      for (const c of subCategories) {
        all.push({
          key: `cat:${c.slug}`,
          group,
          label: c.name,
          hint: group,
          count: c.productCount ?? 0,
          selection: { type: 'category', slug: c.slug },
        })
      }
    }

    return all
  }, [categories])

  /** Options matching the current filter, in focus order. */
  const matches = useMemo(() => {
    const needle = filter.trim().toLowerCase()
    if (!needle) return options
    return options.filter(
      (o) =>
        o.label.toLowerCase().includes(needle) ||
        o.group.toLowerCase().includes(needle) ||
        o.hint.toLowerCase().includes(needle)
    )
  }, [options, filter])

  /** Render rows: section headings interleaved when not filtering. */
  const rows = useMemo(() => {
    const out: Array<{ type: 'heading'; label: string } | { type: 'option'; option: Option; index: number }> = []
    const needle = filter.trim()

    if (needle) {
      matches.forEach((option, index) => out.push({ type: 'option', option, index }))
      return out
    }

    matches.forEach((option, index) => {
      if (option.group && (index === 0 || matches[index - 1].group !== option.group)) {
        out.push({ type: 'heading', label: option.group })
      }
      out.push({ type: 'option', option, index })
    })
    return out
  }, [matches, filter])

  const selectedKey = useMemo(() => {
    if (value.type === 'all') return 'all'
    if (value.type === 'group') return `group:${value.group}`
    return `cat:${value.slug}`
  }, [value])

  const selectedOption = options.find((o) => o.key === selectedKey)
  const activeOption = matches[activeIndex]

  /* ---- panel positioning ---- */

  const reposition = useCallback(() => {
    const btn = buttonRef.current
    if (!btn) return
    const r = btn.getBoundingClientRect()
    const vw = window.innerWidth
    const vh = window.innerHeight
    const width = Math.min(440, vw - 16)
    // Prefer right-aligning under the button, but never spill off screen.
    const left = Math.min(Math.max(8, r.right - width), Math.max(8, vw - width - 8))
    const top = r.bottom + 6
    const maxHeight = Math.max(200, Math.min(400, vh - top - 16))
    setBox({ left, top, width, maxHeight })
  }, [])

  useLayoutEffect(() => {
    if (!open) return
    reposition()
    window.addEventListener('resize', reposition)
    // `capture` so scrolling inside any ancestor repositions the panel too.
    window.addEventListener('scroll', reposition, true)
    return () => {
      window.removeEventListener('resize', reposition)
      window.removeEventListener('scroll', reposition, true)
    }
  }, [open, reposition])

  /* ---- open / close ---- */

  const close = useCallback(
    (refocus = true) => {
      setOpen(false)
      setFilter('')
      shouldFocusRef.current = false
      if (refocus) buttonRef.current?.focus()
    },
    []
  )

  function openMenu() {
    // Jump the highlight to whatever is currently selected.
    const index = options.findIndex((o) => o.key === selectedKey)
    setActiveIndex(index >= 0 ? index : 0)
    setFilter('')
    shouldFocusRef.current = true
    setOpen(true)
  }

  // Focus the filter box once the panel has actually mounted.
  //
  // `box` is computed in a layout effect a tick after `open` flips, and the panel
  // — input included — only renders once `box` is known. Depending on `open`
  // alone would therefore focus a still-null ref and silently do nothing.
  // The ref guard keeps later repositions (scroll/resize) from stealing focus back.
  useEffect(() => {
    if (!open || !box || !shouldFocusRef.current) return
    shouldFocusRef.current = false
    inputRef.current?.focus()
  }, [open, box])

  // Click outside closes.
  useEffect(() => {
    if (!open) return
    function onPointerDown(e: MouseEvent) {
      const target = e.target as Node
      if (wrapRef.current?.contains(target)) return
      if (listRef.current?.contains(target)) return
      close(false)
    }
    document.addEventListener('mousedown', onPointerDown)
    return () => document.removeEventListener('mousedown', onPointerDown)
  }, [open, close])

  // Keep the highlighted row in view.
  useEffect(() => {
    if (!open) return
    const el = listRef.current?.querySelector<HTMLElement>(`[data-index="${activeIndex}"]`)
    el?.scrollIntoView({ block: 'nearest' })
  }, [open, activeIndex, rows])

  function select(option: Option) {
    onChange(option.selection)
    close()
  }

  function onKeyDown(e: React.KeyboardEvent<HTMLInputElement>) {
    if (e.key === 'ArrowDown') {
      e.preventDefault()
      setActiveIndex((i) => (matches.length ? (i + 1) % matches.length : 0))
    } else if (e.key === 'ArrowUp') {
      e.preventDefault()
      setActiveIndex((i) => (matches.length ? (i - 1 + matches.length) % matches.length : 0))
    } else if (e.key === 'Home') {
      e.preventDefault()
      setActiveIndex(0)
    } else if (e.key === 'End') {
      e.preventDefault()
      setActiveIndex(Math.max(0, matches.length - 1))
    } else if (e.key === 'Enter') {
      e.preventDefault()
      if (activeOption) select(activeOption)
    } else if (e.key === 'Escape') {
      e.preventDefault()
      close()
    } else if (e.key === 'Tab') {
      // Let focus move on naturally, just tidy up.
      setOpen(false)
      setFilter('')
    }
  }

  /* ---- label ---- */

  const label =
    value.type === 'all'
      ? 'All categories'
      : value.type === 'group'
        ? `All ${value.group}`
        : (selectedOption?.label ?? 'All categories')

  const kicker =
    value.type === 'category' ? (selectedOption?.group ?? 'Category') : 'Categories'

  const title = value.type === 'all' ? 'All categories' : `${kicker}: ${label}`

  return (
    <div ref={wrapRef} className={`category-picker-wrap ${className}`}>
      <button
        ref={buttonRef}
        type="button"
        className={`category-picker ${open ? 'is-open' : ''}`}
        aria-haspopup="listbox"
        aria-expanded={open}
        aria-controls={open ? listId : undefined}
        aria-label={`Category filter: ${title}. Change category`}
        title={title}
        onClick={() => (open ? close() : openMenu())}
      >
        <GridIcon />
        <div className="picker-text">
          <small>{kicker}</small>
          <span>{label}</span>
        </div>
        <b className="chevron" aria-hidden="true">
          ▾
        </b>
      </button>

      {open && box && (
        <div
          className="category-menu"
          style={{ left: box.left, top: box.top, width: box.width, maxHeight: box.maxHeight }}
        >
          <div className="category-menu-search">
            <svg aria-hidden="true" viewBox="0 0 24 24" fill="none" stroke="currentColor">
              <circle cx="11" cy="11" r="7" />
              <path d="m20 20-4.35-4.35" strokeLinecap="round" />
            </svg>
            <input
              ref={inputRef}
              value={filter}
              onChange={(e) => {
                setFilter(e.target.value)
                setActiveIndex(0)
              }}
              onKeyDown={onKeyDown}
              role="combobox"
              aria-expanded="true"
              aria-controls={listId}
              aria-activedescendant={activeOption ? domId(activeOption.key) : undefined}
              aria-autocomplete="list"
              aria-label="Filter categories"
              placeholder="Search categories…"
              autoComplete="off"
            />
            {filter && (
              <button
                type="button"
                className="category-menu-clear"
                onClick={() => {
                  setFilter('')
                  setActiveIndex(0)
                  inputRef.current?.focus()
                }}
                aria-label="Clear category filter"
              >
                ×
              </button>
            )}
          </div>

          <ul ref={listRef} id={listId} role="listbox" aria-label="Categories" className="category-menu-list">
            {isLoading && <li className="category-menu-empty">Loading categories…</li>}

            {!isLoading && matches.length === 0 && (
              <li className="category-menu-empty">No category matches “{filter}”.</li>
            )}

            {rows.map((row) =>
              row.type === 'heading' ? (
                <li key={`h-${row.label}`} role="presentation" className="category-menu-heading">
                  {row.label}
                </li>
              ) : (
                <li
                  key={row.option.key}
                  id={domId(row.option.key)}
                  data-index={row.index}
                  role="option"
                  aria-selected={row.option.key === selectedKey}
                  className={`category-menu-option ${
                    row.index === activeIndex ? 'is-active' : ''
                  } ${row.option.key === selectedKey ? 'is-selected' : ''}`}
                  // mousedown would blur the filter input before the click lands.
                  onMouseDown={(e) => e.preventDefault()}
                  onMouseEnter={() => setActiveIndex(row.index)}
                  onClick={() => select(row.option)}
                >
                  <span className="option-label">{row.option.label}</span>
                  {row.option.key !== selectedKey && row.option.hint ? (
                    <span className="option-hint">{row.option.hint}</span>
                  ) : null}
                  {row.option.count > 0 && <span className="option-count">{row.option.count}</span>}
                  {row.option.key === selectedKey && (
                    <svg className="option-check" aria-hidden="true" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                      <path d="m20 6-11 11-5-5" strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                  )}
                </li>
              )
            )}
          </ul>
        </div>
      )}
    </div>
  )
}

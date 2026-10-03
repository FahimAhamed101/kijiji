'use client'

import { useCallback, useEffect, useId, useLayoutEffect, useMemo, useRef, useState } from 'react'

/**
 * Search-bar location picker.
 *
 * Replaces a dead `<button>Canada ▾</button>` that promised a dropdown it didn't
 * have. Mirrors `CategoryPicker`'s interaction model (type-to-filter, full
 * keyboard support, fixed-position panel so the search bar's `overflow: hidden`
 * can't clip it) and deliberately reuses the same `category-menu*` style block so
 * both dropdowns look and behave identically.
 *
 * The value is a province/territory name, which the products API matches with a
 * case-insensitive regex against the listing's `location` ("Toronto, Ontario").
 * An empty string means "all of Canada" and adds no filter.
 */

export const PROVINCES = [
  'Alberta',
  'British Columbia',
  'Manitoba',
  'New Brunswick',
  'Newfoundland and Labrador',
  'Northwest Territories',
  'Nova Scotia',
  'Nunavut',
  'Ontario',
  'Prince Edward Island',
  'Quebec',
  'Saskatchewan',
  'Yukon',
] as const

export type Province = (typeof PROVINCES)[number]

function PinIcon() {
  return (
    <svg aria-hidden="true" viewBox="0 0 24 24" fill="none" stroke="currentColor">
      <path d="M20 10c0 5.5-8 12-8 12s-8-6.5-8-12a8 8 0 1 1 16 0Z" strokeLinejoin="round" />
      <circle cx="12" cy="10" r="2.8" />
    </svg>
  )
}

type Option = { key: string; label: string; hint: string; value: string }

export default function LocationPicker({
  value,
  onChange,
  className = '',
}: {
  /** Selected province/territory, or `''` for all of Canada. */
  value: string
  onChange: (next: string) => void
  className?: string
}) {
  const listId = useId()

  /** DOM ids can't contain whitespace; province names have plenty. */
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
  /** Focus the filter exactly once per open, after the panel has mounted. */
  const shouldFocusRef = useRef(false)

  const options = useMemo<Option[]>(
    () => [
      { key: 'all', label: 'All Canada', hint: 'Every province and territory', value: '' },
      ...PROVINCES.map((p) => ({ key: p, label: p, hint: 'Province / Territory', value: p as string })),
    ],
    []
  )

  const matches = useMemo(() => {
    const needle = filter.trim().toLowerCase()
    if (!needle) return options
    return options.filter(
      (o) => o.label.toLowerCase().includes(needle) || o.hint.toLowerCase().includes(needle)
    )
  }, [options, filter])

  const selectedKey = value || 'all'
  const activeOption = matches[activeIndex]

  /* ---- panel positioning (identical approach to CategoryPicker) ---- */
  const reposition = useCallback(() => {
    const btn = buttonRef.current
    if (!btn) return
    const r = btn.getBoundingClientRect()
    const vw = window.innerWidth
    const vh = window.innerHeight
    const width = Math.min(320, vw - 16)
    const left = Math.min(Math.max(8, r.left), Math.max(8, vw - width - 8))
    const top = r.bottom + 6
    const maxHeight = Math.max(180, Math.min(360, vh - top - 16))
    setBox({ left, top, width, maxHeight })
  }, [])

  useLayoutEffect(() => {
    if (!open) return
    reposition()
    window.addEventListener('resize', reposition)
    window.addEventListener('scroll', reposition, true)
    return () => {
      window.removeEventListener('resize', reposition)
      window.removeEventListener('scroll', reposition, true)
    }
  }, [open, reposition])

  const close = useCallback((refocus = true) => {
    setOpen(false)
    setFilter('')
    shouldFocusRef.current = false
    if (refocus) buttonRef.current?.focus()
  }, [])

  function openMenu() {
    const index = options.findIndex((o) => o.key === selectedKey)
    setActiveIndex(index >= 0 ? index : 0)
    setFilter('')
    shouldFocusRef.current = true
    setOpen(true)
  }

  // `box` lands a tick after `open`; the panel (and its input) only render once
  // it is known, so keying on `open` alone would focus a still-null ref.
  useEffect(() => {
    if (!open || !box || !shouldFocusRef.current) return
    shouldFocusRef.current = false
    inputRef.current?.focus()
  }, [open, box])

  useEffect(() => {
    if (!open) return
    function onPointerDown(e: MouseEvent) {
      const t = e.target as Node
      if (wrapRef.current?.contains(t) || listRef.current?.contains(t)) return
      close(false)
    }
    document.addEventListener('mousedown', onPointerDown)
    return () => document.removeEventListener('mousedown', onPointerDown)
  }, [open, close])

  useEffect(() => {
    if (!open) return
    const el = listRef.current?.querySelector<HTMLElement>(`[data-index="${activeIndex}"]`)
    el?.scrollIntoView({ block: 'nearest' })
  }, [open, activeIndex, matches])

  function select(option: Option) {
    onChange(option.value)
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
      setOpen(false)
      setFilter('')
    }
  }

  const label = value || 'Canada'
  const title = value ? `Location: ${value}. Change location` : 'Location: all of Canada. Change location'

  return (
    <div ref={wrapRef} className={`category-picker-wrap location-picker-wrap ${className}`}>
      <button
        ref={buttonRef}
        type="button"
        className={`category-picker location-picker ${open ? 'is-open' : ''}`}
        aria-haspopup="listbox"
        aria-expanded={open}
        aria-controls={open ? listId : undefined}
        aria-label={title}
        title={title}
        onClick={() => (open ? close() : openMenu())}
      >
        <PinIcon />
        <div className="picker-text">
          <small>Location</small>
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
              aria-label="Filter locations"
              placeholder="Search province or territory…"
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
                aria-label="Clear location filter"
              >
                ×
              </button>
            )}
          </div>

          <ul ref={listRef} id={listId} role="listbox" aria-label="Locations" className="category-menu-list">
            {matches.length === 0 && (
              <li className="category-menu-empty">No location matches “{filter}”.</li>
            )}
            {matches.map((option, index) => (
              <li
                key={option.key}
                id={domId(option.key)}
                data-index={index}
                role="option"
                aria-selected={option.key === selectedKey}
                className={`category-menu-option ${
                  index === activeIndex ? 'is-active' : ''
                } ${option.key === selectedKey ? 'is-selected' : ''}`}
                onMouseDown={(e) => e.preventDefault()}
                onMouseEnter={() => setActiveIndex(index)}
                onClick={() => select(option)}
              >
                <span className="option-label">{option.label}</span>
                {option.key !== selectedKey && option.hint ? (
                  <span className="option-hint">{option.hint}</span>
                ) : null}
                {option.key === selectedKey && (
                  <svg
                    className="option-check"
                    aria-hidden="true"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2.5"
                  >
                    <path d="m20 6-11 11-5-5" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                )}
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  )
}

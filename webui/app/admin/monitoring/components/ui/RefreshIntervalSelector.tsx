'use client'

import { useState, useEffect, useRef } from 'react'
import { RefreshIntervalSelectorProps } from '../types'

export function RefreshIntervalSelector({ value, onValueChange }: RefreshIntervalSelectorProps) {
  const [isOpen, setIsOpen] = useState(false)
  const dropdownRef = useRef<HTMLDivElement>(null)
  const intervals = [
    { value: '5', label: '5s' },
    { value: '10', label: '10s' },
    { value: '30', label: '30s' },
    { value: '60', label: '1m' }
  ]

  const currentLabel = intervals.find(i => i.value === value)?.label || value + 's'

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false)
      }
    }

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside)
      return () => document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [isOpen])

  return (
    <div className="relative" ref={dropdownRef}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="h-5.5 px-1 text-sm border border-input rounded hover:bg-accent hover:text-accent-foreground transition-colors"
      >
        <span className='text-xs'>{currentLabel}</span>
      </button>

      {isOpen && (
        <div className="absolute top-full mt-1 right-0 z-50 min-w-[80px] rounded-md border bg-popover p-1 shadow-md">
          {intervals.map(interval => (
            <button
              key={interval.value}
              onClick={() => {
                onValueChange(interval.value)
                setIsOpen(false)
              }}
              className={`w-full text-left px-2 py-1 text-sm rounded hover:bg-accent hover:text-accent-foreground transition-colors ${
                value === interval.value ? 'bg-accent text-accent-foreground' : ''
              }`}
            >
              {interval.label}
            </button>
          ))}
        </div>
      )}
    </div>
  )
}
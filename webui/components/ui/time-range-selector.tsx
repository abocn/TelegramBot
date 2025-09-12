'use client'

import { useState, useRef, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { ChevronDown } from 'lucide-react'
import { cn } from '@/lib/utils'

export type TimeFrame = '1h' | '3h' | '6h' | '12h' | '24h' | '3d' | '7d' | '30d' | '90d' | '1y' | string

interface TimeRangeSelectorProps {
  value: TimeFrame
  onValueChange: (value: TimeFrame) => void
  className?: string
}

interface TimeUnit {
  unit: 'hours' | 'days' | 'weeks' | 'months' | 'years'
  label: string
  presets: number[]
}

const timeUnits: TimeUnit[] = [
  { unit: 'hours', label: 'hours', presets: [1, 3, 6, 12] },
  { unit: 'days', label: 'days', presets: [1, 3, 7, 14] },
  { unit: 'weeks', label: 'weeks', presets: [1, 2, 4, 8] },
  { unit: 'months', label: 'months', presets: [1, 3, 6, 12] },
  { unit: 'years', label: 'years', presets: [1, 2, 3, 5] }
]

const formatTimeFrame = (value: TimeFrame): string => {
  const match = value.match(/^(\d+)([hdwmy])$/)
  if (!match) return value

  const [, num, unit] = match
  const number = parseInt(num)

  const unitLabels: { [key: string]: string } = {
    h: number === 1 ? 'hour' : 'hours',
    d: number === 1 ? 'day' : 'days',
    w: number === 1 ? 'week' : 'weeks',
    m: number === 1 ? 'month' : 'months',
    y: number === 1 ? 'year' : 'years'
  }

  return `${number} ${unitLabels[unit] || unit}`
}

const parseCustomInput = (input: string): TimeFrame | null => {
  const normalized = input.trim().toLowerCase()

  const match = normalized.match(/^(\d+)\s*(hour|hours|day|days|week|weeks|month|months|year|years)$/)
  if (!match) return null

  const [, num, unit] = match
  const number = parseInt(num)

  const unitMap: { [key: string]: string } = {
    'hour': 'h', 'hours': 'h',
    'day': 'd', 'days': 'd',
    'week': 'w', 'weeks': 'w',
    'month': 'm', 'months': 'm',
    'year': 'y', 'years': 'y'
  }

  const shortUnit = unitMap[unit]
  if (!shortUnit) return null

  return `${number}${shortUnit}`
}

export function TimeRangeSelector({ value, onValueChange, className }: TimeRangeSelectorProps) {
  const [isOpen, setIsOpen] = useState(false)
  const dropdownRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false)
      }
    }

    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  const handlePresetClick = (num: number, unit: string) => {
    const unitMap: { [key: string]: string } = {
      'hours': 'h',
      'days': 'd',
      'weeks': 'w',
      'months': 'm',
      'years': 'y'
    }
    const newValue = `${num}${unitMap[unit]}`
    onValueChange(newValue)
    setIsOpen(false)
  }

  return (
    <div className={cn("relative", className)} ref={dropdownRef}>
      <Button
        variant="outline"
        size="sm"
        className="h-8 px-3 flex items-center gap-1"
        onClick={() => setIsOpen(!isOpen)}
      >
        <span className="text-sm">{formatTimeFrame(value)}</span>
        <ChevronDown className={cn(
          "h-3 w-3 transition-transform",
          isOpen && "rotate-180"
        )} />
      </Button>

      {isOpen && (
        <div className="absolute top-full mt-1 right-0 z-50 min-w-[200px] rounded-md border bg-popover p-2 shadow-md">
          <div className="space-y-2">
            {timeUnits.map(({ unit, label, presets }) => (
              <div key={unit} className="flex items-center gap-1.5">
                <div className="flex gap-1">
                  {presets.map(num => (
                    <Button
                      key={num}
                      variant="ghost"
                      size="sm"
                      className="h-7 w-7 p-0 hover:bg-accent"
                      onClick={() => handlePresetClick(num, unit)}
                    >
                      {num}
                    </Button>
                  ))}
                </div>
                <span className="text-sm text-muted-foreground ml-1">{label}</span>
              </div>
            ))}
          </div>

          <div className="mt-3 pt-2 border-t">
            <div className="flex items-center gap-2">
              <Input
                type="text"
                placeholder="Custom (e.g., '5 hours')"
                className="h-7 flex-1 text-sm"
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    const parsed = parseCustomInput(e.currentTarget.value)
                    if (parsed) {
                      onValueChange(parsed)
                      setIsOpen(false)
                      e.currentTarget.value = ''
                    }
                  }
                }}
              />
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              Type custom range and press Enter
            </p>
          </div>
        </div>
      )}
    </div>
  )
}
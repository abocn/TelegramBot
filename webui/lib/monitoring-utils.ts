import { type TimeFrame } from '@/components/ui/time-range-selector'

export interface TimeframeDuration {
  value: number
  unit: 'h' | 'd' | 'w' | 'm' | 'y'
}

export function parseTimeframe(timeFrame: TimeFrame): TimeframeDuration {
  const match = timeFrame.match(/^(\d+)([hdwmy])$/)
  if (!match) return { value: 30, unit: 'd' }
  return { value: parseInt(match[1]), unit: match[2] as 'h' | 'd' | 'w' | 'm' | 'y' }
}

export function getIntervalAndPoints(timeFrame: TimeFrame): {
  intervalMs: number
  totalPoints: number
  aggregationType: 'none' | 'hourly' | 'daily' | 'weekly' | 'monthly'
} {
  const { value, unit } = parseTimeframe(timeFrame)

  if (unit === 'h') {
    if (value <= 3) {
      return {
        intervalMs: 15 * 60 * 1000,
        totalPoints: Math.ceil(value * 4),
        aggregationType: 'none'
      }
    } else {
      return {
        intervalMs: 60 * 60 * 1000,
        totalPoints: value,
        aggregationType: 'hourly'
      }
    }
  }

  if (unit === 'd') {
    if (value === 1) {
      return {
        intervalMs: 60 * 60 * 1000,
        totalPoints: 24,
        aggregationType: 'hourly'
      }
    } else if (value <= 7) {
      return {
        intervalMs: 4 * 60 * 60 * 1000,
        totalPoints: value * 6,
        aggregationType: 'none'
      }
    } else {
      return {
        intervalMs: 24 * 60 * 60 * 1000,
        totalPoints: value,
        aggregationType: 'daily'
      }
    }
  }

  if (unit === 'w') {
    return {
      intervalMs: 24 * 60 * 60 * 1000,
      totalPoints: value * 7,
      aggregationType: 'daily'
    }
  }

  if (unit === 'm') {
    if (value <= 3) {
      return {
        intervalMs: 24 * 60 * 60 * 1000,
        totalPoints: value * 30,
        aggregationType: 'daily'
      }
    } else if (value <= 12) {
      return {
        intervalMs: 7 * 24 * 60 * 60 * 1000,
        totalPoints: value * 4,
        aggregationType: 'weekly'
      }
    } else {
      return {
        intervalMs: 30 * 24 * 60 * 60 * 1000,
        totalPoints: value,
        aggregationType: 'monthly'
      }
    }
  }

  if (unit === 'y') {
    return {
      intervalMs: 30 * 24 * 60 * 60 * 1000,
      totalPoints: value * 12,
      aggregationType: 'monthly'
    }
  }

  return {
    intervalMs: 24 * 60 * 60 * 1000,
    totalPoints: 30,
    aggregationType: 'daily'
  }
}

type DataPointValue = string | number | boolean | null | undefined
export function fillDataPoints<T extends Record<string, DataPointValue>>(
  data: T[],
  timeFrame: TimeFrame,
  timestampKey: string = 'timestamp',
  defaultValues: Partial<T> = {}
): T[] {
  if (!data || data.length === 0) {
    const { intervalMs, totalPoints } = getIntervalAndPoints(timeFrame)
    const now = Date.now()
    const emptyData: T[] = []

    for (let i = 0; i < totalPoints; i++) {
      const timestamp = new Date(now - (i * intervalMs)).toISOString()
      emptyData.unshift({
        [timestampKey]: timestamp,
        ...defaultValues
      } as T)
    }

    return emptyData
  }

  const { intervalMs, totalPoints } = getIntervalAndPoints(timeFrame)
  const now = Date.now()
  const filledData: T[] = []

  const dataMap = new Map<string, T>()
  data.forEach(item => {
    const timestampValue = item[timestampKey]
    if (!timestampValue) return

    const timestamp = new Date(timestampValue as string | number | Date).getTime()
    if (isNaN(timestamp)) return

    const roundedTime = Math.floor(timestamp / intervalMs) * intervalMs
    const key = new Date(roundedTime).toISOString()

    const existing = dataMap.get(key)
    if (existing) {
      const aggregated = { ...existing }
      Object.keys(item).forEach(k => {
        if (typeof item[k] === 'number' && k !== timestampKey) {
          const existingVal = existing[k] as number
          const itemVal = item[k] as number
          (aggregated as Record<string, DataPointValue>)[k] = (existingVal + itemVal) / 2
        }
      })
      dataMap.set(key, aggregated)
    } else {
      dataMap.set(key, { ...item, [timestampKey]: key })
    }
  })

  for (let i = 0; i < totalPoints; i++) {
    const timestamp = new Date(now - (i * intervalMs))
    const key = new Date(Math.floor(timestamp.getTime() / intervalMs) * intervalMs).toISOString()

    const existingData = dataMap.get(key)
    if (existingData) {
      filledData.unshift(existingData)
    } else {
      const zeroPoint = {
        [timestampKey]: key,
        ...defaultValues
      } as T

      if (data.length > 0) {
        Object.keys(data[0]).forEach(k => {
          if (typeof data[0][k] === 'number' && k !== timestampKey && !(k in defaultValues)) {
            (zeroPoint as Record<string, DataPointValue>)[k] = 0
          }
        })
      }

      filledData.unshift(zeroPoint)
    }
  }

  return filledData
}

export function aggregateDataByInterval<T extends Record<string, DataPointValue>>(
  data: T[],
  timeFrame: TimeFrame,
  timestampKey: string = 'timestamp',
  aggregationRules: { [key: string]: 'avg' | 'sum' | 'max' | 'min' | 'last' } = {}
): T[] {
  const { aggregationType } = getIntervalAndPoints(timeFrame)

  if (aggregationType === 'none' || !data || data.length === 0) {
    return data
  }

  const groups = new Map<string, { items: T[], startDate: Date, endDate: Date }>()

  data.forEach(item => {
    const timestampValue = item[timestampKey]
    if (!timestampValue) return

    const date = new Date(timestampValue as string | number | Date)
    if (isNaN(date.getTime())) return

    let groupKey: string

    switch (aggregationType) {
      case 'hourly':
        groupKey = `${date.getFullYear()}-${date.getMonth()}-${date.getDate()}-${date.getHours()}`
        break
      case 'daily':
        groupKey = `${date.getFullYear()}-${date.getMonth()}-${date.getDate()}`
        break
      case 'weekly':
        const weekStart = new Date(date)
        weekStart.setDate(date.getDate() - date.getDay())
        groupKey = `${weekStart.getFullYear()}-${weekStart.getMonth()}-${weekStart.getDate()}`
        break
      case 'monthly':
        groupKey = `${date.getFullYear()}-${date.getMonth()}`
        break
      default:
        groupKey = String(item[timestampKey])
    }

    if (!groups.has(groupKey)) {
      groups.set(groupKey, { items: [], startDate: date, endDate: date })
    }
    const group = groups.get(groupKey)!
    group.items.push(item)
    if (date < group.startDate) group.startDate = date
    if (date > group.endDate) group.endDate = date
  })

  const aggregated: T[] = []

  groups.forEach(({ items: groupItems, startDate, endDate }) => {
    if (groupItems.length === 0) return

    const aggregatedItem: Record<string, DataPointValue> = { ...groupItems[0] }

    aggregatedItem['__dateRangeStart'] = startDate.toISOString()
    aggregatedItem['__dateRangeEnd'] = endDate.toISOString()
    aggregatedItem['__aggregationType'] = aggregationType

    Object.keys(groupItems[0]).forEach(key => {
      if (key === timestampKey) {
        const midpoint = new Date((startDate.getTime() + endDate.getTime()) / 2)
        aggregatedItem[key] = midpoint.toISOString()
      } else if (typeof groupItems[0][key] === 'number') {
        const rule = aggregationRules[key] || 'avg'
        const values = groupItems.map(item => item[key] as number)

        switch (rule) {
          case 'sum':
            aggregatedItem[key] = values.reduce((a, b) => a + b, 0)
            break
          case 'max':
            aggregatedItem[key] = Math.max(...values)
            break
          case 'min':
            aggregatedItem[key] = Math.min(...values)
            break
          case 'last':
            aggregatedItem[key] = values[values.length - 1]
            break
          case 'avg':
          default:
            aggregatedItem[key] = values.reduce((a, b) => a + b, 0) / values.length
            break
        }
      }
    })

    aggregated.push(aggregatedItem as T)
  })

  return aggregated.sort((a, b) =>
    new Date(a[timestampKey] as string | number | Date).getTime() - new Date(b[timestampKey] as string | number | Date).getTime()
  )
}

export function formatAxisLabel(dateStr: string, timeFrame: TimeFrame): string {
  const date = new Date(dateStr)
  const { value, unit } = parseTimeframe(timeFrame)
  const { aggregationType } = getIntervalAndPoints(timeFrame)

  if (unit === 'h') {
    if (value <= 12) {
      return date.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' })
    } else {
      return date.toLocaleTimeString('en-US', { hour: 'numeric' })
    }
  }

  if (unit === 'd' && value <= 7) {
    return date.toLocaleDateString('en-US', { weekday: 'short', hour: 'numeric' })
  }

  if ((unit === 'd' && value <= 90) || (unit === 'w' && value <= 12)) {
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
  }

  if (unit === 'm') {
    if (value <= 3) {
      return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
    } else if (value <= 12 && aggregationType === 'weekly') {
      const weekStart = new Date(date)
      weekStart.setDate(date.getDate() - date.getDay()) // Start of week (Sunday)
      return weekStart.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
    } else if (value <= 12) {
      return date.toLocaleDateString('en-US', { month: 'short' })
    } else {
      return date.toLocaleDateString('en-US', { month: 'short', year: '2-digit' })
    }
  }

  if (unit === 'y') {
    if (value === 1) {
      return date.toLocaleDateString('en-US', { month: 'short' })
    } else {
      return date.toLocaleDateString('en-US', { month: 'short', year: 'numeric' })
    }
  }

  return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
}

export function formatTooltipDateRange(
  payload: Array<{ payload?: Record<string, unknown> }> | undefined,
  label: string | undefined,
  timeFrame: TimeFrame
): string {
  if (payload && payload.length > 0 && payload[0].payload) {
    const data = payload[0].payload
    const startDate = data.__dateRangeStart as string | undefined
    const endDate = data.__dateRangeEnd as string | undefined
    const aggregationType = data.__aggregationType as string | undefined

    if (startDate && endDate && aggregationType !== 'none') {
      const start = new Date(startDate)
      const end = new Date(endDate)

      if (aggregationType === 'monthly') {
        return start.toLocaleDateString('en-US', {
          month: 'long',
          year: 'numeric'
        })
      } else if (aggregationType === 'weekly') {
        if (start.toDateString() === end.toDateString()) {
          return start.toLocaleDateString('en-US', {
            month: 'short',
            day: 'numeric',
            year: 'numeric'
          })
        }
        return `${start.toLocaleDateString('en-US', {
          month: 'short',
          day: 'numeric'
        })} - ${end.toLocaleDateString('en-US', {
          month: 'short',
          day: 'numeric',
          year: 'numeric'
        })}`
      } else if (aggregationType === 'daily') {
        return start.toLocaleDateString('en-US', {
          month: 'short',
          day: 'numeric',
          year: 'numeric'
        })
      } else if (aggregationType === 'hourly') {
        return start.toLocaleString('en-US', {
          month: 'short',
          day: 'numeric',
          year: 'numeric',
          hour: 'numeric',
          minute: '2-digit'
        })
      }
    }
  }

  if (!label) return ''

  const date = new Date(label)
  const { value, unit } = parseTimeframe(timeFrame)

  if (unit === 'm') {
    const { aggregationType } = getIntervalAndPoints(timeFrame)

    if (aggregationType === 'weekly') {
      const weekStart = new Date(date)
      weekStart.setDate(date.getDate() - date.getDay())
      const weekEnd = new Date(weekStart)
      weekEnd.setDate(weekStart.getDate() + 6)

      return `${weekStart.toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric'
      })} - ${weekEnd.toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
        year: 'numeric'
      })}`
    } else if (aggregationType === 'monthly') {
      if (value === 1) {
        return date.toLocaleDateString('en-US', {
          month: 'long'
        })
      } else {
        return date.toLocaleDateString('en-US', {
          month: 'long',
          year: 'numeric'
        })
      }
    } else {
      return date.toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
        year: 'numeric'
      })
    }
  }

  if (unit === 'y') {
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long'
    })
  }

  if (unit === 'h') {
    return date.toLocaleString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: 'numeric',
      minute: '2-digit'
    })
  }

  return date.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric'
  })
}

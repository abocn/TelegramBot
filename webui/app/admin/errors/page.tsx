'use client'

import { useState, useEffect, useCallback, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { toast } from 'sonner'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { useAuth } from '@/contexts/auth-context'
import { useRouter } from 'next/navigation'
import {
  AlertTriangle,
  CheckCircle,
  XCircle,
  Clock,
  RefreshCw,
  Trash2,
  Check,
  ChevronLeft,
  ChevronRight,
  ChevronsLeft,
  ChevronsRight,
  AlertCircle,
  Info,
  Search,
  Database,
  Terminal,
  List,
  SlidersHorizontal,
  Calendar,
  CheckCircle2,
  X
} from 'lucide-react'
import { Skeleton } from '@/components/ui/skeleton'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Checkbox } from '@/components/ui/checkbox'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Input } from '@/components/ui/input'
import {
  Drawer,
  DrawerClose,
  DrawerContent,
  DrawerDescription,
  DrawerFooter,
  DrawerHeader,
  DrawerTitle,
  DrawerTrigger,
} from '@/components/ui/drawer'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip'

interface BotError {
  id: string
  errorType: string
  errorMessage: string
  errorStack?: string
  commandName?: string
  chatType?: string
  severity: 'info' | 'warning' | 'error' | 'critical'
  resolved: boolean
  createdAt: string
  resolvedAt?: string
}

interface TelegramError {
  id: string
  errorCode?: number
  errorDescription: string
  method?: string
  parameters?: string
  retryCount: number
  resolved: boolean
  createdAt: string
  lastRetryAt?: string
}

interface ErrorStats {
  totalErrors: number
  unresolvedErrors: number
  resolvedToday: number
  criticalErrors: number
}

type ErrorSource = 'bot' | 'telegram' | 'all'
type TimeFrame = '1h' | '24h' | '7d' | '30d' | 'all'

const SEVERITY_CONFIG = {
  info: { color: 'bg-blue-500/10 text-blue-600 dark:text-blue-400 border-blue-500/20', icon: Info },
  warning: { color: 'bg-yellow-500/10 text-yellow-600 dark:text-yellow-400 border-yellow-500/20', icon: AlertCircle },
  error: { color: 'bg-red-500/10 text-red-600 dark:text-red-400 border-red-500/20', icon: XCircle },
  critical: { color: 'bg-purple-500/10 text-purple-600 dark:text-purple-400 border-purple-500/20', icon: AlertTriangle }
}

export default function ErrorReviewPage() {
  const { user, loading } = useAuth()
  const router = useRouter()

  // State
  const [errors, setErrors] = useState<(BotError | TelegramError)[]>([])
  const [stats, setStats] = useState<ErrorStats | null>(null)
  const [errorsLoading, setErrorsLoading] = useState(true)
  const [isRefreshing, setIsRefreshing] = useState(false)
  const [selectedErrors, setSelectedErrors] = useState<Set<string>>(new Set())
  const [showBulkActions, setShowBulkActions] = useState(false)
  const [isMobileFiltersOpen, setIsMobileFiltersOpen] = useState(false)

  // Filters
  const [errorSource, setErrorSource] = useState<ErrorSource>('all')
  const [timeFrame, setTimeFrame] = useState<TimeFrame>('7d')
  const [statusFilter, setStatusFilter] = useState<'all' | 'resolved' | 'unresolved'>('unresolved')
  const [severityFilter, setSeverityFilter] = useState<'all' | 'info' | 'warning' | 'error' | 'critical'>('all')
  const [searchQuery, setSearchQuery] = useState('')
  const [commandFilter, setCommandFilter] = useState('')

  // Pagination
  const [currentPage, setCurrentPage] = useState(1)
  const [pageSize, setPageSize] = useState(10)
  const [totalCount, setTotalCount] = useState(0)

  const searchTimeoutRef = useRef<NodeJS.Timeout | null>(null)

  useEffect(() => {
    if (!loading && (!user || !user.isAdmin)) {
      router.push('/account')
    }
  }, [user, loading, router])

  useEffect(() => {
    if (user?.isAdmin) {
      if (searchTimeoutRef.current) {
        clearTimeout(searchTimeoutRef.current)
      }

      if (searchQuery) {
        searchTimeoutRef.current = setTimeout(() => {
          fetchErrors()
        }, 500)
      } else {
        fetchErrors()
      }
    }

    return () => {
      if (searchTimeoutRef.current) {
        clearTimeout(searchTimeoutRef.current)
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user, searchQuery])

  useEffect(() => {
    if (user?.isAdmin) {
      fetchErrors()
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user, errorSource, timeFrame, statusFilter, severityFilter, currentPage, pageSize, commandFilter])

  useEffect(() => {
    setCurrentPage(1)
  }, [errorSource, timeFrame, statusFilter, severityFilter, searchQuery, commandFilter])

  useEffect(() => {
    setShowBulkActions(selectedErrors.size > 0)
  }, [selectedErrors])

  const fetchErrors = useCallback(async () => {
    try {
      setErrorsLoading(true)

      const params = new URLSearchParams({
        source: errorSource,
        timeframe: timeFrame,
        status: statusFilter,
        severity: severityFilter,
        page: currentPage.toString(),
        limit: pageSize.toString(),
        ...(searchQuery && { search: searchQuery }),
        ...(commandFilter && { command: commandFilter })
      })

      const response = await fetch(`/api/admin/errors?${params}`, {
        credentials: 'include'
      })

      if (!response.ok) {
        throw new Error('[!] Failed to fetch errors')
      }

      const data = await response.json()
      setErrors(data.errors)
      setStats(data.stats)
      setTotalCount(data.totalCount)
    } catch (err) {
      console.error('[!] Error fetching errors:', err)
    } finally {
      setErrorsLoading(false)
      setIsRefreshing(false)
    }
  }, [errorSource, timeFrame, statusFilter, severityFilter, currentPage, pageSize, searchQuery, commandFilter])

  const handleRefresh = () => {
    setIsRefreshing(true)
    fetchErrors()
  }

  const handleSearchKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      if (searchTimeoutRef.current) {
        clearTimeout(searchTimeoutRef.current)
      }
      fetchErrors()
    }
  }

  const handleSelectAll = () => {
    if (selectedErrors.size === errors.length) {
      setSelectedErrors(new Set())
    } else {
      setSelectedErrors(new Set(errors.map(e => e.id)))
    }
  }

  const handleSelectError = (id: string) => {
    const newSelected = new Set(selectedErrors)
    if (newSelected.has(id)) {
      newSelected.delete(id)
    } else {
      newSelected.add(id)
    }
    setSelectedErrors(newSelected)
  }

  const handleBulkResolve = async () => {
    try {
      const response = await fetch('/api/admin/errors', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({
          ids: Array.from(selectedErrors),
          action: 'resolve'
        })
      })

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ error: 'Unknown error' }))
        console.error('API Error:', errorData)
        throw new Error(errorData.error || 'Failed to resolve errors')
      }

      const result = await response.json()
      setSelectedErrors(new Set())
      fetchErrors()
      toast.success(`Successfully resolved ${result.updated || selectedErrors.size} error(s)`, {
        description: 'The selected errors have been marked as resolved',
        duration: 3000
      })
    } catch (err) {
      console.error('[!] Error resolving errors:', err)
      toast.error('Failed to resolve errors', {
        description: err instanceof Error ? err.message : 'An error occurred while resolving the selected errors',
        duration: 4000
      })
    }
  }

  const handleBulkDelete = async () => {
    if (!confirm(`Are you sure you want to delete ${selectedErrors.size} error(s)? This action cannot be undone.`)) {
      return
    }

    try {
      const response = await fetch('/api/admin/errors', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({
          ids: Array.from(selectedErrors)
        })
      })

      if (!response.ok) {
        throw new Error('Failed to delete errors')
      }

      const result = await response.json()
      setSelectedErrors(new Set())
      fetchErrors()
      toast.success(`Successfully deleted ${result.deleted || selectedErrors.size} error(s)`, {
        description: 'The selected errors have been permanently removed',
        duration: 3000
      })
    } catch (err) {
      console.error('[!] Error deleting errors:', err)
      toast.error('Failed to delete errors', {
        description: 'An error occurred while deleting the selected errors',
        duration: 4000
      })
    }
  }

  const handleQuickResolve = async (id: string) => {
    try {
      const response = await fetch('/api/admin/errors', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({
          ids: [id],
          action: 'resolve'
        })
      })

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ error: 'Unknown error' }))
        console.error('API Error:', errorData)
        throw new Error(errorData.error || 'Failed to resolve error')
      }

      fetchErrors()
      toast.success('Error resolved', {
        description: 'The error has been marked as resolved',
        duration: 2500
      })
    } catch (err) {
      console.error('Error resolving error:', err)
      toast.error('Failed to resolve error', {
        description: err instanceof Error ? err.message : 'An error occurred while resolving this error',
        duration: 3000
      })
    }
  }

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr)
    return date.toLocaleString('en-US', {
      month: 'short',
      day: 'numeric',
      hour: 'numeric',
      minute: '2-digit'
    })
  }

  const totalPages = Math.ceil(totalCount / pageSize)

  useEffect(() => {
    if (totalPages > 0 && currentPage > totalPages) {
      setCurrentPage(Math.max(1, totalPages))
    }
  }, [totalPages, currentPage])

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center space-y-4">
          <div className="relative">
            <div className="w-16 h-16 border-4 border-primary/20 rounded-full"></div>
            <div className="w-16 h-16 border-4 border-primary border-t-transparent rounded-full animate-spin absolute top-0"></div>
          </div>
          <p className="text-muted-foreground animate-pulse">Loading...</p>
        </div>
      </div>
    )
  }

  if (!user || !user.isAdmin) {
    return null
  }

  const isBotError = (error: BotError | TelegramError): error is BotError => {
    return 'errorType' in error
  }

  return (
    <div className="w-full min-h-screen bg-background">
      <div className="container mx-auto px-4 sm:px-6 py-4 sm:py-8">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3 }}
          className="mb-6"
        >
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 sm:gap-4">
            <div className="flex items-center gap-3 sm:gap-4">
              <div className="w-12 h-12 sm:w-16 sm:h-16 rounded-full bg-red-500/10 items-center justify-center flex">
                <AlertTriangle className="w-6 h-6 sm:w-8 sm:h-8 text-red-600 dark:text-red-400" />
              </div>
              <div className="flex-1">
                <h1 className="text-2xl sm:text-3xl font-bold">Error Review</h1>
                <p className="text-muted-foreground">Manage and resolve system errors</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Button
                onClick={handleRefresh}
                disabled={isRefreshing}
                variant="outline"
                size="sm"
                className="h-8"
              >
                <RefreshCw className={`w-4 h-4 ${isRefreshing ? 'animate-spin' : ''}`} />
                Refresh
              </Button>
            </div>
          </div>
        </motion.div>

        <div className="grid gap-4 sm:gap-6 md:grid-cols-2 lg:grid-cols-4 mb-6">
          {[
            {
              title: 'Total Errors',
              value: stats?.totalErrors || 0,
              icon: <AlertTriangle className="w-5 h-5" />,
              color: 'from-red-500/10 to-rose-500/10',
              iconColor: 'text-red-600 dark:text-red-400'
            },
            {
              title: 'Unresolved',
              value: stats?.unresolvedErrors || 0,
              icon: <XCircle className="w-5 h-5" />,
              color: 'from-orange-500/10 to-amber-500/10',
              iconColor: 'text-orange-600 dark:text-orange-400'
            },
            {
              title: 'Resolved Today',
              value: stats?.resolvedToday || 0,
              icon: <CheckCircle className="w-5 h-5" />,
              color: 'from-green-500/10 to-emerald-500/10',
              iconColor: 'text-green-600 dark:text-green-400'
            },
            {
              title: 'Critical Errors',
              value: stats?.criticalErrors || 0,
              icon: <AlertCircle className="w-5 h-5" />,
              color: 'from-purple-500/10 to-indigo-500/10',
              iconColor: 'text-purple-600 dark:text-purple-400'
            }
          ].map((card, index) => (
            <motion.div
              key={card.title}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3, delay: index * 0.05 }}
            >
              <Card className={`bg-gradient-to-br ${card.color} border-muted`}>
                <CardHeader className="pb-3">
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-sm font-medium text-muted-foreground">
                      {card.title}
                    </CardTitle>
                    <div className={card.iconColor}>
                      {card.icon}
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{card.value}</div>
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </div>

        <Card className="mb-3 hidden md:block">
          <CardContent className="-mt-1 -mb-2 -mx-1">
            <div className="flex justify-between gap-4">
              <div className="flex gap-4">
                <Select value={errorSource} onValueChange={(value) => setErrorSource(value as ErrorSource)}>
                  <SelectTrigger className="h-11">
                    <div className="flex items-center gap-2">
                      <Database className="w-4 h-4 text-muted-foreground" />
                      <SelectValue placeholder="Source" />
                    </div>
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Sources</SelectItem>
                    <SelectItem value="bot">Bot Errors</SelectItem>
                    <SelectItem value="telegram">Telegram Errors</SelectItem>
                  </SelectContent>
                </Select>
                <Select value={timeFrame} onValueChange={(value) => setTimeFrame(value as TimeFrame)}>
                  <SelectTrigger className="h-11">
                    <div className="flex items-center gap-2">
                      <Calendar className="w-4 h-4 text-muted-foreground" />
                      <SelectValue placeholder="Time" />
                    </div>
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="1h">Last Hour</SelectItem>
                    <SelectItem value="24h">Last 24 Hours</SelectItem>
                    <SelectItem value="7d">Last 7 Days</SelectItem>
                    <SelectItem value="30d">Last 30 Days</SelectItem>
                    <SelectItem value="all">All Time</SelectItem>
                  </SelectContent>
                </Select>
                <Select value={statusFilter} onValueChange={(value) => setStatusFilter(value as typeof statusFilter)}>
                  <SelectTrigger className="h-11">
                    <div className="flex items-center gap-2">
                      <CheckCircle2 className="w-4 h-4 text-muted-foreground" />
                      <SelectValue placeholder="Status" />
                    </div>
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Status</SelectItem>
                    <SelectItem value="unresolved">Unresolved</SelectItem>
                    <SelectItem value="resolved">Resolved</SelectItem>
                  </SelectContent>
                </Select>
                <Select value={severityFilter} onValueChange={(value) => setSeverityFilter(value as typeof severityFilter)}>
                  <SelectTrigger className="h-11">
                    <div className="flex items-center gap-2">
                      <AlertTriangle className="w-4 h-4 text-muted-foreground" />
                      <SelectValue placeholder="Severity" />
                    </div>
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Severities</SelectItem>
                    <SelectItem value="critical">Critical</SelectItem>
                    <SelectItem value="error">Error</SelectItem>
                    <SelectItem value="warning">Warning</SelectItem>
                    <SelectItem value="info">Info</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="flex gap-4">
                <div className="relative">
                  <Terminal className="absolute left-3 top-2.5 w-4 h-4 text-muted-foreground" />
                  <Input
                    placeholder="Search commands..."
                    value={commandFilter}
                    onChange={(e) => setCommandFilter(e.target.value)}
                    className="h-8.5 pl-10 pr-8"
                  />
                  {commandFilter && (
                    <button
                      onClick={() => setCommandFilter('')}
                      className="absolute right-2 top-2.5 w-4 h-4 text-muted-foreground hover:text-foreground"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  )}
                </div>
                <div className="relative">
                  <Search className="absolute left-3 top-2 w-4 h-4 text-muted-foreground" />
                  <Input
                    placeholder="Search errors..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    onKeyDown={handleSearchKeyDown}
                    className="h-8.5 pl-10 pr-8"
                  />
                  {searchQuery && (
                    <button
                      onClick={() => setSearchQuery('')}
                      className="absolute right-2 top-2.5 w-4 h-4 text-muted-foreground hover:text-foreground"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  )}
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        <div className="mb-6 md:hidden">
          <Drawer open={isMobileFiltersOpen} onOpenChange={setIsMobileFiltersOpen}>
            <DrawerTrigger asChild>
              <Button variant="outline" className="w-full">
                <SlidersHorizontal className="w-4 h-4 mr-2" />
                Filters
                {(errorSource !== 'all' || timeFrame !== '7d' || statusFilter !== 'unresolved' || severityFilter !== 'all' || commandFilter || searchQuery) && (
                  <span className="ml-2 bg-primary text-primary-foreground rounded-full w-5 h-5 text-xs flex items-center justify-center">
                    {[errorSource !== 'all', timeFrame !== '7d', statusFilter !== 'unresolved', severityFilter !== 'all', commandFilter, searchQuery].filter(Boolean).length}
                  </span>
                )}
              </Button>
            </DrawerTrigger>
            <DrawerContent>
              <DrawerHeader>
                <DrawerTitle className="flex items-center gap-2">
                  <SlidersHorizontal className="w-5 h-5" />
                  Filter Errors
                </DrawerTitle>
                <DrawerDescription>
                  Refine your error view to focus on what matters most
                </DrawerDescription>
              </DrawerHeader>
              <div className="px-4 pb-4 space-y-4">
                <div className="grid grid-cols-2 gap-3">
                  <Select value={errorSource} onValueChange={(value) => setErrorSource(value as ErrorSource)}>
                    <SelectTrigger className="h-11">
                      <div className="flex items-center gap-2">
                        <Database className="w-4 h-4 text-muted-foreground" />
                        <SelectValue placeholder="Source" />
                      </div>
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Sources</SelectItem>
                      <SelectItem value="bot">Bot Errors</SelectItem>
                      <SelectItem value="telegram">Telegram Errors</SelectItem>
                    </SelectContent>
                  </Select>
                  <Select value={timeFrame} onValueChange={(value) => setTimeFrame(value as TimeFrame)}>
                    <SelectTrigger className="h-11">
                      <div className="flex items-center gap-2">
                        <Calendar className="w-4 h-4 text-muted-foreground" />
                        <SelectValue placeholder="Time" />
                      </div>
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="1h">Last Hour</SelectItem>
                      <SelectItem value="24h">Last 24 Hours</SelectItem>
                      <SelectItem value="7d">Last 7 Days</SelectItem>
                      <SelectItem value="30d">Last 30 Days</SelectItem>
                      <SelectItem value="all">All Time</SelectItem>
                    </SelectContent>
                  </Select>
                  <Select value={statusFilter} onValueChange={(value) => setStatusFilter(value as typeof statusFilter)}>
                    <SelectTrigger className="h-11">
                      <div className="flex items-center gap-2">
                        <CheckCircle2 className="w-4 h-4 text-muted-foreground" />
                        <SelectValue placeholder="Status" />
                      </div>
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Status</SelectItem>
                      <SelectItem value="unresolved">Unresolved</SelectItem>
                      <SelectItem value="resolved">Resolved</SelectItem>
                    </SelectContent>
                  </Select>
                  <Select value={severityFilter} onValueChange={(value) => setSeverityFilter(value as typeof severityFilter)}>
                    <SelectTrigger className="h-11">
                      <div className="flex items-center gap-2">
                        <AlertTriangle className="w-4 h-4 text-muted-foreground" />
                        <SelectValue placeholder="Severity" />
                      </div>
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Severities</SelectItem>
                      <SelectItem value="critical">Critical</SelectItem>
                      <SelectItem value="error">Error</SelectItem>
                      <SelectItem value="warning">Warning</SelectItem>
                      <SelectItem value="info">Info</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-3">
                  <div className="relative">
                    <Terminal className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                    <Input
                      placeholder="Search commands..."
                      value={commandFilter}
                      onChange={(e) => setCommandFilter(e.target.value)}
                      className="h-11 pl-10 pr-8 text-base"
                    />
                    {commandFilter && (
                      <button
                        onClick={() => setCommandFilter('')}
                        className="absolute right-2 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground hover:text-foreground"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    )}
                  </div>
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                    <Input
                      placeholder="Search errors..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      onKeyDown={handleSearchKeyDown}
                      className="h-11 pl-10 pr-8 text-base"
                    />
                    {searchQuery && (
                      <button
                        onClick={() => setSearchQuery('')}
                        className="absolute right-2 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground hover:text-foreground"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    )}
                  </div>
                </div>
              </div>
              <DrawerFooter>
                <div className="flex gap-2">
                  <Button 
                    onClick={() => {
                      setErrorSource('all')
                      setTimeFrame('7d')
                      setStatusFilter('unresolved')
                      setSeverityFilter('all')
                      setCommandFilter('')
                      setSearchQuery('')
                      setPageSize(10)
                    }}
                    variant="outline"
                    className="flex-1"
                  >
                    Reset All
                  </Button>
                  <DrawerClose asChild>
                    <Button className="flex-1">
                      Apply Filters
                    </Button>
                  </DrawerClose>
                </div>
              </DrawerFooter>
            </DrawerContent>
          </Drawer>
        </div>

        <AnimatePresence>
          {showBulkActions && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="mb-4"
            >
              <Card className="border-primary/20 bg-primary/5">
                <CardContent className="py-3">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium">
                      {selectedErrors.size} item(s) selected
                    </span>
                    <div className="flex gap-2">
                      <Button
                        onClick={handleBulkResolve}
                        size="sm"
                        variant="outline"
                        className="h-8"
                      >
                        <Check className="w-4 h-4 mr-1" />
                        Resolve Selected
                      </Button>
                      <Button
                        onClick={handleBulkDelete}
                        size="sm"
                        variant="destructive"
                        className="h-8"
                      >
                        <Trash2 className="w-4 h-4 mr-1" />
                        Delete Selected
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          )}
        </AnimatePresence>

        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <CardTitle>Errors</CardTitle>
                <Badge variant="secondary">{totalCount} total</Badge>
              </div>
              <div className="block">
                <Select value={pageSize.toString()} onValueChange={(value) => setPageSize(parseInt(value))}>
                  <SelectTrigger className="w-32 md:w-40">
                    <div className="flex items-center gap-2">
                      <List className="w-4 h-4 text-muted-foreground" />
                      <span className="hidden sm:inline">{pageSize} per page</span>
                      <span className="sm:hidden">{pageSize}</span>
                    </div>
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="5">5 per page</SelectItem>
                    <SelectItem value="10">10 per page</SelectItem>
                    <SelectItem value="25">25 per page</SelectItem>
                    <SelectItem value="50">50 per page</SelectItem>
                    <SelectItem value="100">100 per page</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            {errorsLoading ? (
              <div className="space-y-3">
                {[1, 2, 3, 4, 5].map((i) => (
                  <Skeleton key={i} className="h-16 w-full" />
                ))}
              </div>
            ) : errors.length === 0 ? (
              <div className="text-center py-12">
                <CheckCircle className="w-12 h-12 text-green-500 mx-auto mb-4" />
                <p className="text-lg font-medium">No errors found</p>
                <p className="text-muted-foreground">Great! Your system is running smoothly.</p>
              </div>
            ) : (
              <>
                <div className="rounded-md border">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead className="w-12">
                          <Checkbox
                            checked={selectedErrors.size === errors.length && errors.length > 0}
                            onCheckedChange={handleSelectAll}
                          />
                        </TableHead>
                        <TableHead>Type</TableHead>
                        <TableHead>Message</TableHead>
                        <TableHead>Command</TableHead>
                        <TableHead>Severity</TableHead>
                        <TableHead>Time</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead className="text-right">Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {errors.map((error) => {
                        const isBot = isBotError(error)
                        const severity = isBot ? error.severity : 'error'
                        const severityConfig = SEVERITY_CONFIG[severity]
                        const SeverityIcon = severityConfig.icon

                        return (
                          <TableRow key={error.id}>
                            <TableCell>
                              <Checkbox
                                checked={selectedErrors.has(error.id)}
                                onCheckedChange={() => handleSelectError(error.id)}
                              />
                            </TableCell>
                            <TableCell className="font-mono text-sm">
                              {isBot ? error.errorType : `Telegram ${error.errorCode || 'Error'}`}
                            </TableCell>
                            <TableCell className="max-w-xs truncate">
                              <TooltipProvider>
                                <Tooltip>
                                  <TooltipTrigger className="text-left">
                                    {isBot ? error.errorMessage : error.errorDescription}
                                  </TooltipTrigger>
                                  <TooltipContent className="max-w-md">
                                    <p className="whitespace-pre-wrap break-words">
                                      {isBot ? error.errorMessage : error.errorDescription}
                                    </p>
                                  </TooltipContent>
                                </Tooltip>
                              </TooltipProvider>
                            </TableCell>
                            <TableCell>
                              {isBot ? (
                                error.commandName ? (
                                  <Badge variant="outline">{error.commandName}</Badge>
                                ) : (
                                  <span className="text-muted-foreground">-</span>
                                )
                              ) : (
                                error.method ? (
                                  <Badge variant="outline">{error.method}</Badge>
                                ) : (
                                  <span className="text-muted-foreground">-</span>
                                )
                              )}
                            </TableCell>
                            <TableCell>
                              <Badge className={`${severityConfig.color} gap-1`}>
                                <SeverityIcon className="w-3 h-3" />
                                {severity}
                              </Badge>
                            </TableCell>
                            <TableCell className="text-sm">
                              {formatDate(error.createdAt)}
                            </TableCell>
                            <TableCell>
                              {error.resolved ? (
                                <Badge variant="outline" className="gap-1 border-green-500/20 text-green-600 dark:text-green-400">
                                  <CheckCircle className="w-3 h-3" />
                                  Resolved
                                </Badge>
                              ) : (
                                <Badge variant="outline" className="gap-1 border-orange-500/20 text-orange-600 dark:text-orange-400">
                                  <Clock className="w-3 h-3" />
                                  Pending
                                </Badge>
                              )}
                            </TableCell>
                            <TableCell className="text-right">
                              {!error.resolved && (
                                <Button
                                  onClick={() => handleQuickResolve(error.id)}
                                  size="sm"
                                  variant="ghost"
                                  className="h-8"
                                >
                                  <Check className="w-4 h-4" />
                                </Button>
                              )}
                            </TableCell>
                          </TableRow>
                        )
                      })}
                    </TableBody>
                  </Table>
                </div>

                <div className="flex items-center justify-between mt-4">
                  <p className="text-sm text-muted-foreground">
                    Showing {((currentPage - 1) * pageSize) + 1} to {Math.min(currentPage * pageSize, totalCount)} of {totalCount} errors
                  </p>
                  <div className="flex items-center gap-1 sm:gap-2">
                    <Button
                      onClick={() => setCurrentPage(1)}
                      disabled={currentPage === 1 || totalPages === 0}
                      size="sm"
                      variant="outline"
                      className="px-2 sm:px-3"
                    >
                      <ChevronsLeft className="w-4 h-4" />
                    </Button>
                    <Button
                      onClick={() => setCurrentPage(currentPage - 1)}
                      disabled={currentPage === 1 || totalPages === 0}
                      size="sm"
                      variant="outline"
                      className="px-2 sm:px-3"
                    >
                      <ChevronLeft className="w-4 h-4" />
                    </Button>
                    <span className="text-xs sm:text-sm px-2 sm:px-3 whitespace-nowrap">
                      {totalPages > 0 ? `${currentPage} of ${totalPages}` : '0 of 0'}
                    </span>
                    <Button
                      onClick={() => setCurrentPage(currentPage + 1)}
                      disabled={currentPage === totalPages || totalPages === 0}
                      size="sm"
                      variant="outline"
                      className="px-2 sm:px-3"
                    >
                      <ChevronRight className="w-4 h-4" />
                    </Button>
                    <Button
                      onClick={() => setCurrentPage(totalPages)}
                      disabled={currentPage === totalPages || totalPages === 0}
                      size="sm"
                      variant="outline"
                      className="px-2 sm:px-3"
                    >
                      <ChevronsRight className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              </>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
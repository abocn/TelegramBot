'use client'

import { useEffect } from 'react'
import { motion } from 'framer-motion'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { useAuth } from '@/contexts/auth-context'
import { useRouter } from 'next/navigation'
import { useAdminJobs } from '@/hooks/use-admin-jobs'
import {
  Briefcase,
  RefreshCw,
  Database,
  CheckCircle,
  XCircle,
  Clock
} from 'lucide-react'
import { useTranslation } from 'react-i18next'

export default function JobsPage() {
  const { user, loading } = useAuth()
  const router = useRouter()
  const { t } = useTranslation()
  const { runJob, isJobRunning, getJobResult } = useAdminJobs()

  useEffect(() => {
    if (!loading && (!user || !user.isAdmin)) {
      router.push('/account')
    }
  }, [user, loading, router])


  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">{t('adminJobs.loading')}</p>
        </div>
      </div>
    )
  }

  if (!user || !user.isAdmin) {
    return null
  }

  const jobs = [
    {
      id: 'sync-admins',
      title: t('adminJobs.syncAdminStatus'),
      description: t('adminJobs.syncAdminStatusDescription'),
      icon: <Database className="w-5 h-5" />,
      color: 'from-blue-500/10 to-indigo-500/10'
    },
    {
      id: 'cleanup-sessions',
      title: t('adminJobs.cleanupExpiredSessions'),
      description: t('adminJobs.cleanupExpiredSessionsDescription'),
      icon: <RefreshCw className="w-5 h-5" />,
      color: 'from-green-500/10 to-teal-500/10'
    },
    {
      id: 'clear-cache',
      title: t('adminJobs.clearWikiCache'),
      description: t('adminJobs.clearWikiCacheDescription'),
      icon: <Database className="w-5 h-5" />,
      color: 'from-purple-500/10 to-pink-500/10'
    },
    {
      id: 'clear-wiki-pagination',
      title: t('adminJobs.clearWikiPagination'),
      description: t('adminJobs.clearWikiPaginationDescription'),
      icon: <Database className="w-5 h-5" />,
      color: 'from-orange-500/10 to-amber-500/10'
    }
  ]

  return (
    <div className="w-full min-h-screen bg-background">
      <div className="container mx-auto px-4 sm:px-6 py-4 sm:py-8">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3 }}
          className="mb-6 sm:mb-8"
        >
          <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3 sm:gap-4">
            <div className="w-12 h-12 sm:w-16 sm:h-16 rounded-full bg-primary/10 items-center justify-center flex sm:hidden md:flex">
              <Briefcase className="w-6 h-6 sm:w-8 sm:h-8 text-primary" />
            </div>
            <div className="flex-1">
              <h1 className="text-2xl sm:text-3xl font-bold">{t('adminJobs.title')}</h1>
            </div>
          </div>
        </motion.div>

        <div className="grid gap-4 sm:gap-6 md:grid-cols-2 lg:grid-cols-3">
          {jobs.map((job, index) => {
            const isRunning = isJobRunning(job.id)
            const result = getJobResult(job.id)

            return (
              <motion.div
                key={job.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3, delay: index * 0.05 }}
              >
                <Card className={`bg-gradient-to-br ${job.color} border-muted`}>
                  <CardHeader>
                    <div className="flex items-start justify-between">
                      <div className="w-10 h-10 rounded-lg bg-background/50 flex items-center justify-center">
                        {job.icon}
                      </div>
                      {result && (
                        <div className="flex items-center gap-1">
                          {result.success ? (
                            <CheckCircle className="w-4 h-4 text-green-600 dark:text-green-400" />
                          ) : (
                            <XCircle className="w-4 h-4 text-red-600 dark:text-red-400" />
                          )}
                        </div>
                      )}
                    </div>
                    <CardTitle className="text-lg">{job.title}</CardTitle>
                    <CardDescription className="text-sm">
                      {job.description}
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    {result && (
                      <div className={`mb-3 p-2 rounded text-xs ${
                        result.success 
                          ? 'bg-green-500/10 text-green-700 dark:text-green-300' 
                          : 'bg-red-500/10 text-red-700 dark:text-red-300'
                      }`}>
                        <div className="font-medium">{result.message}</div>
                        <div className="text-xs opacity-70 mt-1">
                          {new Date(result.timestamp).toLocaleTimeString()}
                        </div>
                      </div>
                    )}
                    <Button
                      onClick={() => runJob(job.id, job.title)}
                      disabled={isRunning}
                      className="w-full"
                      variant={isRunning ? "secondary" : "default"}
                    >
                      {isRunning ? (
                        <>
                          <Clock className="w-4 h-4 mr-2 animate-spin" />
                          {t('adminJobs.running')}
                        </>
                      ) : (
                        <>
                          <RefreshCw className="w-4 h-4 mr-2" />
                          {t('adminJobs.runJob')}
                        </>
                      )}
                    </Button>
                  </CardContent>
                </Card>
              </motion.div>
            )
          })}
        </div>
      </div>
    </div>
  )
}
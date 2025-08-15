"use client";

import { useState, useCallback } from 'react';

interface JobResult {
  success: boolean;
  message: string;
  timestamp: Date;
}

interface UseAdminJobsReturn {
  runJob: (jobId: string, jobName: string) => Promise<void>;
  isJobRunning: (jobId: string) => boolean;
  getJobResult: (jobId: string) => JobResult | null;
  clearJobResult: (jobId: string) => void;
}

export function useAdminJobs(): UseAdminJobsReturn {
  const [runningJobs, setRunningJobs] = useState<Set<string>>(new Set());
  const [jobResults, setJobResults] = useState<Record<string, JobResult>>({});

  const runJob = useCallback(async (jobId: string, jobName: string): Promise<void> => {
    setRunningJobs(prev => new Set(prev).add(jobId));

    try {
      const response = await fetch('/api/admin/jobs', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ jobId }),
        credentials: 'include'
      });

      const data = await response.json();

      setJobResults(prev => ({
        ...prev,
        [jobId]: {
          success: response.ok,
          message: data.message || (response.ok ? `${jobName} completed successfully` : `Failed to run ${jobName}`),
          timestamp: new Date()
        }
      }));
    } catch (error) {
      setJobResults(prev => ({
        ...prev,
        [jobId]: {
          success: false,
          message: `Error running ${jobName}: ${error}`,
          timestamp: new Date()
        }
      }));
    } finally {
      setRunningJobs(prev => {
        const newSet = new Set(prev);
        newSet.delete(jobId);
        return newSet;
      });
    }
  }, []);

  const isJobRunning = useCallback((jobId: string): boolean => {
    return runningJobs.has(jobId);
  }, [runningJobs]);

  const getJobResult = useCallback((jobId: string): JobResult | null => {
    return jobResults[jobId] || null;
  }, [jobResults]);

  const clearJobResult = useCallback((jobId: string): void => {
    setJobResults(prev => {
      const newResults = { ...prev };
      delete newResults[jobId];
      return newResults;
    });
  }, []);

  return {
    runJob,
    isJobRunning,
    getJobResult,
    clearJobResult
  };
}
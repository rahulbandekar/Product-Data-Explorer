'use client';

import { useState, useEffect } from 'react';
import { apiService, ScrapeJob } from '@/services/api.service';
import { CheckCircle, XCircle, Clock, RefreshCw } from 'lucide-react';

interface ScrapeStatusProps {
  jobId: string;
  onComplete?: () => void;
}

export default function ScrapeStatus({ jobId, onComplete }: ScrapeStatusProps) {
  const [job, setJob] = useState<ScrapeJob | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [polling, setPolling] = useState(true);

  useEffect(() => {
    if (!jobId || !polling) return;

    const pollJob = async () => {
      try {
        const response = await apiService.getScrapeJob(jobId);
        if (response.success && response.data) {
          setJob(response.data);
          
          // If job is completed or failed, stop polling
          if (['SUCCESS', 'FAILED', 'SKIPPED'].includes(response.data.status)) {
            setPolling(false);
            if (onComplete) {
              setTimeout(onComplete, 1000);
            }
          }
        } else {
          setError(response.error || 'Failed to fetch job status');
        }
      } catch (err: any) {
        setError(err.message);
        setPolling(false);
      }
    };

    pollJob();
    const interval = setInterval(pollJob, 2000); // Poll every 2 seconds

    return () => clearInterval(interval);
  }, [jobId, polling, onComplete]);

  const getStatusIcon = () => {
    if (!job) return <Clock className="h-5 w-5 text-gray-400" />;
    
    switch (job.status) {
      case 'SUCCESS':
        return <CheckCircle className="h-5 w-5 text-green-500" />;
      case 'FAILED':
        return <XCircle className="h-5 w-5 text-red-500" />;
      case 'SKIPPED':
        return <CheckCircle className="h-5 w-5 text-yellow-500" />;
      case 'RUNNING':
        return <RefreshCw className="h-5 w-5 text-blue-500 animate-spin" />;
      default:
        return <Clock className="h-5 w-5 text-gray-400" />;
    }
  };

  const getStatusColor = () => {
    if (!job) return 'bg-gray-100 text-gray-800';
    
    switch (job.status) {
      case 'SUCCESS': return 'bg-green-100 text-green-800';
      case 'FAILED': return 'bg-red-100 text-red-800';
      case 'SKIPPED': return 'bg-yellow-100 text-yellow-800';
      case 'RUNNING': return 'bg-blue-100 text-blue-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  if (!job && !error) {
    return (
      <div className="flex items-center space-x-2 text-sm text-gray-600">
        <Clock className="h-4 w-4 animate-pulse" />
        <span>Waiting for job to start...</span>
      </div>
    );
  }

  return (
    <div className="space-y-2">
      {job && (
        <div className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${getStatusColor()}`}>
          {getStatusIcon()}
          <span className="ml-2">{job.status}</span>
          {job.status === 'RUNNING' && (
            <span className="ml-2 animate-pulse">Processing...</span>
          )}
        </div>
      )}
      
      {job?.errorLog && (
        <div className="text-sm text-red-600 bg-red-50 p-2 rounded">
          Error: {job.errorLog}
        </div>
      )}
      
      {error && (
        <div className="text-sm text-red-600 bg-red-50 p-2 rounded">
          {error}
        </div>
      )}
      
      <div className="text-xs text-gray-500">
        Job ID: {jobId}
        {job?.startedAt && (
          <span className="ml-2">
            Started: {new Date(job.startedAt).toLocaleTimeString()}
          </span>
        )}
      </div>
    </div>
  );
}
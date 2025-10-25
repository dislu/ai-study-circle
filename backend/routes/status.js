const express = require('express');
const jobManager = require('../utils/JobManager');

const router = express.Router();

// Get job status by ID
router.get('/:jobId', (req, res) => {
  try {
    const { jobId } = req.params;
    const job = jobManager.getJob(jobId);

    if (!job) {
      return res.status(404).json({ error: 'Job not found' });
    }

    // Return job information
    res.json({
      jobId: job.id,
      type: job.type,
      status: job.status,
      progress: job.progress,
      createdAt: job.createdAt,
      updatedAt: job.updatedAt,
      result: job.result,
      error: job.error,
      data: {
        // Only return safe data fields
        originalName: job.data.originalName,
        fileSize: job.data.fileSize,
        options: job.data.options,
        contentLength: job.data.contentLength
      }
    });

  } catch (error) {
    console.error('Status check error:', error);
    res.status(500).json({ 
      error: 'Failed to check job status',
      message: error.message 
    });
  }
});

// Get multiple job statuses
router.post('/batch', (req, res) => {
  try {
    const { jobIds } = req.body;

    if (!Array.isArray(jobIds)) {
      return res.status(400).json({ error: 'jobIds must be an array' });
    }

    const jobs = {};
    jobIds.forEach(jobId => {
      const job = jobManager.getJob(jobId);
      if (job) {
        jobs[jobId] = {
          jobId: job.id,
          type: job.type,
          status: job.status,
          progress: job.progress,
          updatedAt: job.updatedAt,
          hasResult: !!job.result,
          hasError: !!job.error
        };
      } else {
        jobs[jobId] = { error: 'Job not found' };
      }
    });

    res.json({ jobs });

  } catch (error) {
    console.error('Batch status check error:', error);
    res.status(500).json({ 
      error: 'Failed to check job statuses',
      message: error.message 
    });
  }
});

// Get jobs by type
router.get('/type/:type', (req, res) => {
  try {
    const { type } = req.params;
    const { limit = 50, status } = req.query;

    let jobs = jobManager.getJobsByType(type);

    // Filter by status if provided
    if (status) {
      jobs = jobs.filter(job => job.status === status);
    }

    // Limit results
    jobs = jobs.slice(0, parseInt(limit));

    // Return summary information only
    const jobSummaries = jobs.map(job => ({
      jobId: job.id,
      status: job.status,
      progress: job.progress,
      createdAt: job.createdAt,
      updatedAt: job.updatedAt,
      hasResult: !!job.result,
      hasError: !!job.error
    }));

    res.json({
      type,
      count: jobSummaries.length,
      jobs: jobSummaries
    });

  } catch (error) {
    console.error('Jobs by type error:', error);
    res.status(500).json({ 
      error: 'Failed to get jobs by type',
      message: error.message 
    });
  }
});

// Get system statistics
router.get('/system/stats', (req, res) => {
  try {
    const stats = jobManager.getStats();
    
    // Add system information
    const systemStats = {
      ...stats,
      uptime: process.uptime(),
      memory: process.memoryUsage(),
      timestamp: new Date().toISOString(),
      version: process.env.npm_package_version || '1.0.0'
    };

    res.json(systemStats);

  } catch (error) {
    console.error('System stats error:', error);
    res.status(500).json({ 
      error: 'Failed to get system statistics',
      message: error.message 
    });
  }
});

// Cancel a job (for long-running processes)
router.delete('/:jobId', (req, res) => {
  try {
    const { jobId } = req.params;
    const job = jobManager.getJob(jobId);

    if (!job) {
      return res.status(404).json({ error: 'Job not found' });
    }

    if (job.status === 'completed' || job.status === 'failed') {
      return res.status(400).json({ error: 'Cannot cancel completed or failed job' });
    }

    // Mark job as cancelled
    jobManager.updateJob(jobId, { 
      status: 'cancelled',
      error: 'Job cancelled by user request',
      updatedAt: new Date()
    });

    res.json({
      success: true,
      message: 'Job cancelled successfully',
      jobId
    });

  } catch (error) {
    console.error('Job cancellation error:', error);
    res.status(500).json({ 
      error: 'Failed to cancel job',
      message: error.message 
    });
  }
});

// Clear completed jobs
router.delete('/system/cleanup', (req, res) => {
  try {
    const { olderThan = 3600 } = req.query; // Default: 1 hour in seconds
    const cutoffTime = new Date(Date.now() - (parseInt(olderThan) * 1000));

    let deletedCount = 0;
    const allJobs = jobManager.getAllJobs();

    allJobs.forEach(job => {
      if ((job.status === 'completed' || job.status === 'failed') && 
          job.updatedAt < cutoffTime) {
        jobManager.deleteJob(job.id);
        deletedCount++;
      }
    });

    res.json({
      success: true,
      message: `Cleaned up ${deletedCount} old jobs`,
      deletedCount,
      cutoffTime: cutoffTime.toISOString()
    });

  } catch (error) {
    console.error('Cleanup error:', error);
    res.status(500).json({ 
      error: 'Failed to cleanup jobs',
      message: error.message 
    });
  }
});

module.exports = router;
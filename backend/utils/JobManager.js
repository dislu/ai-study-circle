const { v4: uuidv4 } = require('uuid');

class JobManager {
  constructor() {
    this.jobs = new Map();
    this.cleanupInterval = setInterval(() => this.cleanup(), 5 * 60 * 1000); // Cleanup every 5 minutes
  }

  createJob(type, data = {}) {
    const job = {
      id: uuidv4(),
      type,
      status: 'created',
      progress: 0,
      data,
      createdAt: new Date(),
      updatedAt: new Date(),
      result: null,
      error: null
    };

    this.jobs.set(job.id, job);
    return job;
  }

  getJob(jobId) {
    return this.jobs.get(jobId) || null;
  }

  updateJob(jobId, updates) {
    const job = this.jobs.get(jobId);
    if (!job) return null;

    const updatedJob = {
      ...job,
      ...updates,
      updatedAt: new Date()
    };

    this.jobs.set(jobId, updatedJob);
    return updatedJob;
  }

  setJobStatus(jobId, status, progress = null, error = null) {
    const updates = { status };
    if (progress !== null) updates.progress = progress;
    if (error) updates.error = error;
    if (status === 'failed' && error) updates.error = error;
    
    return this.updateJob(jobId, updates);
  }

  setJobResult(jobId, result) {
    return this.updateJob(jobId, {
      status: 'completed',
      progress: 100,
      result
    });
  }

  failJob(jobId, error) {
    return this.updateJob(jobId, {
      status: 'failed',
      error: error.message || error
    });
  }

  getAllJobs() {
    return Array.from(this.jobs.values());
  }

  getJobsByType(type) {
    return Array.from(this.jobs.values()).filter(job => job.type === type);
  }

  getJobsByStatus(status) {
    return Array.from(this.jobs.values()).filter(job => job.status === status);
  }

  deleteJob(jobId) {
    return this.jobs.delete(jobId);
  }

  cleanup() {
    const now = new Date();
    const maxAge = 24 * 60 * 60 * 1000; // 24 hours

    for (const [jobId, job] of this.jobs.entries()) {
      const age = now - job.createdAt;
      if (age > maxAge || (job.status === 'completed' && age > 60 * 60 * 1000)) { // Clean completed jobs after 1 hour
        this.jobs.delete(jobId);
      }
    }
  }

  getStats() {
    const jobs = Array.from(this.jobs.values());
    const stats = {
      total: jobs.length,
      byStatus: {},
      byType: {}
    };

    jobs.forEach(job => {
      stats.byStatus[job.status] = (stats.byStatus[job.status] || 0) + 1;
      stats.byType[job.type] = (stats.byType[job.type] || 0) + 1;
    });

    return stats;
  }
}

// Singleton instance
const jobManager = new JobManager();

module.exports = jobManager;
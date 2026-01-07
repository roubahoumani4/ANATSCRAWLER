interface SearchJob {
  id: string;
  query: string;
  status: 'pending' | 'processing' | 'completed' | 'failed';
  results?: any[];
  error?: string;
  createdAt: Date;
  completedAt?: Date;
  progress?: {
    currentIndex: string;
    totalIndices: number;
    completedIndices: number;
  };
}

class SearchJobManager {
  private jobs: Map<string, SearchJob> = new Map();
  private readonly JOB_EXPIRY_MS = 10 * 60 * 1000; // 10 minutes

  constructor() {
    // Clean up old jobs every 5 minutes
    setInterval(() => this.cleanupExpiredJobs(), 5 * 60 * 1000);
  }

  createJob(query: string): string {
    const jobId = this.generateJobId();
    const job: SearchJob = {
      id: jobId,
      query,
      status: 'pending',
      createdAt: new Date(),
    };
    this.jobs.set(jobId, job);
    console.log(`[SearchJob] Created job ${jobId} for query: "${query}"`);
    return jobId;
  }

  updateJobStatus(jobId: string, status: SearchJob['status']) {
    const job = this.jobs.get(jobId);
    if (job) {
      job.status = status;
      console.log(`[SearchJob] Job ${jobId} status: ${status}`);
    }
  }

  updateJobProgress(jobId: string, currentIndex: string, completedIndices: number, totalIndices: number) {
    const job = this.jobs.get(jobId);
    if (job) {
      job.progress = { currentIndex, completedIndices, totalIndices };
      console.log(`[SearchJob] Job ${jobId} progress: ${completedIndices}/${totalIndices} (${currentIndex})`);
    }
  }

  completeJob(jobId: string, results: any[]) {
    const job = this.jobs.get(jobId);
    if (job) {
      job.status = 'completed';
      job.results = results;
      job.completedAt = new Date();
      console.log(`[SearchJob] Job ${jobId} completed with ${results.length} results`);
    }
  }

  failJob(jobId: string, error: string) {
    const job = this.jobs.get(jobId);
    if (job) {
      job.status = 'failed';
      job.error = error;
      job.completedAt = new Date();
      console.log(`[SearchJob] Job ${jobId} failed: ${error}`);
    }
  }

  getJob(jobId: string): SearchJob | undefined {
    return this.jobs.get(jobId);
  }

  private generateJobId(): string {
    return `job_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  private cleanupExpiredJobs() {
    const now = Date.now();
    let cleaned = 0;
    
    for (const [jobId, job] of this.jobs.entries()) {
      const age = now - job.createdAt.getTime();
      if (age > this.JOB_EXPIRY_MS) {
        this.jobs.delete(jobId);
        cleaned++;
      }
    }
    
    if (cleaned > 0) {
      console.log(`[SearchJob] Cleaned up ${cleaned} expired jobs`);
    }
  }
}

export const searchJobManager = new SearchJobManager();
export type { SearchJob };

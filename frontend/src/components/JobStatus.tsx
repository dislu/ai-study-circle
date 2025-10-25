'use client';

interface JobStatusProps {
  jobIds: string[];
  onJobCompleted: (jobId: string, result: any) => void;
  onContentReady: () => void;
}

export default function JobStatus({ jobIds, onJobCompleted, onContentReady }: JobStatusProps) {
  return (
    <div className="space-y-4">
      <h3 className="text-lg font-semibold">Processing Status</h3>
      
      {jobIds.map(jobId => (
        <div key={jobId} className="bg-white border rounded-lg p-4">
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium">Job: {jobId.substring(0, 8)}...</span>
            <span className="text-sm text-yellow-600">Processing...</span>
          </div>
          <div className="mt-2 w-full bg-gray-200 rounded-full h-2">
            <div className="bg-blue-600 h-2 rounded-full w-1/3 animate-pulse" />
          </div>
        </div>
      ))}
      
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
        <p className="text-blue-800 text-sm">
          Job status monitoring component coming soon! This will show real-time progress of your content processing.
        </p>
      </div>
    </div>
  );
}
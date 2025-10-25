'use client';

interface ExamGeneratorProps {
  contentJobId: string | null;
  contentText: string;
  onJobCreated: (jobId: string, type: string) => void;
}

export default function ExamGenerator({ contentJobId, contentText, onJobCreated }: ExamGeneratorProps) {
  return (
    <div className="space-y-4">
      <h2 className="text-xl font-semibold">Exam Generator</h2>
      <p className="text-gray-600">Create comprehensive exams from your content.</p>
      
      <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
        <p className="text-yellow-800">
          Exam generation component coming soon! This will allow you to:
        </p>
        <ul className="mt-2 text-sm text-yellow-700 list-disc list-inside">
          <li>Generate multiple choice questions</li>
          <li>Create short answer questions</li>
          <li>Build essay questions</li>
          <li>Set difficulty levels</li>
          <li>Include answer keys</li>
        </ul>
      </div>
    </div>
  );
}
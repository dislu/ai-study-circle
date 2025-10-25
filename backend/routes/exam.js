const express = require('express');
const ExamAgent = require('../agents/ExamAgent');
const ContentAnalyzer = require('../agents/ContentAnalyzer');
const jobManager = require('../utils/JobManager');

const router = express.Router();
const examAgent = new ExamAgent();
const contentAnalyzer = new ContentAnalyzer();

// Generate exam
router.post('/generate', async (req, res) => {
  try {
    const {
      jobId,           // Job ID from file upload
      text,            // Direct text input
      questionCount = 20,
      difficulty = 'medium',
      questionTypes = ['mcq', 'short_answer'],
      examTitle = 'Generated Assessment',
      timeLimit = null,
      topics = [],
      includeAnswers = true,
      analyzeContent = false
    } = req.body;

    // Get content either from job result or direct input
    let content = text;
    let sourceMetadata = {};

    if (jobId) {
      const uploadJob = jobManager.getJob(jobId);
      if (!uploadJob) {
        return res.status(404).json({ error: 'Upload job not found' });
      }
      if (uploadJob.status !== 'completed') {
        return res.status(400).json({ error: 'Upload job not completed yet' });
      }
      content = uploadJob.result.text;
      sourceMetadata = uploadJob.result.metadata;
    }

    if (!content) {
      return res.status(400).json({ error: 'No content provided' });
    }

    // Validate inputs
    if (questionCount < 1 || questionCount > 50) {
      return res.status(400).json({ error: 'Question count must be between 1 and 50' });
    }

    // Create exam generation job
    const examJob = jobManager.createJob('exam_generation', {
      sourceJobId: jobId,
      options: { 
        questionCount, 
        difficulty, 
        questionTypes, 
        examTitle, 
        timeLimit, 
        topics,
        includeAnswers 
      },
      contentLength: content.length
    });

    // Start processing asynchronously
    generateExamAsync(examJob.id, content, {
      questionCount,
      difficulty,
      questionTypes,
      examTitle,
      timeLimit,
      topics,
      includeAnswers,
      analyzeContent,
      sourceMetadata
    });

    res.json({
      success: true,
      jobId: examJob.id,
      message: 'Exam generation started',
      estimatedTime: estimateProcessingTime(content.length, questionCount)
    });

  } catch (error) {
    console.error('Exam generation request error:', error);
    res.status(500).json({ 
      error: 'Exam generation failed',
      message: error.message 
    });
  }
});

// Generate questions by type
router.post('/generate-by-type', async (req, res) => {
  try {
    const {
      jobId,
      text,
      questionType,
      count = 5,
      difficulty = 'medium'
    } = req.body;

    if (!['mcq', 'short_answer', 'essay', 'true_false', 'fill_blank'].includes(questionType)) {
      return res.status(400).json({ error: 'Invalid question type' });
    }

    let content = text;
    if (jobId) {
      const uploadJob = jobManager.getJob(jobId);
      if (!uploadJob || uploadJob.status !== 'completed') {
        return res.status(400).json({ error: 'Valid upload job required' });
      }
      content = uploadJob.result.text;
    }

    if (!content) {
      return res.status(400).json({ error: 'No content provided' });
    }

    // Create specific question type job
    const typeJob = jobManager.createJob('question_type_generation', {
      sourceJobId: jobId,
      questionType,
      count,
      difficulty,
      contentLength: content.length
    });

    // Start processing asynchronously
    generateQuestionsByTypeAsync(typeJob.id, content, questionType, count, difficulty);

    res.json({
      success: true,
      jobId: typeJob.id,
      message: `${questionType.replace('_', ' ')} question generation started`,
      estimatedTime: estimateProcessingTime(content.length, count)
    });

  } catch (error) {
    console.error('Question type generation error:', error);
    res.status(500).json({ 
      error: 'Question generation failed',
      message: error.message 
    });
  }
});

// Get exam options/configuration
router.get('/options', (req, res) => {
  res.json({
    questionTypes: [
      { 
        value: 'mcq', 
        label: 'Multiple Choice', 
        description: 'Questions with 4 options (A, B, C, D)',
        icon: '⊚'
      },
      { 
        value: 'short_answer', 
        label: 'Short Answer', 
        description: '2-4 sentence responses',
        icon: '✍️'
      },
      { 
        value: 'essay', 
        label: 'Essay Questions', 
        description: 'Detailed analytical responses',
        icon: '📝'
      },
      { 
        value: 'true_false', 
        label: 'True/False', 
        description: 'Binary choice questions',
        icon: '✓✗'
      },
      { 
        value: 'fill_blank', 
        label: 'Fill in the Blank', 
        description: 'Complete the sentence',
        icon: '___'
      }
    ],
    difficultyLevels: [
      { 
        value: 'easy', 
        label: 'Easy', 
        description: 'Basic recall and comprehension',
        color: 'green'
      },
      { 
        value: 'medium', 
        label: 'Medium', 
        description: 'Application and analysis',
        color: 'orange'
      },
      { 
        value: 'hard', 
        label: 'Hard', 
        description: 'Synthesis and evaluation',
        color: 'red'
      }
    ],
    examFormats: [
      { value: 'mixed', label: 'Mixed Format', description: 'Combination of question types' },
      { value: 'mcq_only', label: 'MCQ Only', description: 'Only multiple choice questions' },
      { value: 'written_only', label: 'Written Only', description: 'Short answer and essay questions' },
      { value: 'quick_quiz', label: 'Quick Quiz', description: 'MCQ and True/False for rapid assessment' }
    ],
    recommendedCounts: {
      'quick_quiz': { min: 5, max: 15, default: 10 },
      'standard_exam': { min: 15, max: 30, default: 20 },
      'comprehensive': { min: 25, max: 50, default: 35 }
    }
  });
});

// Get exam templates
router.get('/templates', (req, res) => {
  res.json({
    templates: [
      {
        name: 'Quick Assessment',
        description: '10 questions for rapid evaluation',
        config: {
          questionCount: 10,
          questionTypes: ['mcq', 'true_false'],
          difficulty: 'easy',
          timeLimit: 15
        }
      },
      {
        name: 'Standard Exam',
        description: 'Balanced 20-question assessment',
        config: {
          questionCount: 20,
          questionTypes: ['mcq', 'short_answer'],
          difficulty: 'medium',
          timeLimit: 45
        }
      },
      {
        name: 'Comprehensive Test',
        description: 'Thorough 35-question evaluation',
        config: {
          questionCount: 35,
          questionTypes: ['mcq', 'short_answer', 'essay'],
          difficulty: 'medium',
          timeLimit: 90
        }
      },
      {
        name: 'Critical Thinking',
        description: 'Advanced analytical assessment',
        config: {
          questionCount: 15,
          questionTypes: ['short_answer', 'essay'],
          difficulty: 'hard',
          timeLimit: 60
        }
      }
    ]
  });
});

// Async exam generation function
async function generateExamAsync(jobId, content, options) {
  try {
    jobManager.setJobStatus(jobId, 'processing', 10);

    let analysis = null;
    if (options.analyzeContent) {
      // Optional content analysis step
      analysis = await contentAnalyzer.analyzeContent(content);
      jobManager.setJobStatus(jobId, 'processing', 25);
    }

    // Generate exam
    jobManager.setJobStatus(jobId, 'processing', 40);
    const examResult = await examAgent.generateExam(content, options);
    jobManager.setJobStatus(jobId, 'processing', 85);

    // Enhance result with analysis if available
    if (analysis && examResult.metadata) {
      examResult.metadata.contentAnalysis = analysis;
    }

    // Add source metadata
    if (options.sourceMetadata) {
      examResult.metadata.sourceMetadata = options.sourceMetadata;
    }

    jobManager.setJobResult(jobId, examResult);

  } catch (error) {
    console.error('Exam generation error:', error);
    jobManager.failJob(jobId, error);
  }
}

// Async question type generation
async function generateQuestionsByTypeAsync(jobId, content, questionType, count, difficulty) {
  try {
    jobManager.setJobStatus(jobId, 'processing', 20);

    const questions = await examAgent.generateQuestionsByType(content, questionType, count, difficulty);
    
    const result = {
      questionType,
      count,
      difficulty,
      questions,
      metadata: {
        generatedAt: new Date().toISOString(),
        contentLength: content.length
      }
    };

    jobManager.setJobResult(jobId, result);

  } catch (error) {
    console.error('Question type generation error:', error);
    jobManager.failJob(jobId, error);
  }
}

function estimateProcessingTime(contentLength, questionCount) {
  // Rough estimation based on content length and question count
  const baseTime = 20; // seconds
  const contentFactor = Math.ceil(contentLength / 2000); // per 2000 characters
  const questionFactor = Math.ceil(questionCount / 5); // per 5 questions
  return Math.min(baseTime + contentFactor * 5 + questionFactor * 10, 180); // max 3 minutes
}

module.exports = router;
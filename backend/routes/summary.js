const express = require('express');
const SummaryAgent = require('../agents/SummaryAgent');
const ContentAnalyzer = require('../agents/ContentAnalyzer');
const Content = require('../models/Content');
const Summary = require('../models/Summary');
const User = require('../models/User');
const jobManager = require('../utils/JobManager');
const { authenticateToken, optionalAuth, checkUsageLimit } = require('../middleware/auth');

const router = express.Router();
const summaryAgent = new SummaryAgent();
const contentAnalyzer = new ContentAnalyzer();

// Generate summary
router.post('/generate', async (req, res) => {
  try {
    const {
      jobId,           // Job ID from file upload
      text,            // Direct text input
      length = 'medium',
      style = 'academic',
      targetAudience = 'general',
      focusAreas = [],
      includeKeyPoints = true,
      includeConcepts = true,
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

    // Create summary generation job
    const summaryJob = jobManager.createJob('summary_generation', {
      sourceJobId: jobId,
      options: { length, style, targetAudience, focusAreas, includeKeyPoints, includeConcepts },
      contentLength: content.length
    });

    // Start processing asynchronously
    generateSummaryAsync(summaryJob.id, content, {
      length,
      style,
      targetAudience,
      focusAreas,
      includeKeyPoints,
      includeConcepts,
      analyzeContent,
      sourceMetadata
    });

    res.json({
      success: true,
      jobId: summaryJob.id,
      message: 'Summary generation started',
      estimatedTime: estimateProcessingTime(content.length, 'summary')
    });

  } catch (error) {
    console.error('Summary generation request error:', error);
    res.status(500).json({ 
      error: 'Summary generation failed',
      message: error.message 
    });
  }
});

// Generate multiple summary lengths
router.post('/generate-multiple', async (req, res) => {
  try {
    const {
      jobId,
      text,
      lengths = ['brief', 'medium', 'detailed'],
      style = 'academic',
      targetAudience = 'general'
    } = req.body;

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

    // Create job for multiple summaries
    const multiSummaryJob = jobManager.createJob('multiple_summaries', {
      sourceJobId: jobId,
      lengths,
      style,
      targetAudience,
      contentLength: content.length
    });

    // Start processing asynchronously
    generateMultipleSummariesAsync(multiSummaryJob.id, content, {
      lengths,
      style,
      targetAudience
    });

    res.json({
      success: true,
      jobId: multiSummaryJob.id,
      message: 'Multiple summary generation started',
      lengths,
      estimatedTime: estimateProcessingTime(content.length, 'summary') * lengths.length
    });

  } catch (error) {
    console.error('Multiple summary generation error:', error);
    res.status(500).json({ 
      error: 'Multiple summary generation failed',
      message: error.message 
    });
  }
});

// Get summary options/configuration
router.get('/options', (req, res) => {
  res.json({
    lengthOptions: [
      { value: 'brief', label: 'Brief (100-200 words)', description: 'Concise overview of main points' },
      { value: 'medium', label: 'Medium (300-500 words)', description: 'Balanced summary with key details' },
      { value: 'detailed', label: 'Detailed (600-1000 words)', description: 'Comprehensive summary with examples' }
    ],
    styleOptions: [
      { value: 'academic', label: 'Academic', description: 'Formal, scholarly tone' },
      { value: 'casual', label: 'Casual', description: 'Conversational, accessible language' },
      { value: 'professional', label: 'Professional', description: 'Business-appropriate tone' },
      { value: 'technical', label: 'Technical', description: 'Preserves technical terminology' }
    ],
    audienceOptions: [
      { value: 'students', label: 'Students', description: 'Educational context and clarity' },
      { value: 'professionals', label: 'Professionals', description: 'Business and practical focus' },
      { value: 'general', label: 'General Public', description: 'Accessible to broad audience' },
      { value: 'experts', label: 'Subject Experts', description: 'Assumes deep knowledge' }
    ]
  });
});

// Async summary generation function
async function generateSummaryAsync(jobId, content, options) {
  try {
    jobManager.setJobStatus(jobId, 'processing', 10);

    let analysis = null;
    if (options.analyzeContent) {
      // Optional content analysis step
      analysis = await contentAnalyzer.analyzeContent(content);
      jobManager.setJobStatus(jobId, 'processing', 30);
    }

    // Generate summary
    jobManager.setJobStatus(jobId, 'processing', 50);
    const summaryResult = await summaryAgent.generateSummary(content, options);
    jobManager.setJobStatus(jobId, 'processing', 90);

    // Prepare final result
    const result = {
      summary: summaryResult.summary,
      metadata: {
        ...summaryResult.metadata,
        sourceMetadata: options.sourceMetadata,
        analysis: analysis,
        processingTime: new Date().toISOString()
      }
    };

    jobManager.setJobResult(jobId, result);

  } catch (error) {
    console.error('Summary generation error:', error);
    jobManager.failJob(jobId, error);
  }
}

// Async multiple summaries generation
async function generateMultipleSummariesAsync(jobId, content, options) {
  try {
    jobManager.setJobStatus(jobId, 'processing', 10);

    const summaries = await summaryAgent.generateMultipleSummaries(content, options.lengths);
    
    const result = {
      summaries,
      metadata: {
        generatedAt: new Date().toISOString(),
        options: options,
        contentLength: content.length
      }
    };

    jobManager.setJobResult(jobId, result);

  } catch (error) {
    console.error('Multiple summary generation error:', error);
    jobManager.failJob(jobId, error);
  }
}

function estimateProcessingTime(contentLength, type) {
  // Rough estimation based on content length
  const baseTime = type === 'summary' ? 15 : 30; // seconds
  const lengthFactor = Math.ceil(contentLength / 1000); // per 1000 characters
  return Math.min(baseTime + lengthFactor * 5, 120); // max 2 minutes
}

module.exports = router;
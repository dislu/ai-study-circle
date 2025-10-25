const BaseAgent = require('./BaseAgent');

class ContentAnalyzer extends BaseAgent {
  constructor(options = {}) {
    super(options);
  }

  getSystemPrompt() {
    return `You are an expert content analyzer that specializes in educational material analysis. 
    Your task is to analyze provided content and extract key information including:
    - Main topics and themes
    - Key concepts and definitions
    - Learning objectives
    - Content structure and organization
    - Difficulty level assessment
    - Subject area classification
    
    Always provide structured, actionable insights that can be used for summary generation and exam creation.`;
  }

  async analyzeContent(content, options = {}) {
    const analysisPrompt = `
    Please analyze the following educational content and provide a structured analysis:

    Content:
    ${content}

    Please provide your analysis in the following JSON format:
    {
      "mainTopics": ["topic1", "topic2", ...],
      "keyPoints": ["point1", "point2", ...],
      "concepts": [{"term": "definition"}, ...],
      "difficulty": "beginner|intermediate|advanced",
      "subject": "subject area",
      "learningObjectives": ["objective1", "objective2", ...],
      "contentStructure": {
        "sections": ["section1", "section2", ...],
        "wordCount": number,
        "estimatedReadTime": "X minutes"
      }
    }
    `;

    try {
      const analysis = await this.generateCompletion(analysisPrompt, {
        temperature: 0.3, // Lower temperature for more consistent analysis
        maxTokens: 1500
      });

      // Try to parse as JSON, fallback to structured text if needed
      try {
        return JSON.parse(analysis);
      } catch (parseError) {
        console.warn('Failed to parse analysis as JSON, returning raw text');
        return {
          analysis: analysis,
          error: 'Could not parse structured analysis'
        };
      }
    } catch (error) {
      console.error('Content analysis error:', error);
      throw new Error('Failed to analyze content: ' + error.message);
    }
  }

  async extractKeyInformation(content, focusAreas = []) {
    const extractionPrompt = `
    Extract key information from the following content${focusAreas.length > 0 ? ` focusing on: ${focusAreas.join(', ')}` : ''}:

    Content:
    ${content}

    Provide a comprehensive extraction of:
    1. Important facts and figures
    2. Key processes or procedures
    3. Definitions and terminology
    4. Examples and case studies
    5. Relationships between concepts
    `;

    return await this.generateCompletion(extractionPrompt, {
      temperature: 0.2,
      maxTokens: 1200
    });
  }

  async assessComplexity(content) {
    const complexityPrompt = `
    Assess the complexity and educational level of the following content:

    Content:
    ${content}

    Provide assessment in JSON format:
    {
      "readingLevel": "elementary|middle|high_school|undergraduate|graduate",
      "technicalComplexity": "low|medium|high",
      "prerequisiteKnowledge": ["requirement1", "requirement2", ...],
      "complexityScore": 1-10,
      "recommendations": "suggestions for different audience levels"
    }
    `;

    try {
      const assessment = await this.generateCompletion(complexityPrompt, {
        temperature: 0.2,
        maxTokens: 800
      });

      try {
        return JSON.parse(assessment);
      } catch (parseError) {
        return {
          assessment: assessment,
          error: 'Could not parse complexity assessment'
        };
      }
    } catch (error) {
      console.error('Complexity assessment error:', error);
      throw new Error('Failed to assess complexity: ' + error.message);
    }
  }
}

module.exports = ContentAnalyzer;
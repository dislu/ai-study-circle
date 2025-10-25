const BaseAgent = require('./BaseAgent');

class SummaryAgent extends BaseAgent {
  constructor(options = {}) {
    super(options);
    this.defaultLength = options.defaultLength || 'medium';
    this.defaultStyle = options.defaultStyle || 'academic';
  }

  getSystemPrompt() {
    return `You are an expert summarization agent specialized in creating high-quality summaries of educational content.
    
    Your expertise includes:
    - Creating summaries at different levels of detail (brief, medium, detailed)
    - Adapting writing style for different audiences (academic, casual, professional)
    - Preserving key information while maintaining readability
    - Structuring summaries with clear organization
    - Highlighting the most important concepts and relationships
    
    Always maintain accuracy and ensure that critical information is not lost in summarization.`;
  }

  async generateSummary(content, options = {}) {
    const {
      length = this.defaultLength,
      style = this.defaultStyle,
      focusAreas = [],
      includeKeyPoints = true,
      includeConcepts = true,
      targetAudience = 'general'
    } = options;

    const lengthInstructions = this.getLengthInstructions(length);
    const styleInstructions = this.getStyleInstructions(style);
    const audienceInstructions = this.getAudienceInstructions(targetAudience);

    const summaryPrompt = `
    Create a comprehensive summary of the following content:

    Content:
    ${content}

    Instructions:
    ${lengthInstructions}
    ${styleInstructions}
    ${audienceInstructions}
    
    ${focusAreas.length > 0 ? `Focus particularly on: ${focusAreas.join(', ')}` : ''}
    
    Structure your summary as follows:
    1. Main Topic/Title
    2. Executive Summary (2-3 sentences)
    3. Key Points (bullet format)
    ${includeConcepts ? '4. Important Concepts and Definitions' : ''}
    5. Detailed Summary
    6. Conclusion/Takeaways

    Ensure the summary is accurate, well-organized, and captures the essential information.
    `;

    try {
      const summary = await this.generateCompletion(summaryPrompt, {
        temperature: 0.4,
        maxTokens: this.getMaxTokensForLength(length)
      });

      return {
        summary: summary,
        metadata: {
          length: length,
          style: style,
          targetAudience: targetAudience,
          generatedAt: new Date().toISOString(),
          wordCount: this.estimateWordCount(summary)
        }
      };
    } catch (error) {
      console.error('Summary generation error:', error);
      throw new Error('Failed to generate summary: ' + error.message);
    }
  }

  async generateMultipleSummaries(content, lengths = ['brief', 'medium', 'detailed']) {
    const summaries = {};
    
    for (const length of lengths) {
      try {
        const result = await this.generateSummary(content, { length });
        summaries[length] = result;
      } catch (error) {
        console.error(`Failed to generate ${length} summary:`, error);
        summaries[length] = { error: error.message };
      }
    }

    return summaries;
  }

  async createBulletPointSummary(content, maxPoints = 10) {
    const bulletPrompt = `
    Create a concise bullet-point summary of the following content.
    
    Content:
    ${content}
    
    Requirements:
    - Maximum ${maxPoints} bullet points
    - Each point should be clear and informative
    - Focus on the most important information
    - Use parallel structure
    - Keep each point to 1-2 sentences
    
    Format as a clean bullet list.
    `;

    return await this.generateCompletion(bulletPrompt, {
      temperature: 0.3,
      maxTokens: 800
    });
  }

  getLengthInstructions(length) {
    const instructions = {
      brief: 'Create a concise summary of 100-200 words. Focus on the most essential points only.',
      medium: 'Create a balanced summary of 300-500 words. Include main points and supporting details.',
      detailed: 'Create a comprehensive summary of 600-1000 words. Include all important information, examples, and context.'
    };
    return instructions[length] || instructions.medium;
  }

  getStyleInstructions(style) {
    const instructions = {
      academic: 'Use formal, academic language with proper terminology. Structure logically with clear transitions.',
      casual: 'Use conversational, accessible language. Make it engaging and easy to understand.',
      professional: 'Use clear, business-appropriate language. Focus on practical applications and key insights.',
      technical: 'Preserve technical accuracy and terminology. Include important technical details and specifications.'
    };
    return instructions[style] || instructions.academic;
  }

  getAudienceInstructions(audience) {
    const instructions = {
      students: 'Make it educational and clear. Include learning context and connections to broader topics.',
      professionals: 'Focus on practical applications and business relevance. Highlight actionable insights.',
      general: 'Use accessible language for a broad audience. Explain technical terms when necessary.',
      experts: 'Assume deep knowledge. Focus on nuances, implications, and advanced concepts.'
    };
    return instructions[audience] || instructions.general;
  }

  getMaxTokensForLength(length) {
    const tokenLimits = {
      brief: 400,
      medium: 800,
      detailed: 1500
    };
    return tokenLimits[length] || tokenLimits.medium;
  }

  estimateWordCount(text) {
    return text.split(/\s+/).length;
  }
}

module.exports = SummaryAgent;
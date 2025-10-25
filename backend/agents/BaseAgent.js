const { OpenAI } = require('openai');

class BaseAgent {
  constructor(options = {}) {
    this.openai = new OpenAI({
      apiKey: process.env.OPENAI_API_KEY
    });
    this.model = options.model || process.env.OPENAI_MODEL || 'gpt-4';
    this.maxTokens = options.maxTokens || 2000;
    this.temperature = options.temperature || 0.7;
  }

  async generateCompletion(prompt, options = {}) {
    try {
      const response = await this.openai.chat.completions.create({
        model: this.model,
        messages: [
          {
            role: 'system',
            content: this.getSystemPrompt()
          },
          {
            role: 'user',
            content: prompt
          }
        ],
        max_tokens: options.maxTokens || this.maxTokens,
        temperature: options.temperature || this.temperature,
        ...options
      });

      return response.choices[0].message.content;
    } catch (error) {
      console.error('AI Generation Error:', error);
      throw new Error('Failed to generate AI response: ' + error.message);
    }
  }

  getSystemPrompt() {
    return 'You are a helpful AI assistant specialized in educational content processing.';
  }

  async process(content, options = {}) {
    throw new Error('Process method must be implemented by subclass');
  }
}

module.exports = BaseAgent;
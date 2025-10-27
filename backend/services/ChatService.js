const OpenAI = require('openai');
const Chat = require('../models/Chat');
const Document = require('../models/Document');

class ChatService {
  constructor() {
    this.openai = null;
    this.initializeOpenAI();
  }

  initializeOpenAI() {
    const apiKey = process.env.OPENAI_API_KEY;
    if (!apiKey || apiKey === 'your_openai_api_key') {
      console.warn('⚠️  OpenAI API key not configured. Chat features will be limited.');
      return;
    }

    try {
      this.openai = new OpenAI({
        apiKey: apiKey
      });
      console.log('✅ OpenAI chat service initialized');
    } catch (error) {
      console.error('❌ Failed to initialize OpenAI:', error.message);
    }
  }

  /**
   * Create a new chat conversation
   */
  async createChat(userId, options = {}) {
    try {
      const chat = new Chat({
        userId,
        title: options.title || 'New Conversation',
        context: options.context || {},
        settings: {
          ...options.settings,
          model: options.settings?.model || 'gpt-3.5-turbo',
          temperature: options.settings?.temperature || 0.7,
          maxTokens: options.settings?.maxTokens || 1000
        }
      });

      await chat.save();
      return chat;
    } catch (error) {
      console.error('Error creating chat:', error);
      throw error;
    }
  }

  /**
   * Send a message and get AI response
   */
  async sendMessage(chatId, userId, message, options = {}) {
    try {
      if (!this.openai) {
        throw new Error('OpenAI service not available. Please check API key configuration.');
      }

      // Get chat conversation
      const chat = await Chat.findOne({ _id: chatId, userId });
      if (!chat) {
        throw new Error('Chat not found');
      }

      // Add user message
      await chat.addMessage('user', message);

      // Get conversation context
      const messages = this.buildConversationContext(chat, options.documentContext);

      // Get AI response
      const startTime = Date.now();
      const completion = await this.openai.chat.completions.create({
        model: chat.settings.model,
        messages: messages,
        temperature: chat.settings.temperature,
        max_tokens: chat.settings.maxTokens,
        user: userId.toString()
      });

      const processingTime = Date.now() - startTime;
      const aiResponse = completion.choices[0].message.content;

      // Add AI response to chat
      await chat.addMessage('assistant', aiResponse, {
        tokens: completion.usage?.total_tokens,
        model: chat.settings.model,
        processingTime
      });

      return {
        chat,
        response: aiResponse,
        usage: completion.usage,
        processingTime
      };
    } catch (error) {
      console.error('Error in sendMessage:', error);
      throw error;
    }
  }

  /**
   * Build conversation context for OpenAI
   */
  buildConversationContext(chat, documentContext = null) {
    const messages = [];

    // System message with context
    let systemPrompt = `You are an AI study assistant helping users learn and understand content. You are knowledgeable, helpful, and encouraging. 

Key capabilities:
- Answer questions about uploaded documents
- Explain complex topics in simple terms
- Help with study planning and learning strategies
- Generate summaries and key points
- Create study questions and quizzes

Always be:
- Clear and concise in explanations
- Supportive and encouraging
- Accurate with information
- Helpful with study techniques`;

    // Add document context if available
    if (documentContext) {
      systemPrompt += `\n\nDocument Context: You are discussing "${documentContext.name}" with the user. Use this content to answer questions: "${documentContext.content?.substring(0, 1000)}${documentContext.content?.length > 1000 ? '...' : ''}"`;
    } else if (chat.context.documentId && chat.context.documentName) {
      systemPrompt += `\n\nDocument Context: You are discussing "${chat.context.documentName}" with the user.`;
    }

    messages.push({
      role: 'system',
      content: systemPrompt
    });

    // Add recent conversation history (last 10 messages to stay within token limits)
    const recentMessages = chat.getRecentMessages(10);
    messages.push(...recentMessages);

    return messages;
  }

  /**
   * Get chat conversation
   */
  async getChat(chatId, userId) {
    try {
      const chat = await Chat.findOne({ _id: chatId, userId })
        .populate('context.documentId', 'name type')
        .lean();

      if (!chat) {
        throw new Error('Chat not found');
      }

      return chat;
    } catch (error) {
      console.error('Error getting chat:', error);
      throw error;
    }
  }

  /**
   * Get user's chat list
   */
  async getUserChats(userId, limit = 20) {
    try {
      const chats = await Chat.getUserActiveChats(userId, limit);
      return chats;
    } catch (error) {
      console.error('Error getting user chats:', error);
      throw error;
    }
  }

  /**
   * Delete a chat
   */
  async deleteChat(chatId, userId) {
    try {
      const result = await Chat.findOneAndUpdate(
        { _id: chatId, userId },
        { isActive: false },
        { new: true }
      );

      if (!result) {
        throw new Error('Chat not found');
      }

      return result;
    } catch (error) {
      console.error('Error deleting chat:', error);
      throw error;
    }
  }

  /**
   * Start chat about a specific document
   */
  async createDocumentChat(userId, documentId, initialMessage = null) {
    try {
      // Get document details
      const document = await Document.findOne({ _id: documentId, userId });
      if (!document) {
        throw new Error('Document not found');
      }

      // Create chat with document context
      const chat = await this.createChat(userId, {
        title: `Chat about ${document.name}`,
        context: {
          documentId: document._id,
          documentName: document.name,
          topic: 'document-discussion'
        }
      });

      // Send initial message if provided
      if (initialMessage) {
        const result = await this.sendMessage(chat._id, userId, initialMessage, {
          documentContext: {
            name: document.name,
            content: document.textContent
          }
        });
        return result.chat;
      }

      return chat;
    } catch (error) {
      console.error('Error creating document chat:', error);
      throw error;
    }
  }

  /**
   * Get AI models available
   */
  getAvailableModels() {
    return [
      { id: 'gpt-3.5-turbo', name: 'GPT-3.5 Turbo', description: 'Fast and efficient for general conversations' },
      { id: 'gpt-4', name: 'GPT-4', description: 'More advanced reasoning and analysis' },
      { id: 'gpt-4-turbo', name: 'GPT-4 Turbo', description: 'Latest GPT-4 with improved performance' }
    ];
  }

  /**
   * Update chat settings
   */
  async updateChatSettings(chatId, userId, settings) {
    try {
      const chat = await Chat.findOneAndUpdate(
        { _id: chatId, userId },
        { 
          $set: { 
            'settings.model': settings.model || 'gpt-3.5-turbo',
            'settings.temperature': Math.min(2, Math.max(0, settings.temperature || 0.7)),
            'settings.maxTokens': Math.min(4000, Math.max(100, settings.maxTokens || 1000))
          }
        },
        { new: true }
      );

      if (!chat) {
        throw new Error('Chat not found');
      }

      return chat;
    } catch (error) {
      console.error('Error updating chat settings:', error);
      throw error;
    }
  }

  /**
   * Generate chat suggestions based on document
   */
  async generateChatSuggestions(documentId, userId) {
    try {
      const document = await Document.findOne({ _id: documentId, userId });
      if (!document || !document.textContent) {
        return [
          "Explain the main concepts in this document",
          "What are the key takeaways?",
          "Can you summarize this content?",
          "Help me understand the important points"
        ];
      }

      // Generate contextual suggestions based on document content
      const contentPreview = document.textContent.substring(0, 500);
      
      return [
        `Explain the main concepts in "${document.name}"`,
        "What are the key takeaways from this document?",
        "Can you create study questions based on this content?",
        "Help me understand the most important points",
        "What should I focus on when studying this material?"
      ];
    } catch (error) {
      console.error('Error generating chat suggestions:', error);
      return [
        "How can I better understand this content?",
        "What are the main points I should remember?",
        "Can you help me study this material?",
        "What questions should I ask about this topic?"
      ];
    }
  }
}

// Create singleton instance
const chatService = new ChatService();

module.exports = chatService;
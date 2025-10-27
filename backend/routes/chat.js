const express = require('express');
const router = express.Router();
const { authenticateToken } = require('../middleware/auth');
const chatService = require('../services/ChatService');
const webSocketService = require('../services/WebSocketService');
const logger = require('../src/utils/Logger');

/**
 * @route GET /api/chat
 * @desc Get user's chat list
 * @access Private
 */
router.get('/', authenticateToken, async (req, res) => {
  try {
    const limit = parseInt(req.query.limit) || 20;
    const chats = await chatService.getUserChats(req.user.id, limit);
    
    logger.info(`Retrieved ${chats.length} chats for user ${req.user.id}`);
    res.json({
      success: true,
      chats
    });
  } catch (error) {
    logger.error('Error getting user chats:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get chats',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

/**
 * @route POST /api/chat
 * @desc Create a new chat
 * @access Private
 */
router.post('/', authenticateToken, async (req, res) => {
  try {
    const { title, context, settings } = req.body;
    
    const chat = await chatService.createChat(req.user.id, {
      title,
      context,
      settings
    });
    
    logger.info(`Created new chat ${chat._id} for user ${req.user.id}`);
    
    // Notify user via WebSocket
    webSocketService.sendToUser(req.user.id, 'chat:created', {
      chatId: chat._id,
      title: chat.title
    });
    
    res.status(201).json({
      success: true,
      chat
    });
  } catch (error) {
    logger.error('Error creating chat:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to create chat',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

/**
 * @route GET /api/chat/:chatId
 * @desc Get specific chat conversation
 * @access Private
 */
router.get('/:chatId', authenticateToken, async (req, res) => {
  try {
    const { chatId } = req.params;
    const chat = await chatService.getChat(chatId, req.user.id);
    
    res.json({
      success: true,
      chat
    });
  } catch (error) {
    logger.error('Error getting chat:', error);
    const statusCode = error.message === 'Chat not found' ? 404 : 500;
    res.status(statusCode).json({
      success: false,
      message: error.message,
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

/**
 * @route POST /api/chat/:chatId/messages
 * @desc Send a message and get AI response
 * @access Private
 */
router.post('/:chatId/messages', authenticateToken, async (req, res) => {
  try {
    const { chatId } = req.params;
    const { message, documentContext } = req.body;
    
    if (!message || typeof message !== 'string' || message.trim().length === 0) {
      return res.status(400).json({
        success: false,
        message: 'Message is required and must be a non-empty string'
      });
    }
    
    // Notify user that AI is thinking via WebSocket
    webSocketService.sendToUser(req.user.id, 'chat:thinking', {
      chatId,
      status: 'processing'
    });
    
    const result = await chatService.sendMessage(
      chatId, 
      req.user.id, 
      message.trim(),
      { documentContext }
    );
    
    // Send the new messages via WebSocket for real-time updates
    const recentMessages = result.chat.getRecentMessages(2); // Get user + AI messages
    webSocketService.sendToUser(req.user.id, 'chat:newMessages', {
      chatId,
      messages: recentMessages,
      usage: result.usage,
      processingTime: result.processingTime
    });
    
    logger.info(`Chat message processed for ${req.user.id} in chat ${chatId} (${result.processingTime}ms)`);
    
    res.json({
      success: true,
      message: 'Message sent successfully',
      response: result.response,
      chat: result.chat,
      usage: result.usage,
      processingTime: result.processingTime
    });
  } catch (error) {
    logger.error('Error sending message:', error);
    
    // Notify user of error via WebSocket
    webSocketService.sendToUser(req.user.id, 'chat:error', {
      chatId: req.params.chatId,
      error: error.message
    });
    
    const statusCode = error.message === 'Chat not found' ? 404 : 
                      error.message.includes('OpenAI') ? 503 : 500;
    
    res.status(statusCode).json({
      success: false,
      message: error.message,
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

/**
 * @route DELETE /api/chat/:chatId
 * @desc Delete (deactivate) a chat
 * @access Private
 */
router.delete('/:chatId', authenticateToken, async (req, res) => {
  try {
    const { chatId } = req.params;
    const chat = await chatService.deleteChat(chatId, req.user.id);
    
    logger.info(`Deleted chat ${chatId} for user ${req.user.id}`);
    
    // Notify user via WebSocket
    webSocketService.sendToUser(req.user.id, 'chat:deleted', {
      chatId
    });
    
    res.json({
      success: true,
      message: 'Chat deleted successfully',
      chat
    });
  } catch (error) {
    logger.error('Error deleting chat:', error);
    const statusCode = error.message === 'Chat not found' ? 404 : 500;
    res.status(statusCode).json({
      success: false,
      message: error.message,
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

/**
 * @route PUT /api/chat/:chatId/settings
 * @desc Update chat settings
 * @access Private
 */
router.put('/:chatId/settings', authenticateToken, async (req, res) => {
  try {
    const { chatId } = req.params;
    const { settings } = req.body;
    
    const chat = await chatService.updateChatSettings(chatId, req.user.id, settings);
    
    logger.info(`Updated chat settings for ${chatId}`);
    
    res.json({
      success: true,
      message: 'Chat settings updated successfully',
      chat
    });
  } catch (error) {
    logger.error('Error updating chat settings:', error);
    const statusCode = error.message === 'Chat not found' ? 404 : 500;
    res.status(statusCode).json({
      success: false,
      message: error.message,
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

/**
 * @route POST /api/chat/document/:documentId
 * @desc Start a new chat about a specific document
 * @access Private
 */
router.post('/document/:documentId', authenticateToken, async (req, res) => {
  try {
    const { documentId } = req.params;
    const { initialMessage } = req.body;
    
    const chat = await chatService.createDocumentChat(
      req.user.id, 
      documentId, 
      initialMessage
    );
    
    logger.info(`Created document chat ${chat._id} for document ${documentId}`);
    
    // Notify user via WebSocket
    webSocketService.sendToUser(req.user.id, 'chat:documentChatCreated', {
      chatId: chat._id,
      documentId,
      title: chat.title
    });
    
    res.status(201).json({
      success: true,
      message: 'Document chat created successfully',
      chat
    });
  } catch (error) {
    logger.error('Error creating document chat:', error);
    const statusCode = error.message === 'Document not found' ? 404 : 500;
    res.status(statusCode).json({
      success: false,
      message: error.message,
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

/**
 * @route GET /api/chat/document/:documentId/suggestions
 * @desc Get chat suggestions for a document
 * @access Private
 */
router.get('/document/:documentId/suggestions', authenticateToken, async (req, res) => {
  try {
    const { documentId } = req.params;
    const suggestions = await chatService.generateChatSuggestions(documentId, req.user.id);
    
    res.json({
      success: true,
      suggestions
    });
  } catch (error) {
    logger.error('Error getting chat suggestions:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get chat suggestions',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

/**
 * @route GET /api/chat/models
 * @desc Get available AI models
 * @access Private
 */
router.get('/models', authenticateToken, async (req, res) => {
  try {
    const models = chatService.getAvailableModels();
    
    res.json({
      success: true,
      models
    });
  } catch (error) {
    logger.error('Error getting AI models:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get AI models',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

/**
 * @route POST /api/chat/:chatId/typing
 * @desc Notify that user is typing
 * @access Private
 */
router.post('/:chatId/typing', authenticateToken, async (req, res) => {
  try {
    const { chatId } = req.params;
    const { isTyping } = req.body;
    
    // Broadcast typing status via WebSocket
    webSocketService.sendToUser(req.user.id, 'chat:typing', {
      chatId,
      isTyping: !!isTyping,
      userId: req.user.id
    });
    
    res.json({
      success: true,
      message: 'Typing status updated'
    });
  } catch (error) {
    logger.error('Error updating typing status:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update typing status'
    });
  }
});

module.exports = router;
'use client';

import React, { useState, useEffect, useRef } from 'react';
import { 
  MessageCircle, 
  Send, 
  Plus, 
  Settings, 
  Trash2, 
  FileText,
  User,
  Bot,
  Loader,
  AlertCircle
} from 'lucide-react';
import { useChat } from '../contexts/ChatContext';

export default function Chat({ documentId = null, documentName = null }) {
  const {
    chats,
    currentChat,
    isLoading,
    error,
    isTyping,
    models,
    getChats,
    getChat,
    createChat,
    sendMessage,
    createDocumentChat,
    getChatSuggestions,
    deleteChat,
    updateChatSettings,
    clearError
  } = useChat();

  const [message, setMessage] = useState('');
  const [isSending, setIsSending] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [suggestions, setSuggestions] = useState([]);
  const [sidebarOpen, setSidebarOpen] = useState(true);
  
  const messagesEndRef = useRef(null);
  const inputRef = useRef(null);

  // Load chats and suggestions on mount
  useEffect(() => {
    getChats();
    if (documentId) {
      loadSuggestions();
    }
  }, [documentId]);

  // Scroll to bottom when messages change
  useEffect(() => {
    scrollToBottom();
  }, [currentChat?.messages]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const loadSuggestions = async () => {
    if (documentId) {
      try {
        const suggestions = await getChatSuggestions(documentId);
        setSuggestions(suggestions);
      } catch (error) {
        console.error('Error loading suggestions:', error);
      }
    }
  };

  const handleSendMessage = async (messageText = message) => {
    if (!messageText.trim() || isSending) return;

    try {
      setIsSending(true);
      
      // Create chat if none exists
      let chatId = currentChat?._id;
      if (!chatId) {
        const newChat = documentId 
          ? await createDocumentChat(documentId)
          : await createChat({ title: 'New Conversation' });
        chatId = newChat._id;
      }

      // Send message
      await sendMessage(chatId, messageText.trim());
      setMessage('');
      
      // Focus input for next message
      inputRef.current?.focus();
    } catch (error) {
      console.error('Error sending message:', error);
    } finally {
      setIsSending(false);
    }
  };

  const handleSuggestionClick = (suggestion) => {
    setMessage(suggestion);
    handleSendMessage(suggestion);
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  const handleNewChat = async () => {
    try {
      const newChat = documentId 
        ? await createDocumentChat(documentId)
        : await createChat({ title: 'New Conversation' });
      setMessage('');
      clearError();
    } catch (error) {
      console.error('Error creating chat:', error);
    }
  };

  const handleDeleteChat = async (chatId) => {
    if (window.confirm('Are you sure you want to delete this conversation?')) {
      try {
        await deleteChat(chatId);
      } catch (error) {
        console.error('Error deleting chat:', error);
      }
    }
  };

  const formatTime = (timestamp) => {
    return new Date(timestamp).toLocaleTimeString([], { 
      hour: '2-digit', 
      minute: '2-digit' 
    });
  };

  return (
    <div className="flex h-screen bg-gray-50">
      {/* Sidebar */}
      <div className={`${sidebarOpen ? 'w-80' : 'w-0'} transition-all duration-300 overflow-hidden bg-white border-r border-gray-200`}>
        <div className="p-4 border-b border-gray-200">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
              <MessageCircle className="w-5 h-5 text-blue-600" />
              AI Chat
            </h2>
            <button
              onClick={handleNewChat}
              className="p-2 text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
              title="New Chat"
            >
              <Plus className="w-4 h-4" />
            </button>
          </div>
          {documentName && (
            <div className="mt-2 text-sm text-gray-600 flex items-center gap-1">
              <FileText className="w-4 h-4" />
              {documentName}
            </div>
          )}
        </div>

        {/* Chat List */}
        <div className="flex-1 overflow-y-auto">
          {isLoading && chats.length === 0 ? (
            <div className="p-4 text-center text-gray-500">
              <Loader className="w-6 h-6 animate-spin mx-auto mb-2" />
              Loading chats...
            </div>
          ) : chats.length === 0 ? (
            <div className="p-4 text-center text-gray-500">
              <MessageCircle className="w-12 h-12 mx-auto mb-2 text-gray-300" />
              <p className="text-sm">No conversations yet.</p>
              <p className="text-xs mt-1">Start a new chat to begin.</p>
            </div>
          ) : (
            <div className="p-2 space-y-2">
              {chats.map((chat) => (
                <div
                  key={chat._id}
                  onClick={() => getChat(chat._id)}
                  className={`p-3 rounded-lg cursor-pointer transition-all hover:bg-gray-50 group ${
                    currentChat?._id === chat._id ? 'bg-blue-50 border-blue-200' : 'border-transparent'
                  } border`}
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1 min-w-0">
                      <h3 className="text-sm font-medium text-gray-900 truncate">
                        {chat.title}
                      </h3>
                      <p className="text-xs text-gray-500 mt-1">
                        {chat.messages?.length || 0} messages
                      </p>
                    </div>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleDeleteChat(chat._id);
                      }}
                      className="opacity-0 group-hover:opacity-100 p-1 text-gray-400 hover:text-red-600 transition-all"
                      title="Delete Chat"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Main Chat Area */}
      <div className="flex-1 flex flex-col">
        {/* Header */}
        <div className="bg-white border-b border-gray-200 p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <button
                onClick={() => setSidebarOpen(!sidebarOpen)}
                className="p-2 text-gray-600 hover:bg-gray-100 rounded-lg lg:hidden"
              >
                <MessageCircle className="w-5 h-5" />
              </button>
              <div>
                <h1 className="text-lg font-semibold text-gray-900">
                  {currentChat?.title || 'AI Study Assistant'}
                </h1>
                {currentChat?.context?.documentName && (
                  <p className="text-sm text-gray-600">
                    Discussing: {currentChat.context.documentName}
                  </p>
                )}
              </div>
            </div>
            <button
              onClick={() => setShowSettings(!showSettings)}
              className="p-2 text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
              title="Chat Settings"
            >
              <Settings className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Messages */}
        <div className="flex-1 overflow-y-auto p-4 space-y-4">
          {!currentChat ? (
            <div className="flex flex-col items-center justify-center h-full text-gray-500">
              <MessageCircle className="w-16 h-16 text-gray-300 mb-4" />
              <h2 className="text-xl font-semibold mb-2">AI Study Assistant</h2>
              <p className="text-center mb-6 max-w-md">
                Ask me anything about your documents, get explanations, create study materials, 
                or discuss complex topics. I'm here to help you learn!
              </p>
              
              {/* Suggestions */}
              {suggestions.length > 0 && (
                <div className="w-full max-w-2xl">
                  <h3 className="text-sm font-medium text-gray-700 mb-3">Suggested questions:</h3>
                  <div className="grid gap-2">
                    {suggestions.slice(0, 4).map((suggestion, index) => (
                      <button
                        key={index}
                        onClick={() => handleSuggestionClick(suggestion)}
                        className="p-3 text-left bg-white border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors text-sm"
                      >
                        {suggestion}
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>
          ) : (
            <>
              {currentChat.messages?.map((msg, index) => (
                <div
                  key={index}
                  className={`flex gap-3 ${
                    msg.role === 'user' ? 'flex-row-reverse' : 'flex-row'
                  }`}
                >
                  <div className={`flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center ${
                    msg.role === 'user' 
                      ? 'bg-blue-600 text-white' 
                      : 'bg-gray-200 text-gray-600'
                  }`}>
                    {msg.role === 'user' ? (
                      <User className="w-4 h-4" />
                    ) : (
                      <Bot className="w-4 h-4" />
                    )}
                  </div>
                  <div className={`max-w-xs lg:max-w-2xl ${
                    msg.role === 'user' ? 'mr-auto' : 'ml-auto'
                  }`}>
                    <div className={`rounded-2xl p-3 ${
                      msg.role === 'user'
                        ? 'bg-blue-600 text-white'
                        : 'bg-white border border-gray-200 text-gray-900'
                    }`}>
                      <p className="whitespace-pre-wrap">{msg.content}</p>
                      {msg.metadata && (
                        <div className={`text-xs mt-2 opacity-70 ${
                          msg.role === 'user' ? 'text-blue-100' : 'text-gray-500'
                        }`}>
                          {msg.metadata.processingTime && (
                            <span>⚡ {msg.metadata.processingTime}ms</span>
                          )}
                          {msg.metadata.tokens && (
                            <span className="ml-2">🎯 {msg.metadata.tokens} tokens</span>
                          )}
                        </div>
                      )}
                    </div>
                    <div className={`text-xs text-gray-500 mt-1 ${
                      msg.role === 'user' ? 'text-right' : 'text-left'
                    }`}>
                      {formatTime(msg.timestamp)}
                    </div>
                  </div>
                </div>
              ))}
              
              {/* Typing indicator */}
              {isTyping && (
                <div className="flex gap-3">
                  <div className="flex-shrink-0 w-8 h-8 rounded-full bg-gray-200 text-gray-600 flex items-center justify-center">
                    <Bot className="w-4 h-4" />
                  </div>
                  <div className="bg-white border border-gray-200 rounded-2xl p-3">
                    <div className="flex gap-1">
                      <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"></div>
                      <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{animationDelay: '0.1s'}}></div>
                      <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{animationDelay: '0.2s'}}></div>
                    </div>
                  </div>
                </div>
              )}
              
              <div ref={messagesEndRef} />
            </>
          )}
        </div>

        {/* Error Message */}
        {error && (
          <div className="mx-4 mb-4 p-3 bg-red-50 border border-red-200 rounded-lg">
            <div className="flex items-center gap-2 text-red-700">
              <AlertCircle className="w-4 h-4" />
              <p className="text-sm">{error}</p>
              <button
                onClick={clearError}
                className="ml-auto text-red-600 hover:text-red-800"
              >
                ×
              </button>
            </div>
          </div>
        )}

        {/* Message Input */}
        <div className="bg-white border-t border-gray-200 p-4">
          <div className="flex gap-3 items-end max-w-4xl mx-auto">
            <div className="flex-1 relative">
              <textarea
                ref={inputRef}
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                onKeyPress={handleKeyPress}
                placeholder="Ask me anything about your studies..."
                className="w-full p-3 pr-12 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 resize-none"
                rows="1"
                style={{ minHeight: '44px', maxHeight: '120px' }}
                disabled={isSending}
              />
            </div>
            <button
              onClick={() => handleSendMessage()}
              disabled={!message.trim() || isSending}
              className="p-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              {isSending ? (
                <Loader className="w-5 h-5 animate-spin" />
              ) : (
                <Send className="w-5 h-5" />
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
'use client';

import React, { createContext, useContext, useReducer, useEffect, ReactNode } from 'react';
import { useAuth } from './AuthContext';
import { useNotifications } from './NotificationContext';

interface Message {
  role: 'user' | 'assistant' | 'system';
  content: string;
  timestamp: Date;
  metadata?: {
    tokens?: number;
    model?: string;
    processingTime?: number;
  };
}

interface Chat {
  _id: string;
  userId: string;
  title: string;
  messages: Message[];
  context: {
    documentId?: string;
    documentName?: string;
    topic?: string;
  };
  settings: {
    model: string;
    temperature: number;
    maxTokens: number;
  };
  isActive: boolean;
  lastActivity: Date;
  createdAt: Date;
}

interface Model {
  id: string;
  name: string;
  description: string;
}

interface ChatState {
  chats: Chat[];
  currentChat: Chat | null;
  isLoading: boolean;
  error: string | null;
  isTyping: boolean;
  models: Model[];
}

interface ChatAction {
  type: string;
  payload?: any;
}

interface ChatContextType extends ChatState {
  getChats: () => Promise<Chat[]>;
  getChat: (chatId: string) => Promise<Chat>;
  createChat: (options?: any) => Promise<Chat>;
  sendMessage: (chatId: string, message: string, documentContext?: any) => Promise<any>;
  createDocumentChat: (documentId: string, initialMessage?: string) => Promise<Chat>;
  getChatSuggestions: (documentId: string) => Promise<string[]>;
  deleteChat: (chatId: string) => Promise<void>;
  updateChatSettings: (chatId: string, settings: any) => Promise<Chat>;
  getModels: () => Promise<Model[]>;
  clearError: () => void;
  dispatch: React.Dispatch<ChatAction>;
}

const ChatContext = createContext<ChatContextType | undefined>(undefined);

// Chat state management
const initialState = {
  chats: [],
  currentChat: null,
  isLoading: false,
  error: null,
  isTyping: false,
  models: [
    { id: 'gpt-3.5-turbo', name: 'GPT-3.5 Turbo', description: 'Fast and efficient' },
    { id: 'gpt-4', name: 'GPT-4', description: 'Advanced reasoning' }
  ]
};

function chatReducer(state: ChatState, action: ChatAction): ChatState {
  switch (action.type) {
    case 'SET_LOADING':
      return { ...state, isLoading: action.payload };
    
    case 'SET_ERROR':
      return { ...state, error: action.payload, isLoading: false };
    
    case 'SET_CHATS':
      return { ...state, chats: action.payload, isLoading: false };
    
    case 'SET_CURRENT_CHAT':
      return { ...state, currentChat: action.payload, isLoading: false };
    
    case 'ADD_CHAT':
      return {
        ...state,
        chats: [action.payload, ...state.chats],
        currentChat: action.payload,
        isLoading: false
      };
    
    case 'UPDATE_CHAT':
      const updatedChats = state.chats.map(chat =>
        chat._id === action.payload._id ? action.payload : chat
      );
      return {
        ...state,
        chats: updatedChats,
        currentChat: state.currentChat?._id === action.payload._id 
          ? action.payload 
          : state.currentChat
      };
    
    case 'DELETE_CHAT':
      const filteredChats = state.chats.filter(chat => chat._id !== action.payload);
      return {
        ...state,
        chats: filteredChats,
        currentChat: state.currentChat?._id === action.payload ? null : state.currentChat
      };
    
    case 'ADD_MESSAGE':
      if (!state.currentChat || state.currentChat._id !== action.payload.chatId) {
        return state;
      }
      
      const updatedCurrentChat = {
        ...state.currentChat,
        messages: [...state.currentChat.messages, action.payload.message],
        lastActivity: new Date()
      };
      
      const updatedChatsWithMessage = state.chats.map(chat =>
        chat._id === action.payload.chatId ? updatedCurrentChat : chat
      );
      
      return {
        ...state,
        currentChat: updatedCurrentChat,
        chats: updatedChatsWithMessage
      };
    
    case 'ADD_MESSAGES':
      if (!state.currentChat || state.currentChat._id !== action.payload.chatId) {
        return state;
      }
      
      const chatWithNewMessages = {
        ...state.currentChat,
        messages: [...state.currentChat.messages, ...action.payload.messages],
        lastActivity: new Date()
      };
      
      const chatsWithNewMessages = state.chats.map(chat =>
        chat._id === action.payload.chatId ? chatWithNewMessages : chat
      );
      
      return {
        ...state,
        currentChat: chatWithNewMessages,
        chats: chatsWithNewMessages
      };
    
    case 'SET_TYPING':
      return { ...state, isTyping: action.payload };
    
    case 'SET_MODELS':
      return { ...state, models: action.payload };
    
    case 'CLEAR_ERROR':
      return { ...state, error: null };
    
    default:
      return state;
  }
}

interface ChatProviderProps {
  children: ReactNode;
}

export function ChatProvider({ children }: ChatProviderProps) {
  const [state, dispatch] = useReducer(chatReducer, initialState);
  const { user } = useAuth();
  const { socket } = useNotifications();

  // WebSocket event handlers
  useEffect(() => {
    if (!socket) return;

    const handleChatCreated = (data: any) => {
      dispatch({ type: 'ADD_CHAT', payload: data });
    };

    const handleChatDeleted = (data: any) => {
      dispatch({ type: 'DELETE_CHAT', payload: data.chatId });
    };

    const handleNewMessages = (data: any) => {
      dispatch({ type: 'ADD_MESSAGES', payload: data });
    };

    const handleChatThinking = (data: any) => {
      dispatch({ type: 'SET_TYPING', payload: true });
    };

    const handleChatError = (data: any) => {
      dispatch({ type: 'SET_ERROR', payload: data.error });
      dispatch({ type: 'SET_TYPING', payload: false });
    };

    // Register event listeners
    socket.on('chat:created', handleChatCreated);
    socket.on('chat:deleted', handleChatDeleted);
    socket.on('chat:newMessages', handleNewMessages);
    socket.on('chat:thinking', handleChatThinking);
    socket.on('chat:error', handleChatError);

    return () => {
      socket.off('chat:created', handleChatCreated);
      socket.off('chat:deleted', handleChatDeleted);
      socket.off('chat:newMessages', handleNewMessages);
      socket.off('chat:thinking', handleChatThinking);
      socket.off('chat:error', handleChatError);
    };
  }, [socket]);

  // API Functions
  const api = {
    async request(endpoint, options = {}) {
      const url = `${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001'}/api${endpoint}`;
      
      const response = await fetch(url, {
        headers: {
          'Content-Type': 'application/json',
          'Authorization': token ? `Bearer ${token}` : '',
          ...options.headers,
        },
        ...options,
      });

      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.message || 'Request failed');
      }
      
      return data;
    },

    // Get user chats
    async getChats() {
      dispatch({ type: 'SET_LOADING', payload: true });
      try {
        const data = await this.request('/chat');
        dispatch({ type: 'SET_CHATS', payload: data.chats });
        return data.chats;
      } catch (error) {
        dispatch({ type: 'SET_ERROR', payload: error.message });
        throw error;
      }
    },

    // Get specific chat
    async getChat(chatId) {
      dispatch({ type: 'SET_LOADING', payload: true });
      try {
        const data = await this.request(`/chat/${chatId}`);
        dispatch({ type: 'SET_CURRENT_CHAT', payload: data.chat });
        return data.chat;
      } catch (error) {
        dispatch({ type: 'SET_ERROR', payload: error.message });
        throw error;
      }
    },

    // Create new chat
    async createChat(options = {}) {
      dispatch({ type: 'SET_LOADING', payload: true });
      try {
        const data = await this.request('/chat', {
          method: 'POST',
          body: JSON.stringify(options),
        });
        dispatch({ type: 'ADD_CHAT', payload: data.chat });
        return data.chat;
      } catch (error) {
        dispatch({ type: 'SET_ERROR', payload: error.message });
        throw error;
      }
    },

    // Send message
    async sendMessage(chatId, message, documentContext = null) {
      dispatch({ type: 'SET_TYPING', payload: true });
      try {
        // Add user message immediately for UI responsiveness
        dispatch({
          type: 'ADD_MESSAGE',
          payload: {
            chatId,
            message: {
              role: 'user',
              content: message,
              timestamp: new Date(),
            }
          }
        });

        const data = await this.request(`/chat/${chatId}/messages`, {
          method: 'POST',
          body: JSON.stringify({ message, documentContext }),
        });

        dispatch({ type: 'SET_TYPING', payload: false });
        return data;
      } catch (error) {
        dispatch({ type: 'SET_ERROR', payload: error.message });
        dispatch({ type: 'SET_TYPING', payload: false });
        throw error;
      }
    },

    // Create document chat
    async createDocumentChat(documentId, initialMessage = null) {
      dispatch({ type: 'SET_LOADING', payload: true });
      try {
        const data = await this.request(`/chat/document/${documentId}`, {
          method: 'POST',
          body: JSON.stringify({ initialMessage }),
        });
        dispatch({ type: 'ADD_CHAT', payload: data.chat });
        return data.chat;
      } catch (error) {
        dispatch({ type: 'SET_ERROR', payload: error.message });
        throw error;
      }
    },

    // Get chat suggestions for document
    async getChatSuggestions(documentId) {
      try {
        const data = await this.request(`/chat/document/${documentId}/suggestions`);
        return data.suggestions;
      } catch (error) {
        console.error('Error getting chat suggestions:', error);
        return [];
      }
    },

    // Delete chat
    async deleteChat(chatId) {
      try {
        await this.request(`/chat/${chatId}`, { method: 'DELETE' });
        dispatch({ type: 'DELETE_CHAT', payload: chatId });
      } catch (error) {
        dispatch({ type: 'SET_ERROR', payload: error.message });
        throw error;
      }
    },

    // Update chat settings
    async updateChatSettings(chatId, settings) {
      try {
        const data = await this.request(`/chat/${chatId}/settings`, {
          method: 'PUT',
          body: JSON.stringify({ settings }),
        });
        dispatch({ type: 'UPDATE_CHAT', payload: data.chat });
        return data.chat;
      } catch (error) {
        dispatch({ type: 'SET_ERROR', payload: error.message });
        throw error;
      }
    },

    // Get available models
    async getModels() {
      try {
        const data = await this.request('/chat/models');
        dispatch({ type: 'SET_MODELS', payload: data.models });
        return data.models;
      } catch (error) {
        console.error('Error getting models:', error);
        return state.models;
      }
    }
  };

  const clearError = () => {
    dispatch({ type: 'CLEAR_ERROR' });
  };

  const value = {
    ...state,
    ...api,
    clearError,
    dispatch,
  };

  return (
    <ChatContext.Provider value={value}>
      {children}
    </ChatContext.Provider>
  );
}

export function useChat() {
  const context = useContext(ChatContext);
  if (!context) {
    throw new Error('useChat must be used within a ChatProvider');
  }
  return context;
}
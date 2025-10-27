'use client';

import React from 'react';
import { ChatProvider } from '../../contexts/ChatContext';
import Chat from '../../components/Chat';
import { NotificationProvider } from '../../contexts/NotificationContext';
import { AuthProvider } from '../../contexts/AuthContext';

export default function ChatPage() {
  return (
    <AuthProvider>
      <NotificationProvider>
        <ChatProvider>
          <div className="min-h-screen bg-gray-50">
            <Chat />
          </div>
        </ChatProvider>
      </NotificationProvider>
    </AuthProvider>
  );
}
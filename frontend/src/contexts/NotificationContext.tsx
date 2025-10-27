'use client';

import { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { useAuth } from './AuthContext';
import { io, Socket } from 'socket.io-client';

interface Notification {
  id: string;
  type: 'success' | 'info' | 'warning' | 'error';
  title: string;
  message: string;
  timestamp: Date;
  read: boolean;
  actionUrl?: string;
  actionText?: string;
}

interface NotificationContextType {
  notifications: Notification[];
  unreadCount: number;
  addNotification: (notification: Omit<Notification, 'id' | 'timestamp' | 'read'>) => void;
  markAsRead: (id: string) => void;
  markAllAsRead: () => void;
  removeNotification: (id: string) => void;
  clearAll: () => void;
  isConnected: boolean;
}

const NotificationContext = createContext<NotificationContextType | undefined>(undefined);

interface NotificationProviderProps {
  children: ReactNode;
}

export function NotificationProvider({ children }: NotificationProviderProps) {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [isConnected, setIsConnected] = useState(false);
  const { user, isAuthenticated } = useAuth();

  useEffect(() => {
    let socket: Socket | null = null;

    if (isAuthenticated && user) {
      // Connect to Socket.IO server
      const connectWebSocket = () => {
        try {
          // Connect to Socket.IO server
          const serverUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';
          const token = localStorage.getItem('token');
          
          socket = io(serverUrl, {
            auth: {
              token: token
            },
            transports: ['websocket', 'polling'],
            autoConnect: true
          });

          socket.on('connect', () => {
            console.log('WebSocket connected');
            setIsConnected(true);
          });

          socket.on('notification', (data) => {
            try {
              switch (data.type) {
                case 'notification':
                  addNotification(data.notification);
                  break;
                case 'document_processed':
                  addNotification({
                    type: 'success',
                    title: 'Document Processed',
                    message: `${data.fileName} has been successfully processed`,
                    actionUrl: `/documents/${data.documentId}`,
                    actionText: 'View Document'
                  });
                  break;
                case 'summary_ready':
                  addNotification({
                    type: 'info',
                    title: 'Summary Ready',
                    message: `Summary for "${data.documentName}" is now available`,
                    actionUrl: `/documents/${data.documentId}/summary`,
                    actionText: 'View Summary'
                  });
                  break;
                case 'exam_ready':
                  addNotification({
                    type: 'info',
                    title: 'Exam Generated',
                    message: `Exam questions for "${data.documentName}" are ready`,
                    actionUrl: `/documents/${data.documentId}/exam`,
                    actionText: 'Take Exam'
                  });
                  break;
                case 'processing_error':
                  addNotification({
                    type: 'error',
                    title: 'Processing Failed',
                    message: `Failed to process "${data.fileName}": ${data.error}`,
                    actionUrl: '/documents',
                    actionText: 'View Documents'
                  });
                  break;
                case 'quota_warning':
                  addNotification({
                    type: 'warning',
                    title: 'Usage Warning',
                    message: `You've used ${data.usage}% of your monthly quota`,
                    actionUrl: '/profile',
                    actionText: 'Upgrade Plan'
                  });
                  break;
              }
            } catch (error) {
              console.error('Error parsing WebSocket message:', error);
            }
          });

          socket.on('disconnect', () => {
            console.log('WebSocket disconnected');
            setIsConnected(false);
          });

          socket.on('connect_error', (error) => {
            console.error('WebSocket connection error:', error);
            setIsConnected(false);
          });

          // Enable auto-reconnection
          socket.on('reconnect', () => {
            console.log('WebSocket reconnected');
            setIsConnected(true);
          });

        } catch (error) {
          console.error('Failed to connect to WebSocket:', error);
          setIsConnected(false);
        }
      };

      connectWebSocket();
    }

    return () => {
      if (socket) {
        socket.disconnect();
      }
    };
  }, [isAuthenticated, user]);

  const addNotification = (notificationData: Omit<Notification, 'id' | 'timestamp' | 'read'>) => {
    const notification: Notification = {
      ...notificationData,
      id: Date.now().toString() + Math.random().toString(36).substr(2, 9),
      timestamp: new Date(),
      read: false
    };

    setNotifications(prev => [notification, ...prev]);

    // Show browser notification if permission is granted
    if (Notification.permission === 'granted') {
      new Notification(notification.title, {
        body: notification.message,
        icon: '/favicon.ico'
      });
    }

    // Auto-remove success notifications after 5 seconds
    if (notification.type === 'success') {
      setTimeout(() => {
        removeNotification(notification.id);
      }, 5000);
    }
  };

  const markAsRead = (id: string) => {
    setNotifications(prev => 
      prev.map(notification => 
        notification.id === id 
          ? { ...notification, read: true }
          : notification
      )
    );
  };

  const markAllAsRead = () => {
    setNotifications(prev => 
      prev.map(notification => ({ ...notification, read: true }))
    );
  };

  const removeNotification = (id: string) => {
    setNotifications(prev => prev.filter(notification => notification.id !== id));
  };

  const clearAll = () => {
    setNotifications([]);
  };

  const unreadCount = notifications.filter(n => !n.read).length;

  const value: NotificationContextType = {
    notifications,
    unreadCount,
    addNotification,
    markAsRead,
    markAllAsRead,
    removeNotification,
    clearAll,
    isConnected
  };

  return (
    <NotificationContext.Provider value={value}>
      {children}
    </NotificationContext.Provider>
  );
}

export function useNotifications() {
  const context = useContext(NotificationContext);
  if (context === undefined) {
    throw new Error('useNotifications must be used within a NotificationProvider');
  }
  return context;
}
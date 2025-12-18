import { useEffect, useRef, useState } from 'react';
import { io, Socket } from 'socket.io-client';
import { useAuth } from '@/context/AuthContext';
import { API_BASE_URL } from '@/lib/api';

export const useSessionSocket = () => {
  const { logout } = useAuth();
  const socketRef = useRef<Socket | null>(null);
  const [sessionTerminated, setSessionTerminated] = useState(false);
  const [terminationMessage, setTerminationMessage] = useState('');

  useEffect(() => {
    // Get token from storage
    const token = localStorage.getItem('token') || sessionStorage.getItem('token');
    
    if (!token) {
      console.log('No token found, skipping socket connection');
      return;
    }

    // Initialize socket connection
    console.log('🔌 Initializing Socket.IO connection...');
    
    const socket = io(API_BASE_URL, {
      auth: {
        token: token,
      },
      transports: ['websocket', 'polling'],
      reconnection: true,
      reconnectionAttempts: 5,
      reconnectionDelay: 1000,
    });

    socketRef.current = socket;

    // Connection event handlers
    socket.on('connect', () => {
      console.log('✅ Socket.IO connected');
    });

    socket.on('connected', (data) => {
      console.log('✅ Socket.IO server confirmed connection:', data);
    });

    socket.on('disconnect', (reason) => {
      console.log('🔌 Socket.IO disconnected:', reason);
    });

    socket.on('connect_error', (error) => {
      console.error('❌ Socket.IO connection error:', error.message);
    });

    // Session termination handler
    socket.on('session:terminated', (data) => {
      console.log('🔴 Session terminated:', data);
      
      // Set termination state
      setTerminationMessage(data.message || 'Your session has been terminated by an administrator');
      setSessionTerminated(true);
      
      // Disconnect socket
      socket.disconnect();
      
      // Log out user after a brief delay to show the message
      setTimeout(() => {
        logout();
      }, 3000);
    });

    // Cleanup on unmount
    return () => {
      console.log('🔌 Cleaning up Socket.IO connection');
      socket.off('connect');
      socket.off('connected');
      socket.off('disconnect');
      socket.off('connect_error');
      socket.off('session:terminated');
      socket.disconnect();
      socketRef.current = null;
    };
  }, [logout]);

  return {
    socket: socketRef.current,
    sessionTerminated,
    terminationMessage,
  };
};

import { createContext, useContext, useEffect, useRef } from 'react';
import { io } from 'socket.io-client';
import useAuthStore from './authStore';

const SocketContext = createContext(null);
const SOCKET_URL = import.meta.env.VITE_API_URL?.replace('/api', '') || window.location.origin;

export function SocketProvider({ children }) {
  const socketRef = useRef(null);
  const { user, isAuthenticated } = useAuthStore();
  const reconnectAttempts = useRef(0);
  const MAX_RECONNECT_ATTEMPTS = 3;

  useEffect(() => {
    // Initialize socket with limited reconnection
    socketRef.current = io(SOCKET_URL, {
      withCredentials: true,
      transports: ['websocket', 'polling'],
      path: '/socket.io/',
      reconnection: true,
      reconnectionAttempts: MAX_RECONNECT_ATTEMPTS,
      reconnectionDelay: 2000,
      reconnectionDelayMax: 5000,
      timeout: 10000,
      autoConnect: true,
    });

    socketRef.current.on('connect', () => {
      console.log('Socket connected:', socketRef.current.id);
      reconnectAttempts.current = 0; // Reset on successful connection
      socketRef.current.emit('join:stocks');
    });

    socketRef.current.on('disconnect', (reason) => {
      console.log('Socket disconnected:', reason);
      // Don't block UI on socket issues
    });

    socketRef.current.on('connect_error', (error) => {
      console.error('Socket connection error:', error.message);
      reconnectAttempts.current++;
      
      if (reconnectAttempts.current >= MAX_RECONNECT_ATTEMPTS) {
        console.warn('Max socket reconnection attempts reached. Continuing without socket...');
        // Stop trying to reconnect - app continues without socket
        socketRef.current?.disconnect();
      }
    });

    socketRef.current.on('error', (error) => {
      console.error('Socket error:', error.message);
      // Non-blocking error handling
    });

    return () => {
      if (socketRef.current) {
        socketRef.current.removeAllListeners();
        socketRef.current.disconnect();
      }
    };
  }, []);

  useEffect(() => {
    if (isAuthenticated && user?._id && socketRef.current?.connected) {
      socketRef.current.emit('join:user', user._id);
    }
  }, [isAuthenticated, user?._id]);

  return (
    <SocketContext.Provider value={socketRef.current}>
      {children}
    </SocketContext.Provider>
  );
}

export const useSocket = () => useContext(SocketContext);

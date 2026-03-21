import { createContext, useContext, useEffect, useRef } from 'react';
import { io } from 'socket.io-client';
import useAuthStore from './authStore';

const SocketContext = createContext(null);
const SOCKET_URL = import.meta.env.VITE_API_URL?.replace('/api', '') || window.location.origin;

export function SocketProvider({ children }) {
  const socketRef = useRef(null);
  const { user, isAuthenticated } = useAuthStore();

  useEffect(() => {
    socketRef.current = io(SOCKET_URL, {
      withCredentials: true,
      transports: ['websocket', 'polling'],
      path: '/socket.io/',
    });

    socketRef.current.on('connect', () => {
      console.log('Socket connected:', socketRef.current.id);
      socketRef.current.emit('join:stocks');
    });

    socketRef.current.on('disconnect', () => {
      console.log('Socket disconnected');
    });

    return () => { socketRef.current?.disconnect(); };
  }, []);

  useEffect(() => {
    if (isAuthenticated && user?._id && socketRef.current) {
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

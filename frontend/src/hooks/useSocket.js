import { useEffect, useRef } from 'react';
import io from 'socket.io-client';

// Socket URL configuration - works for both local and production
const SOCKET_URL = process.env.REACT_APP_SOCKET_URL || 'http://localhost:5000';


let socket = null;
let refCount = 0; 

export const useSocket = () => {
  const socketRef = useRef(null);

  useEffect(() => {
   
    if (!socket) {
      socket = io(SOCKET_URL, {
        transports: ['websocket', 'polling'], 
        withCredentials: true 
      });
      
      
      socket.on('connect', () => {
        console.log('🔌 Socket connected to:', SOCKET_URL);
      });
      
      socket.on('disconnect', () => {
        console.log('🔌 Socket disconnected');
      });
      
      socket.on('connect_error', (error) => {
        console.error('Socket connection error:', error);
      });
    }
    
    socketRef.current = socket;
    refCount++; 
    
    return () => {
      refCount--; 
      
      if (refCount === 0 && socket) {
        console.log('🔌 Last component unmounted, disconnecting socket');
        socket.disconnect();
        socket = null;
      }
    };
  }, []);

  return socketRef.current;
};
// frontend/src/contexts/SocketContext.jsx
import { createContext, useContext, useEffect, useState, useRef } from 'react';
import { io } from 'socket.io-client';
import { useAuth } from './AuthContext';

const SocketContext = createContext(null);

export function SocketProvider({ children }) {
    const { user, isAuthenticated } = useAuth();
    const [socket, setSocket] = useState(null);
    const [isConnected, setIsConnected] = useState(false);
    const socketRef = useRef(null);

    useEffect(() => {
        if (!isAuthenticated || !user) {
            if (socketRef.current) {
                socketRef.current.disconnect();
                setSocket(null);
                socketRef.current = null;
            }
            return;
        }

        // Создаем подключение только если его еще нет
        if (!socketRef.current) {
            const token = localStorage.getItem('token');
            
            const newSocket = io('http://localhost:3000', {
                transports: ['websocket', 'polling'],
                auth: { token },
                reconnection: true,
                reconnectionAttempts: 5,
                reconnectionDelay: 1000,
            });

            socketRef.current = newSocket;
            setSocket(newSocket);

            newSocket.on('connect', () => {
                console.log('Socket connected:', newSocket.id);
                setIsConnected(true);
            });

            newSocket.on('disconnect', () => {
                console.log('Socket disconnected');
                setIsConnected(false);
            });

            newSocket.on('connect_error', (error) => {
                console.error('Socket connection error:', error.message);
            });

            newSocket.on('error', (error) => {
                console.error('Socket error:', error);
            });
        }

        // Очистка при размонтировании
        return () => {
            if (socketRef.current) {
                socketRef.current.disconnect();
                socketRef.current = null;
                setSocket(null);
            }
        };
    }, [isAuthenticated, user]);

    const joinChat = (chatId) => {
        if (socketRef.current && chatId) {
            socketRef.current.emit('join-chat', chatId);
        }
    };

    const joinSession = (sessionId) => {
        if (socketRef.current && sessionId) {
            socketRef.current.emit('join-session', sessionId);
        }
    };

    const value = {
        socket: socketRef.current,
        isConnected,
        joinChat,
        joinSession
    };

    return (
        <SocketContext.Provider value={value}>
            {children}
        </SocketContext.Provider>
    );
}

export function useSocket() {
    const context = useContext(SocketContext);
    if (!context) {
        throw new Error('useSocket must be used within a SocketProvider');
    }
    return context;
}
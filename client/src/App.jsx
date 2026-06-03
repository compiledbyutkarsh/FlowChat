import { useState, useEffect, useRef } from 'react';
import { io } from 'socket.io-client';
import Join from './pages/Join';
import ChatRoom from './pages/ChatRoom';

export default function App() {
  const [user, setUser] = useState(null);
  const socketRef = useRef(null);
  const [connected, setConnected] = useState(false);

  useEffect(() => {
    socketRef.current = io('http://localhost:3002', { transports: ['websocket'] });
    socketRef.current.on('connect', () => setConnected(true));
    socketRef.current.on('disconnect', () => setConnected(false));
    return () => socketRef.current?.disconnect();
  }, []);

  const handleJoin = (userData) => setUser(userData);
  const handleLeave = () => setUser(null);

  if (!user) return <Join onJoin={handleJoin} />;

  return (
    <ChatRoom
      socket={socketRef.current}
      user={user}
      onLeave={handleLeave}
    />
  );
}

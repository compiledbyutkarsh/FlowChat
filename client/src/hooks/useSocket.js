import { useEffect, useRef, useState } from 'react';
import { io } from 'socket.io-client';

const SOCKET_URL = 'http://localhost:3002';

export default function useSocket() {
  const socketRef = useRef(null);
  const [connected, setConnected] = useState(false);

  useEffect(() => {
    socketRef.current = io(SOCKET_URL, { transports: ['websocket'] });
    socketRef.current.on('connect', () => setConnected(true));
    socketRef.current.on('disconnect', () => setConnected(false));
    return () => socketRef.current?.disconnect();
  }, []);

  return { socket: socketRef.current, connected };
}

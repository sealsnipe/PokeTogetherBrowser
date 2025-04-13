import { useEffect, useRef, useState } from 'react';
import io from 'socket.io-client';

export default function Game() {
  const canvasRef = useRef(null);
  const [players, setPlayers] = useState({});
  const [myId, setMyId] = useState(null);
  const socketRef = useRef(null);

  useEffect(() => {
    // SessionId aus localStorage lesen
    const sessionId = typeof window !== 'undefined' ? localStorage.getItem('sessionId') : null;
    if (!sessionId) {
      window.location.href = '/login.html';
      return;
    }

    // Socket.io-Verbindung mit Authentifizierung aufbauen
    const socket = io('http://localhost:3001', {
      auth: { sessionId }
    });
    socketRef.current = socket;

    socket.on('init', (serverPlayers) => {
      setPlayers(serverPlayers);
      setMyId(socket.id);
    });
    socket.on('player-joined', ({ id, pos }) => {
      setPlayers(prev => ({ ...prev, [id]: pos }));
    });
    socket.on('player-moved', ({ id, pos }) => {
      setPlayers(prev => ({ ...prev, [id]: pos }));
    });
    socket.on('player-left', (id) => {
      setPlayers(prev => {
        const cp = { ...prev };
        delete cp[id];
        return cp;
      });
    });
    socket.on('connect_error', (error) => {
      if (error.message === 'Nicht authentifiziert') {
        localStorage.removeItem('sessionId');
        localStorage.removeItem('username');
        window.location.href = '/login.html';
      }
    });

    return () => {
      socket.disconnect();
    };
  }, []);

  useEffect(() => {
    function handleKey(e) {
      if (!myId || !socketRef.current) return;
      setPlayers(prev => {
        const pos = { ...(prev[myId] || { x: 250, y: 250 }) };
        const step = 5;
        if (e.key === 'ArrowUp') pos.y -= step;
        if (e.key === 'ArrowDown') pos.y += step;
        if (e.key === 'ArrowLeft') pos.x -= step;
        if (e.key === 'ArrowRight') pos.x += step;
        socketRef.current.emit('move', pos);
        return { ...prev, [myId]: pos };
      });
    }
    window.addEventListener('keydown', handleKey);
    return () => window.removeEventListener('keydown', handleKey);
  }, [myId]);

  useEffect(() => {
    const ctx = canvasRef.current?.getContext('2d');
    function draw() {
      if (!ctx) return; // Check if context is valid
      ctx.fillStyle = 'white';
      ctx.fillRect(0, 0, 500, 500);
      Object.entries(players).forEach(([id, pos]) => {
        ctx.fillStyle = id === myId ? 'blue' : 'red';
        ctx.fillRect(pos.x, pos.y, 20, 20);
      });
      requestAnimationFrame(draw);
    }
    draw();
  }, [players, myId, canvasRef]);

  return <canvas ref={canvasRef} width={500} height={500} style={{ border: '1px solid #000' }} />;
}

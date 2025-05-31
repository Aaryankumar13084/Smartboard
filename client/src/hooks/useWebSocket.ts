import { useEffect, useRef, useState } from 'react';
import type { DrawingEvent } from '@shared/schema';
import type { WebSocketMessage } from '@/types/whiteboard';

interface UseWebSocketProps {
  boardId: number;
  userId: number;
  onDrawingEvent: (event: DrawingEvent) => void;
  onUserJoined: (userId: number, activeSessions: number) => void;
  onUserLeft: (userId: number, activeSessions: number) => void;
}

export function useWebSocket({
  boardId,
  userId,
  onDrawingEvent,
  onUserJoined,
  onUserLeft,
}: UseWebSocketProps) {
  const ws = useRef<WebSocket | null>(null);
  const [isConnected, setIsConnected] = useState(false);

  useEffect(() => {
    let reconnectAttempts = 0;
    const maxReconnectAttempts = 3;
    let reconnectTimer: NodeJS.Timeout;

    const connect = () => {
      try {
        const protocol = window.location.protocol === "https:" ? "wss:" : "ws:";
        const wsUrl = `${protocol}//${window.location.host}/ws`;
        
        ws.current = new WebSocket(wsUrl);

        ws.current.onopen = () => {
          setIsConnected(true);
          reconnectAttempts = 0;
          // Join board
          ws.current?.send(JSON.stringify({
            type: 'join',
            boardId,
            userId,
          }));
        };

        ws.current.onmessage = (event) => {
          try {
            const message: WebSocketMessage = JSON.parse(event.data);
            
            switch (message.type) {
              case 'drawing':
                if (message.event) {
                  onDrawingEvent(message.event);
                }
                break;
              case 'user_joined':
                if (message.userId && message.activeSessions !== undefined) {
                  onUserJoined(message.userId, message.activeSessions);
                }
                break;
              case 'user_left':
                if (message.userId && message.activeSessions !== undefined) {
                  onUserLeft(message.userId, message.activeSessions);
                }
                break;
            }
          } catch (error) {
            console.error('Failed to parse WebSocket message:', error);
          }
        };

        ws.current.onclose = () => {
          setIsConnected(false);
          // Try to reconnect
          if (reconnectAttempts < maxReconnectAttempts) {
            reconnectAttempts++;
            reconnectTimer = setTimeout(connect, 2000);
          }
        };

        ws.current.onerror = () => {
          setIsConnected(false);
        };
      } catch (error) {
        console.error('WebSocket connection failed:', error);
        setIsConnected(false);
      }
    };

    connect();

    return () => {
      if (reconnectTimer) {
        clearTimeout(reconnectTimer);
      }
      if (ws.current) {
        ws.current.close();
      }
    };
  }, [boardId, userId, onDrawingEvent, onUserJoined, onUserLeft]);

  const sendDrawingEvent = (event: DrawingEvent) => {
    if (ws.current && ws.current.readyState === WebSocket.OPEN) {
      ws.current.send(JSON.stringify({
        type: 'drawing',
        event,
      }));
    }
  };

  return {
    isConnected,
    sendDrawingEvent,
  };
}

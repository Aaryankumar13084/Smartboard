import type { Express } from "express";
import { createServer, type Server } from "http";
import { WebSocketServer, WebSocket } from "ws";
import { storage } from "./storage";
import { insertBoardSchema, insertBoardSessionSchema, DrawingEventSchema, type DrawingEvent } from "@shared/schema";

interface WebSocketClient extends WebSocket {
  boardId?: number;
  userId?: number;
}

export async function registerRoutes(app: Express): Promise<Server> {
  const httpServer = createServer(app);

  // WebSocket server for real-time collaboration
  const wss = new WebSocketServer({ server: httpServer, path: '/ws' });
  
  const boardClients = new Map<number, Set<WebSocketClient>>();

  wss.on('connection', (ws: WebSocketClient) => {
    console.log('WebSocket client connected');

    ws.on('message', async (message) => {
      try {
        const data = JSON.parse(message.toString());
        
        if (data.type === 'join') {
          const { boardId, userId } = data;
          ws.boardId = boardId;
          ws.userId = userId;
          
          if (!boardClients.has(boardId)) {
            boardClients.set(boardId, new Set());
          }
          boardClients.get(boardId)!.add(ws);
          
          // Create board session
          await storage.createBoardSession({ boardId, userId });
          
          // Broadcast user joined
          const clients = boardClients.get(boardId);
          if (clients) {
            const activeSessions = await storage.getBoardSessions(boardId);
            clients.forEach(client => {
              if (client.readyState === WebSocket.OPEN) {
                client.send(JSON.stringify({
                  type: 'user_joined',
                  userId,
                  activeSessions: activeSessions.length
                }));
              }
            });
          }
        } else if (data.type === 'drawing') {
          // Validate drawing event
          const drawingEvent = DrawingEventSchema.parse(data.event);
          
          // Broadcast to all clients in the same board
          if (ws.boardId && boardClients.has(ws.boardId)) {
            const clients = boardClients.get(ws.boardId);
            clients?.forEach(client => {
              if (client !== ws && client.readyState === WebSocket.OPEN) {
                client.send(JSON.stringify({
                  type: 'drawing',
                  event: drawingEvent
                }));
              }
            });
          }
          
          // Update board data
          if (ws.boardId) {
            const board = await storage.getBoard(ws.boardId);
            if (board) {
              const boardData = board.data as any || { events: [] };
              boardData.events = boardData.events || [];
              boardData.events.push(drawingEvent);
              await storage.updateBoard(ws.boardId, { data: boardData });
            }
          }
        }
      } catch (error) {
        console.error('WebSocket message error:', error);
      }
    });

    ws.on('close', async () => {
      if (ws.boardId && ws.userId) {
        // Remove from board clients
        const clients = boardClients.get(ws.boardId);
        if (clients) {
          clients.delete(ws);
          if (clients.size === 0) {
            boardClients.delete(ws.boardId);
          }
        }
        
        // Deactivate session
        await storage.deactivateBoardSession(ws.boardId, ws.userId);
        
        // Broadcast user left
        if (clients && clients.size > 0) {
          const activeSessions = await storage.getBoardSessions(ws.boardId);
          clients.forEach(client => {
            if (client.readyState === WebSocket.OPEN) {
              client.send(JSON.stringify({
                type: 'user_left',
                userId: ws.userId,
                activeSessions: activeSessions.length
              }));
            }
          });
        }
      }
      console.log('WebSocket client disconnected');
    });
  });

  // Board API routes
  app.get('/api/boards', async (req, res) => {
    try {
      // For demo purposes, assume user ID 1
      const userId = 1;
      const boards = await storage.getBoardsByOwner(userId);
      res.json(boards);
    } catch (error) {
      res.status(500).json({ message: 'Failed to fetch boards' });
    }
  });

  app.post('/api/boards', async (req, res) => {
    try {
      const boardData = insertBoardSchema.parse(req.body);
      const board = await storage.createBoard(boardData);
      res.json(board);
    } catch (error) {
      res.status(400).json({ message: 'Invalid board data' });
    }
  });

  app.get('/api/boards/:id', async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const board = await storage.getBoard(id);
      if (!board) {
        return res.status(404).json({ message: 'Board not found' });
      }
      res.json(board);
    } catch (error) {
      res.status(500).json({ message: 'Failed to fetch board' });
    }
  });

  app.put('/api/boards/:id', async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const updates = req.body;
      const board = await storage.updateBoard(id, updates);
      if (!board) {
        return res.status(404).json({ message: 'Board not found' });
      }
      res.json(board);
    } catch (error) {
      res.status(500).json({ message: 'Failed to update board' });
    }
  });

  app.delete('/api/boards/:id', async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const deleted = await storage.deleteBoard(id);
      if (!deleted) {
        return res.status(404).json({ message: 'Board not found' });
      }
      res.json({ message: 'Board deleted successfully' });
    } catch (error) {
      res.status(500).json({ message: 'Failed to delete board' });
    }
  });

  app.get('/api/boards/:id/sessions', async (req, res) => {
    try {
      const boardId = parseInt(req.params.id);
      const sessions = await storage.getBoardSessions(boardId);
      res.json(sessions);
    } catch (error) {
      res.status(500).json({ message: 'Failed to fetch board sessions' });
    }
  });

  return httpServer;
}

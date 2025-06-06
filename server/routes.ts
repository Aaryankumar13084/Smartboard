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
          await storage.createBoardSession({ boardId, userId });

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
          const drawingEvent = DrawingEventSchema.parse(data.event);
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

          if (ws.boardId) {
            const board = await storage.getBoard(ws.boardId);
            if (board) {
              const boardData = board.data as any || { events: [] };
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
        const clients = boardClients.get(ws.boardId);
        if (clients) {
          clients.delete(ws);
          if (clients.size === 0) {
            boardClients.delete(ws.boardId);
          }
        }

        await storage.deactivateBoardSession(ws.boardId, ws.userId);

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

  // Board APIs
  app.get('/api/boards', async (req, res) => {
    try {
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
      if (!board) return res.status(404).json({ message: 'Board not found' });
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
      if (!board) return res.status(404).json({ message: 'Board not found' });
      res.json(board);
    } catch (error) {
      res.status(500).json({ message: 'Failed to update board' });
    }
  });

  app.delete('/api/boards/:id', async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const deleted = await storage.deleteBoard(id);
      if (!deleted) return res.status(404).json({ message: 'Board not found' });
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

  // 🌟 Gemini AI Endpoints 🌟
  app.post('/api/ai/analyze-handwriting', async (req, res) => {
    try {
      const { imageData, prompt } = req.body;
      const apiKey = process.env.GEMINI_API_KEY;
      if (!apiKey) return res.status(500).json({ error: 'Gemini API key not configured' });

      const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${apiKey}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [{
            parts: [
              { text: prompt || "Analyze handwriting and provide text recognition with corrections." },
              { inlineData: { mimeType: "image/png", data: imageData.split(',')[1] } }
            ]
          }]
        })
      });

      const data = await response.json();
      if (data.candidates?.[0]) {
        res.json({ success: true, result: data.candidates[0].content.parts[0].text });
      } else {
        res.status(500).json({ error: 'No response from Gemini API' });
      }
    } catch (error) {
      console.error('Gemini API error:', error);
      res.status(500).json({ error: 'Failed to process AI request' });
    }
  });

  app.post('/api/ai/smart-suggestions', async (req, res) => {
    try {
      const { content, context } = req.body;
      const apiKey = process.env.GEMINI_API_KEY;
      if (!apiKey) return res.status(500).json({ error: 'Gemini API key not configured' });

      const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${apiKey}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [{
            parts: [{ text: `Based on this whiteboard content: "${content}", provide smart suggestions for: ${context}.` }]
          }]
        })
      });

      const data = await response.json();
      if (data.candidates?.[0]) {
        res.json({ success: true, suggestions: data.candidates[0].content.parts[0].text });
      } else {
        res.status(500).json({ error: 'No response from Gemini API' });
      }
    } catch (error) {
      console.error('Gemini API error:', error);
      res.status(500).json({ error: 'Failed to get AI suggestions' });
    }
  });

  app.post('/api/ai/improve-sketch', async (req, res) => {
    try {
      const { imageData, improvements } = req.body;
      const apiKey = process.env.GEMINI_API_KEY;
      if (!apiKey) return res.status(500).json({ error: 'Gemini API key not configured' });

      const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${apiKey}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [{
            parts: [
              { text: `Analyze this sketch and suggest improvements focusing on structure, proportions, details, and techniques.` },
              { inlineData: { mimeType: "image/png", data: imageData.split(',')[1] } }
            ]
          }]
        })
      });

      const data = await response.json();
      if (data.candidates?.[0]) {
        res.json({ success: true, improvements: data.candidates[0].content.parts[0].text });
      } else {
        res.status(500).json({ error: 'No response from Gemini API' });
      }
    } catch (error) {
      console.error('Gemini API error:', error);
      res.status(500).json({ error: 'Failed to analyze sketch' });
    }
  });

  return httpServer;
}
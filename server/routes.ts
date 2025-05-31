import express, { Express } from "express";
import { createServer, Server } from "http";
import { WebSocketServer, WebSocket } from "ws";
import bodyParser from "body-parser";
import dotenv from "dotenv";
import { storage } from "./storage"; // Assume you have storage.ts with DB logic
import { DrawingEventSchema } from "@shared/schema";

dotenv.config();

interface WebSocketClient extends WebSocket {
  boardId?: number;
  userId?: number;
}

const app: Express = express();
app.use(bodyParser.json({ limit: '10mb' })); // Increase limit if needed
app.use(bodyParser.urlencoded({ extended: true }));

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

        if (!boardClients.has(boardId)) boardClients.set(boardId, new Set());
        boardClients.get(boardId)!.add(ws);

        await storage.createBoardSession({ boardId, userId });

        const clients = boardClients.get(boardId)!;
        const sessions = await storage.getBoardSessions(boardId);
        clients.forEach(client => {
          if (client.readyState === WebSocket.OPEN) {
            client.send(JSON.stringify({ type: 'user_joined', userId, activeSessions: sessions.length }));
          }
        });
      } else if (data.type === 'drawing') {
        const drawingEvent = DrawingEventSchema.parse(data.event);
        if (ws.boardId && boardClients.has(ws.boardId)) {
          const clients = boardClients.get(ws.boardId)!;
          clients.forEach(client => {
            if (client !== ws && client.readyState === WebSocket.OPEN) {
              client.send(JSON.stringify({ type: 'drawing', event: drawingEvent }));
            }
          });
        }

        if (ws.boardId) {
          const board = await storage.getBoard(ws.boardId);
          const boardData = board?.data as any || { events: [] };
          boardData.events.push(drawingEvent);
          await storage.updateBoard(ws.boardId, { data: boardData });
        }
      }
    } catch (error) {
      console.error('WebSocket error:', error);
    }
  });

  ws.on('close', async () => {
    if (ws.boardId && ws.userId) {
      const clients = boardClients.get(ws.boardId);
      clients?.delete(ws);
      if (clients?.size === 0) boardClients.delete(ws.boardId);
      await storage.deactivateBoardSession(ws.boardId, ws.userId);

      if (clients && clients.size > 0) {
        const sessions = await storage.getBoardSessions(ws.boardId);
        clients.forEach(client => {
          if (client.readyState === WebSocket.OPEN) {
            client.send(JSON.stringify({ type: 'user_left', userId: ws.userId, activeSessions: sessions.length }));
          }
        });
      }
    }
    console.log('WebSocket client disconnected');
  });
});

// 📝 Board CRUD APIs
app.get('/api/boards', async (req, res) => {
  const boards = await storage.getBoardsByOwner(1);
  res.json(boards);
});

app.post('/api/boards', async (req, res) => {
  const boardData = req.body;
  const board = await storage.createBoard(boardData);
  res.json(board);
});

app.get('/api/boards/:id', async (req, res) => {
  const board = await storage.getBoard(+req.params.id);
  board ? res.json(board) : res.status(404).json({ message: 'Not found' });
});

// 🧠 AI Endpoints with Gemini Integration
app.post('/api/ai/analyze-handwriting', async (req, res) => {
  const { imageData, prompt } = req.body;
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) return res.status(500).json({ error: 'Missing Gemini API key' });

  const base64 = extractBase64Image(imageData);
  if (!base64) return res.status(400).json({ error: 'Invalid image data' });

  const result = await callGeminiAPI(apiKey, [
    { text: prompt || "Analyze handwriting and correct it" },
    { inlineData: { mimeType: "image/png", data: base64 } }
  ]);

  result ? res.json({ success: true, result }) : res.status(500).json({ error: 'No response from Gemini' });
});

app.post('/api/ai/improve-sketch', async (req, res) => {
  const { imageData, improvements } = req.body;
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) return res.status(500).json({ error: 'Missing Gemini API key' });

  const base64 = extractBase64Image(imageData);
  if (!base64) return res.status(400).json({ error: 'Invalid image data' });

  const result = await callGeminiAPI(apiKey, [
    { text: `Analyze this sketch and suggest improvements on ${improvements || "structure, proportions, and details"}` },
    { inlineData: { mimeType: "image/png", data: base64 } }
  ]);

  result ? res.json({ success: true, result }) : res.status(500).json({ error: 'No response from Gemini' });
});

// Utility: Extract Base64 from data URL
function extractBase64Image(dataUrl: string): string | null {
  const match = /^data:image\/(png|jpeg|jpg);base64,(.+)$/.exec(dataUrl);
  return match ? match[2] : null;
}

// Utility: Call Gemini API
async function callGeminiAPI(apiKey: string, parts: any[]) {
  try {
    const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-pro:generateContent?key=${apiKey}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ contents: [{ parts }] })
    });
    const data = await response.json();
    return data?.candidates?.[0]?.content?.parts?.[0]?.text || null;
  } catch (error) {
    console.error('Gemini API error:', error);
    return null;
  }
}

httpServer.listen(3000, () => console.log('Server listening on port 3000'));
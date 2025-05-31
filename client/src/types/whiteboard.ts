import type { DrawingEvent } from "@shared/schema";

export interface Tool {
  id: string;
  name: string;
  icon: string;
  cursor: string;
}

export interface Layer {
  id: string;
  name: string;
  visible: boolean;
  active: boolean;
  opacity: number;
}

export interface DrawingState {
  currentTool: string;
  brushSize: number;
  brushOpacity: number;
  currentColor: string;
  layers: Layer[];
  isDrawing: boolean;
  lastDrawPoint?: { x: number; y: number };
}

export interface CanvasState {
  zoom: number;
  panX: number;
  panY: number;
  showGrid: boolean;
  snapToGrid: boolean;
  showRulers: boolean;
}

export interface CollaborationState {
  activeSessions: number;
  isConnected: boolean;
  collaborators: Array<{
    userId: number;
    username: string;
    color: string;
  }>;
}

export interface WhiteboardState {
  drawing: DrawingState;
  canvas: CanvasState;
  collaboration: CollaborationState;
  history: DrawingEvent[];
  historyIndex: number;
}

export interface WebSocketMessage {
  type: 'join' | 'drawing' | 'user_joined' | 'user_left';
  boardId?: number;
  userId?: number;
  event?: DrawingEvent;
  activeSessions?: number;
}

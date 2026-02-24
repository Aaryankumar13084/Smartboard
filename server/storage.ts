import { users, boards, boardSessions, type User, type InsertUser, type Board, type InsertBoard, type BoardSession, type InsertBoardSession } from "@shared/schema";

export interface IStorage {
  // User methods
  getUser(id: number): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
  
  // Board methods
  getBoard(id: number): Promise<Board | undefined>;
  getBoardsByOwner(ownerId: number): Promise<Board[]>;
  createBoard(board: InsertBoard): Promise<Board>;
  updateBoard(id: number, data: Partial<Board>): Promise<Board | undefined>;
  deleteBoard(id: number): Promise<boolean>;
  
  // Board session methods
  createBoardSession(session: InsertBoardSession): Promise<BoardSession>;
  getBoardSessions(boardId: number): Promise<BoardSession[]>;
  updateBoardSession(id: number, data: Partial<BoardSession>): Promise<BoardSession | undefined>;
  deactivateBoardSession(boardId: number, userId: number): Promise<boolean>;
}

export class MemStorage implements IStorage {
  private users: Map<number, User>;
  private boards: Map<number, Board>;
  private boardSessions: Map<number, BoardSession>;
  private currentUserId: number;
  private currentBoardId: number;
  private currentSessionId: number;

  constructor() {
    this.users = new Map();
    this.boards = new Map();
    this.boardSessions = new Map();
    this.currentUserId = 1;
    this.currentBoardId = 1;
    this.currentSessionId = 1;
  }

  async getUser(id: number): Promise<User | undefined> {
    return this.users.get(id);
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    return Array.from(this.users.values()).find(
      (user) => user.username === username,
    );
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const id = this.currentUserId++;
    const user: User = { ...insertUser, id };
    this.users.set(id, user);
    return user;
  }

  async getBoard(id: number): Promise<Board | undefined> {
    return this.boards.get(id);
  }

  async getBoardsByOwner(ownerId: number): Promise<Board[]> {
    return Array.from(this.boards.values()).filter(
      (board) => board.ownerId === ownerId,
    );
  }

  async createBoard(insertBoard: InsertBoard): Promise<Board> {
    const id = this.currentBoardId++;
    const now = new Date();
    const board: Board = { 
      id,
      name: insertBoard.name,
      ownerId: insertBoard.ownerId ?? 0,
      data: insertBoard.data || {},
      isPublic: insertBoard.isPublic ?? false,
      createdAt: now,
      updatedAt: now
    };
    this.boards.set(id, board);
    return board;
  }

  async updateBoard(id: number, data: Partial<Board>): Promise<Board | undefined> {
    const board = this.boards.get(id);
    if (!board) return undefined;
    
    const updatedBoard: Board = { 
      ...board, 
      ...data, 
      updatedAt: new Date() 
    };
    this.boards.set(id, updatedBoard);
    return updatedBoard;
  }

  async deleteBoard(id: number): Promise<boolean> {
    return this.boards.delete(id);
  }

  async createBoardSession(insertSession: InsertBoardSession): Promise<BoardSession> {
    const id = this.currentSessionId++;
    const session: BoardSession = { 
      id,
      boardId: insertSession.boardId ?? 0,
      userId: insertSession.userId ?? 0,
      isActive: true,
      joinedAt: new Date()
    };
    this.boardSessions.set(id, session);
    return session;
  }

  async getBoardSessions(boardId: number): Promise<BoardSession[]> {
    return Array.from(this.boardSessions.values()).filter(
      (session) => session.boardId === boardId && session.isActive,
    );
  }

  async updateBoardSession(id: number, data: Partial<BoardSession>): Promise<BoardSession | undefined> {
    const session = this.boardSessions.get(id);
    if (!session) return undefined;
    
    const updatedSession: BoardSession = { ...session, ...data };
    this.boardSessions.set(id, updatedSession);
    return updatedSession;
  }

  async deactivateBoardSession(boardId: number, userId: number): Promise<boolean> {
    const sessions = Array.from(this.boardSessions.values()).filter(
      (session) => session.boardId === boardId && session.userId === userId && session.isActive,
    );
    
    sessions.forEach(session => {
      session.isActive = false;
      this.boardSessions.set(session.id, session);
    });
    
    return sessions.length > 0;
  }
}

export const storage = new MemStorage();

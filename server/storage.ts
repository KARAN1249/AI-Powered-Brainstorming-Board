import { 
  type User, 
  type InsertUser, 
  type Board, 
  type InsertBoard,
  type Idea,
  type InsertIdea,
  type Suggestion,
  type InsertSuggestion,
  type BoardShare,
  type InsertBoardShare,
  type IdeaMood,
  type InsertIdeaMood,
  type SharedItem,
  type InsertSharedItem,
  users,
  boards,
  ideas,
  suggestions,
  boardShares,
  ideaMoods,
  sharedItems
} from "@shared/schema";
import { db } from "./db";
import { eq, and, desc, or, like } from "drizzle-orm";
import bcrypt from "bcryptjs";

export interface IStorage {
  // User operations
  getUser(id: string): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
  validateUser(username: string, password: string): Promise<User | undefined>;
  
  // Board operations
  getBoardByUserId(userId: string): Promise<Board | undefined>;
  createBoard(userId: string, boardData?: InsertBoard): Promise<Board>;
  updateBoard(boardId: string, updates: Partial<InsertBoard>): Promise<Board>;
  
  // Idea operations
  getIdeasByBoardId(boardId: string): Promise<Idea[]>;
  createIdea(boardId: string, ideaData: InsertIdea): Promise<Idea>;
  updateIdea(ideaId: string, updates: Partial<InsertIdea>): Promise<Idea>;
  deleteIdea(ideaId: string): Promise<void>;
  moveIdea(ideaId: string, column: string, position: number): Promise<Idea>;
  
  // Suggestion operations
  getSuggestionsByBoardId(boardId: string): Promise<Suggestion[]>;
  createSuggestion(boardId: string, suggestionData: InsertSuggestion): Promise<Suggestion>;
  markSuggestionAsUsed(suggestionId: string): Promise<void>;
  
  // Board sharing operations
  getBoardShares(boardId: string): Promise<BoardShare[]>;
  createBoardShare(boardId: string, userId: string, role: string): Promise<BoardShare>;
  updateBoardShare(shareId: string, role: string): Promise<BoardShare>;
  deleteBoardShare(shareId: string): Promise<void>;
  getUserBoards(userId: string): Promise<Board[]>;
  checkBoardAccess(boardId: string, userId: string): Promise<{ hasAccess: boolean; role: string }>;

  // Shared items (inbox) operations
  createSharedItem(item: InsertSharedItem): Promise<SharedItem>;
  getInbox(userId: string): Promise<SharedItem[]>;
  acceptSharedItem(id: string): Promise<SharedItem>;
  dismissSharedItem(id: string): Promise<void>;
  
  // Mood analysis operations
  getIdeaMood(ideaId: string): Promise<IdeaMood | undefined>;
  createIdeaMood(ideaId: string, mood: string, confidence: number): Promise<IdeaMood>;
  updateIdeaMood(ideaId: string, mood: string, confidence: number): Promise<IdeaMood>;
  
  // Search operations
  searchIdeas(boardId: string, query: string): Promise<Idea[]>;
}

export class DatabaseStorage implements IStorage {
  // User operations
  async getUser(id: string): Promise<User | undefined> {
    const result = await db.select().from(users).where(eq(users.id, id)).limit(1);
    return result[0];
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    const result = await db.select().from(users).where(eq(users.username, username)).limit(1);
    return result[0];
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const hashedPassword = await bcrypt.hash(insertUser.password, 10);
    const result = await db.insert(users).values({
      ...insertUser,
      password: hashedPassword,
    }).returning();
    return result[0];
  }

  async validateUser(username: string, password: string): Promise<User | undefined> {
    const user = await this.getUserByUsername(username);
    if (!user) return undefined;
    
    const isValid = await bcrypt.compare(password, user.password);
    return isValid ? user : undefined;
  }

  // Board operations
  async getBoardByUserId(userId: string): Promise<Board | undefined> {
    const result = await db.select().from(boards).where(eq(boards.userId, userId)).limit(1);
    return result[0];
  }

  async createBoard(userId: string, boardData: InsertBoard = {}): Promise<Board> {
    const result = await db.insert(boards).values({
      ...boardData,
      userId,
    }).returning();
    return result[0];
  }

  async updateBoard(boardId: string, updates: Partial<InsertBoard>): Promise<Board> {
    const result = await db.update(boards)
      .set({ ...updates, updatedAt: new Date() })
      .where(eq(boards.id, boardId))
      .returning();
    return result[0];
  }

  // Idea operations
  async getIdeasByBoardId(boardId: string): Promise<Idea[]> {
    return await db.select().from(ideas)
      .where(eq(ideas.boardId, boardId))
      .orderBy(ideas.position, ideas.createdAt);
  }

  async createIdea(boardId: string, ideaData: InsertIdea): Promise<Idea> {
    const result = await db.insert(ideas).values({
      ...ideaData,
      boardId,
    }).returning();
    return result[0];
  }

  async updateIdea(ideaId: string, updates: Partial<InsertIdea>): Promise<Idea> {
    const result = await db.update(ideas)
      .set({ ...updates, updatedAt: new Date() })
      .where(eq(ideas.id, ideaId))
      .returning();
    return result[0];
  }

  async deleteIdea(ideaId: string): Promise<void> {
    await db.delete(ideas).where(eq(ideas.id, ideaId));
  }

  async moveIdea(ideaId: string, column: string, position: number): Promise<Idea> {
    const result = await db.update(ideas)
      .set({ 
        column, 
        position, 
        updatedAt: new Date() 
      })
      .where(eq(ideas.id, ideaId))
      .returning();
    return result[0];
  }

  // Suggestion operations
  async getSuggestionsByBoardId(boardId: string): Promise<Suggestion[]> {
    return await db.select().from(suggestions)
      .where(and(
        eq(suggestions.boardId, boardId),
        eq(suggestions.isUsed, "false")
      ))
      .orderBy(desc(suggestions.createdAt));
  }

  async createSuggestion(boardId: string, suggestionData: InsertSuggestion): Promise<Suggestion> {
    const result = await db.insert(suggestions).values({
      ...suggestionData,
      boardId,
    }).returning();
    return result[0];
  }

  async markSuggestionAsUsed(suggestionId: string): Promise<void> {
    await db.update(suggestions)
      .set({ isUsed: "true" })
      .where(eq(suggestions.id, suggestionId));
  }

  // Board sharing operations
  async getBoardShares(boardId: string): Promise<BoardShare[]> {
    return await db.select().from(boardShares)
      .where(eq(boardShares.boardId, boardId))
      .orderBy(desc(boardShares.createdAt));
  }

  async createBoardShare(boardId: string, userId: string, role: string): Promise<BoardShare> {
    const result = await db.insert(boardShares).values({
      boardId,
      userId,
      role,
    }).returning();
    return result[0];
  }

  async updateBoardShare(shareId: string, role: string): Promise<BoardShare> {
    const result = await db.update(boardShares)
      .set({ role })
      .where(eq(boardShares.id, shareId))
      .returning();
    return result[0];
  }

  async deleteBoardShare(shareId: string): Promise<void> {
    await db.delete(boardShares).where(eq(boardShares.id, shareId));
  }

  // Shared items (inbox) operations
  async createSharedItem(item: InsertSharedItem): Promise<SharedItem> {
    const result = await db.insert(sharedItems).values(item).returning();
    return result[0];
  }

  async getInbox(userId: string): Promise<SharedItem[]> {
    return await db.select().from(sharedItems)
      .where(and(eq(sharedItems.recipientUserId, userId), eq(sharedItems.status, "pending")))
      .orderBy(desc(sharedItems.createdAt));
  }

  async acceptSharedItem(id: string): Promise<SharedItem> {
    const result = await db.update(sharedItems)
      .set({ status: "accepted" })
      .where(eq(sharedItems.id, id))
      .returning();
    return result[0];
  }

  async dismissSharedItem(id: string): Promise<void> {
    await db.update(sharedItems)
      .set({ status: "dismissed" })
      .where(eq(sharedItems.id, id));
  }

  async getUserBoards(userId: string): Promise<Board[]> {
    // Get boards where user is owner or has been shared
    const ownedBoards = await db.select().from(boards).where(eq(boards.userId, userId));
    const sharedBoards = await db.select({ board: boards })
      .from(boardShares)
      .innerJoin(boards, eq(boardShares.boardId, boards.id))
      .where(eq(boardShares.userId, userId));
    
    const allBoards = [...ownedBoards, ...sharedBoards.map(s => s.board)];
    // Remove duplicates
    const uniqueBoards = allBoards.filter((board, index, self) => 
      index === self.findIndex(b => b.id === board.id)
    );
    return uniqueBoards;
  }

  async checkBoardAccess(boardId: string, userId: string): Promise<{ hasAccess: boolean; role: string }> {
    // Check if user owns the board
    const board = await db.select().from(boards).where(eq(boards.id, boardId)).limit(1);
    if (board[0] && board[0].userId === userId) {
      return { hasAccess: true, role: "owner" };
    }

    // Check if user has been shared the board
    const share = await db.select().from(boardShares)
      .where(and(eq(boardShares.boardId, boardId), eq(boardShares.userId, userId)))
      .limit(1);
    
    if (share[0]) {
      return { hasAccess: true, role: share[0].role };
    }

    return { hasAccess: false, role: "" };
  }

  // Mood analysis operations
  async getIdeaMood(ideaId: string): Promise<IdeaMood | undefined> {
    const result = await db.select().from(ideaMoods)
      .where(eq(ideaMoods.ideaId, ideaId))
      .orderBy(desc(ideaMoods.createdAt))
      .limit(1);
    return result[0];
  }

  async createIdeaMood(ideaId: string, mood: string, confidence: number): Promise<IdeaMood> {
    const result = await db.insert(ideaMoods).values({
      ideaId,
      mood,
      confidence,
    }).returning();
    return result[0];
  }

  async updateIdeaMood(ideaId: string, mood: string, confidence: number): Promise<IdeaMood> {
    // First check if mood exists
    const existingMood = await this.getIdeaMood(ideaId);
    if (existingMood) {
      const result = await db.update(ideaMoods)
        .set({ mood, confidence, createdAt: new Date() })
        .where(eq(ideaMoods.id, existingMood.id))
        .returning();
      return result[0];
    } else {
      return await this.createIdeaMood(ideaId, mood, confidence);
    }
  }

  // Search operations
  async searchIdeas(boardId: string, query: string): Promise<Idea[]> {
    // Simple text search in title and content
    const searchTerm = `%${query}%`;
    return await db.select().from(ideas)
      .where(and(
        eq(ideas.boardId, boardId),
        or(
          like(ideas.title, searchTerm),
          like(ideas.content, searchTerm)
        )
      ))
      .orderBy(ideas.position, ideas.createdAt);
  }
}

export const storage = new DatabaseStorage();

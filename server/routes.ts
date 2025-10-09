import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { insertUserSchema, insertIdeaSchema, insertSuggestionSchema, insertBoardShareSchema, insertIdeaMoodSchema } from "@shared/schema";
import OpenAI from "openai";

export async function registerRoutes(app: Express): Promise<Server> {
  // Initialize OpenAI only if API key is provided
  const openai = process.env.OPENAI_API_KEY ? new OpenAI({
    apiKey: process.env.OPENAI_API_KEY,
  }) : null;

  // Authentication middleware
  const authenticateUser = async (req: any, res: any, next: any) => {
    const userId = req.session?.userId;
    if (!userId) {
      return res.status(401).json({ message: "Unauthorized" });
    }
    req.userId = userId;
    next();
  };

  // Auth routes
  app.post("/api/auth/register", async (req, res) => {
    try {
      const validatedData = insertUserSchema.parse(req.body);
      const existingUser = await storage.getUserByUsername(validatedData.username);
      
      if (existingUser) {
        return res.status(400).json({ message: "Username already exists" });
      }

      const user = await storage.createUser(validatedData);
      req.session.userId = user.id;
      res.json({ user: { id: user.id, username: user.username } });
    } catch (error) {
      res.status(400).json({ message: "Invalid data" });
    }
  });

  app.post("/api/auth/login", async (req, res) => {
    try {
      const { username, password } = req.body;
      const user = await storage.validateUser(username, password);
      
      if (!user) {
        return res.status(401).json({ message: "Invalid credentials" });
      }

      req.session.userId = user.id;
      res.json({ user: { id: user.id, username: user.username } });
    } catch (error) {
      res.status(400).json({ message: "Invalid data" });
    }
  });

  app.post("/api/auth/logout", (req, res) => {
    req.session.destroy((err: any) => {
      if (err) {
        return res.status(500).json({ message: "Could not log out" });
      }
      res.json({ message: "Logged out successfully" });
    });
  });

  app.get("/api/auth/me", authenticateUser, async (req, res) => {
    try {
      const user = await storage.getUser(req.userId!);
      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }
      res.json({ user: { id: user.id, username: user.username } });
    } catch (error) {
      res.status(500).json({ message: "Internal server error" });
    }
  });

  // Board routes
  app.get("/api/board", authenticateUser, async (req, res) => {
    try {
      let board = await storage.getBoardByUserId(req.userId!);

      // If the user doesn't own a board, try to return the first accessible one (shared or owned)
      if (!board) {
        const accessibleBoards = await storage.getUserBoards(req.userId!);
        if (accessibleBoards && accessibleBoards.length > 0) {
          board = accessibleBoards[0];
        } else {
          board = await storage.createBoard(req.userId!);
        }
      }

      const boardIdeas = await storage.getIdeasByBoardId(board.id);
      const boardSuggestions = await storage.getSuggestionsByBoardId(board.id);

      res.json({
        board,
        ideas: boardIdeas,
        suggestions: boardSuggestions
      });
    } catch (error) {
      res.status(500).json({ message: "Internal server error" });
    }
  });

  // Idea routes
  app.post("/api/ideas", authenticateUser, async (req, res) => {
    try {
      const validatedData = insertIdeaSchema.parse(req.body);
      const board = await storage.getBoardByUserId(req.userId!);
      
      if (!board) {
        return res.status(404).json({ message: "Board not found" });
      }

      const idea = await storage.createIdea(board.id, validatedData);
      res.json(idea);
    } catch (error) {
      res.status(400).json({ message: "Invalid data" });
    }
  });

  app.put("/api/ideas/:id", authenticateUser, async (req, res) => {
    try {
      const { id } = req.params;
      const updates = req.body;
      
      const idea = await storage.updateIdea(id, updates);
      res.json(idea);
    } catch (error) {
      res.status(400).json({ message: "Invalid data" });
    }
  });

  app.delete("/api/ideas/:id", authenticateUser, async (req, res) => {
    try {
      const { id } = req.params;
      await storage.deleteIdea(id);
      res.json({ message: "Idea deleted successfully" });
    } catch (error) {
      res.status(500).json({ message: "Internal server error" });
    }
  });

  app.put("/api/ideas/:id/move", authenticateUser, async (req, res) => {
    try {
      const { id } = req.params;
      const { column, position } = req.body;
      
      const idea = await storage.moveIdea(id, column, position);
      res.json(idea);
    } catch (error) {
      res.status(400).json({ message: "Invalid data" });
    }
  });

  // Suggestion routes
  app.post("/api/suggestions", authenticateUser, async (req, res) => {
    try {
      const validatedData = insertSuggestionSchema.parse(req.body);
      const board = await storage.getBoardByUserId(req.userId!);
      
      if (!board) {
        return res.status(404).json({ message: "Board not found" });
      }

      const suggestion = await storage.createSuggestion(board.id, validatedData);
      res.json(suggestion);
    } catch (error) {
      res.status(400).json({ message: "Invalid data" });
    }
  });

  app.put("/api/suggestions/:id/use", authenticateUser, async (req, res) => {
    try {
      const { id } = req.params;
      await storage.markSuggestionAsUsed(id);
      res.json({ message: "Suggestion marked as used" });
    } catch (error) {
      res.status(500).json({ message: "Internal server error" });
    }
  });

  // AI-powered suggestion generation
  app.post("/api/ai/suggestions", authenticateUser, async (req, res) => {
    try {
      const { idea } = req.body;
      const board = await storage.getBoardByUserId(req.userId!);
      
      if (!board) {
        return res.status(404).json({ message: "Board not found" });
      }

      if (!openai) {
        // Fallback to mock suggestions if no API key
        const mockSuggestions = [
          "Consider adding analytics to track user engagement",
          "Implement export functionality for data backup",
          "Add mobile responsiveness for better UX",
          "Integrate real-time collaboration features",
          "Create automated testing workflows",
        ];
        const suggestions = mockSuggestions.slice(0, 3).map(text => ({ text }));
        return res.json({ suggestions });
      }

      const completion = await openai.chat.completions.create({
        model: "gpt-3.5-turbo",
        messages: [
          {
            role: "system",
            content: "You are a creative brainstorming assistant. Generate 3 related, actionable ideas based on the given idea. Each suggestion should be concise (1-2 sentences) and build upon or complement the original idea."
          },
          {
            role: "user",
            content: `Based on this idea: "${idea}", suggest 3 related ideas that could enhance or complement it.`
          }
        ],
        max_tokens: 300,
        temperature: 0.8,
      });

      const suggestions = completion.choices[0]?.message?.content
        ?.split('\n')
        .filter(line => line.trim() && !line.match(/^\d+\./))
        .map(text => ({ text: text.replace(/^[-•]\s*/, '').trim() }))
        .slice(0, 3) || [];

      res.json({ suggestions });
    } catch (error) {
      console.error("AI suggestion error:", error);
      // Fallback to mock suggestions
      const mockSuggestions = [
        "Consider adding analytics to track user engagement",
        "Implement export functionality for data backup",
        "Add mobile responsiveness for better UX",
      ];
      const suggestions = mockSuggestions.map(text => ({ text }));
      res.json({ suggestions });
    }
  });

  // AI-powered clustering
  app.post("/api/ai/cluster", authenticateUser, async (req, res) => {
    try {
      const board = await storage.getBoardByUserId(req.userId!);
      
      if (!board) {
        return res.status(404).json({ message: "Board not found" });
      }

      const boardIdeas = await storage.getIdeasByBoardId(board.id);
      
      if (boardIdeas.length === 0) {
        return res.json({ message: "No ideas to cluster" });
      }

      if (!openai) {
        // Fallback to simple clustering
        const clusters = [
          { id: 1, name: "Product", color: "hsl(340, 75%, 60%)" },
          { id: 2, name: "Technical", color: "hsl(195, 85%, 55%)" },
          { id: 3, name: "Design", color: "hsl(280, 70%, 60%)" },
        ];
        
        const clusteredIdeas = boardIdeas.map((idea, index) => ({
          ...idea,
          clusterId: clusters[index % clusters.length].id,
          clusterName: clusters[index % clusters.length].name,
          clusterColor: clusters[index % clusters.length].color,
        }));

        // Update ideas in database
        for (const idea of clusteredIdeas) {
          await storage.updateIdea(idea.id, {
            clusterId: idea.clusterId,
            clusterName: idea.clusterName,
            clusterColor: idea.clusterColor,
          });
        }

        return res.json({ ideas: clusteredIdeas });
      }

      const ideasText = boardIdeas.map(idea => `"${idea.title}": ${idea.content}`).join('\n');
      
      const completion = await openai.chat.completions.create({
        model: "gpt-3.5-turbo",
        messages: [
          {
            role: "system",
            content: "You are an expert at organizing and categorizing ideas. Analyze the given ideas and group them into 3-5 thematic clusters. Return a JSON object with cluster names and the ideas that belong to each cluster."
          },
          {
            role: "user",
            content: `Organize these ideas into thematic clusters:\n\n${ideasText}\n\nReturn JSON in this format: {"clusters": [{"name": "Cluster Name", "ideas": ["idea title 1", "idea title 2"]}]}`
          }
        ],
        max_tokens: 500,
        temperature: 0.3,
      });

      const response = completion.choices[0]?.message?.content;
      if (!response) {
        throw new Error("No response from AI");
      }

      const parsedResponse = JSON.parse(response);
      const clusters = [
        { id: 1, name: "Product", color: "hsl(340, 75%, 60%)" },
        { id: 2, name: "Technical", color: "hsl(195, 85%, 55%)" },
        { id: 3, name: "Design", color: "hsl(280, 70%, 60%)" },
        { id: 4, name: "Marketing", color: "hsl(150, 60%, 50%)" },
        { id: 5, name: "Research", color: "hsl(35, 90%, 60%)" },
      ];

      const clusteredIdeas = [];
      for (let i = 0; i < parsedResponse.clusters.length; i++) {
        const cluster = parsedResponse.clusters[i];
        const clusterInfo = clusters[i % clusters.length];
        
        for (const ideaTitle of cluster.ideas) {
          const idea = boardIdeas.find(idea => idea.title === ideaTitle);
          if (idea) {
            const updatedIdea = {
              ...idea,
              clusterId: clusterInfo.id,
              clusterName: cluster.name,
              clusterColor: clusterInfo.color,
            };
            await storage.updateIdea(idea.id, {
              clusterId: clusterInfo.id,
              clusterName: cluster.name,
              clusterColor: clusterInfo.color,
            });
            clusteredIdeas.push(updatedIdea);
          }
        }
      }

      res.json({ ideas: clusteredIdeas });
    } catch (error) {
      console.error("AI clustering error:", error);
      res.status(500).json({ message: "Failed to cluster ideas" });
    }
  });

  // AI-powered board summarization
  app.post("/api/ai/summarize", authenticateUser, async (req, res) => {
    try {
      const board = await storage.getBoardByUserId(req.userId!);
      
      if (!board) {
        return res.status(404).json({ message: "Board not found" });
      }

      const boardIdeas = await storage.getIdeasByBoardId(board.id);
      
      if (boardIdeas.length === 0) {
        return res.json({ summary: "No ideas to summarize yet. Start adding ideas to your board!" });
      }

      if (!openai) {
        // Fallback to mock summary
        const themes = ["Innovation & Growth", "Technology & Automation", "User Engagement & Design"];
        const topIdeas = boardIdeas.slice(0, 3).map(idea => idea.title);
        
        const mockSummary = `**Key Themes:**
• ${themes[0]} (${Math.floor(boardIdeas.length / 3)} ideas)
• ${themes[1]} (${Math.floor(boardIdeas.length / 3)} ideas)
• ${themes[2]} (${Math.floor(boardIdeas.length / 3)} ideas)

**Top Ideas:**
${topIdeas.map((idea, i) => `${i + 1}. ${idea}`).join('\n')}

**Next Steps:**
- Implement advanced AI features and machine learning capabilities
- Enhance user interface with modern design patterns
- Build robust backend infrastructure for scalability`;

        return res.json({ summary: mockSummary });
      }

      const ideasText = boardIdeas.map(idea => `"${idea.title}": ${idea.content}`).join('\n');
      
      const completion = await openai.chat.completions.create({
        model: "gpt-3.5-turbo",
        messages: [
          {
            role: "system",
            content: "You are an expert project manager and strategist. Analyze the given ideas and create a comprehensive board summary with key themes, top ideas, and actionable next steps. Format the response in markdown with clear sections."
          },
          {
            role: "user",
            content: `Analyze these ideas and create a board summary:\n\n${ideasText}\n\nProvide:\n1. Key themes (group related ideas)\n2. Top 3-5 most important ideas\n3. Next steps and recommendations\n\nFormat as markdown with **bold** headers.`
          }
        ],
        max_tokens: 600,
        temperature: 0.4,
      });

      const summary = completion.choices[0]?.message?.content || "Unable to generate summary";
      res.json({ summary });
    } catch (error) {
      console.error("AI summarization error:", error);
      res.status(500).json({ message: "Failed to generate summary" });
    }
  });

  // Board sharing routes
  app.get("/api/boards", authenticateUser, async (req, res) => {
    try {
      const boards = await storage.getUserBoards(req.userId!);
      res.json({ boards });
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch boards" });
    }
  });

  app.get("/api/boards/:id/shares", authenticateUser, async (req, res) => {
    try {
      const { id } = req.params;
      const access = await storage.checkBoardAccess(id, req.userId!);
      
      if (!access.hasAccess || access.role === "viewer") {
        return res.status(403).json({ message: "Insufficient permissions" });
      }

      const shares = await storage.getBoardShares(id);
      res.json({ shares });
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch board shares" });
    }
  });

  app.post("/api/boards/:id/share", authenticateUser, async (req, res) => {
    try {
      const { id } = req.params;
      const { username, role } = req.body;
      
      const access = await storage.checkBoardAccess(id, req.userId!);
      if (!access.hasAccess || access.role === "viewer") {
        return res.status(403).json({ message: "Insufficient permissions" });
      }

      const user = await storage.getUserByUsername(username);
      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }

      const share = await storage.createBoardShare(id, user.id, role);
      res.json({ share });
    } catch (error) {
      res.status(500).json({ message: "Failed to share board" });
    }
  });

  app.put("/api/shares/:id", authenticateUser, async (req, res) => {
    try {
      const { id } = req.params;
      const { role } = req.body;
      
      const share = await storage.updateBoardShare(id, role);
      res.json({ share });
    } catch (error) {
      res.status(500).json({ message: "Failed to update share" });
    }
  });

  app.delete("/api/shares/:id", authenticateUser, async (req, res) => {
    try {
      const { id } = req.params;
      await storage.deleteBoardShare(id);
      res.json({ message: "Share removed successfully" });
    } catch (error) {
      res.status(500).json({ message: "Failed to remove share" });
    }
  });

  // Shared items (inbox) routes
  app.post("/api/share-item", authenticateUser, async (req, res) => {
    try {
      const { recipientUsername, sourceBoardId, title, content } = req.body as {
        recipientUsername: string;
        sourceBoardId: string;
        title: string;
        content: string;
      };

      if (!recipientUsername || !sourceBoardId || !title || !content) {
        return res.status(400).json({ message: "Missing fields" });
      }

      // Verify sender has at least editor access to the source board
      const access = await storage.checkBoardAccess(sourceBoardId, req.userId!);
      if (!access.hasAccess || access.role === "viewer") {
        return res.status(403).json({ message: "Insufficient permissions" });
      }

      const recipient = await storage.getUserByUsername(recipientUsername);
      if (!recipient) {
        return res.status(404).json({ message: "Recipient not found" });
      }

      const shared = await storage.createSharedItem({
        senderUserId: req.userId!,
        recipientUserId: recipient.id,
        sourceBoardId,
        title,
        content,
        status: "pending",
      });

      res.json({ sharedItem: shared });
    } catch (error) {
      res.status(500).json({ message: "Failed to share item" });
    }
  });

  app.get("/api/inbox", authenticateUser, async (req, res) => {
    try {
      const items = await storage.getInbox(req.userId!);
      res.json({ items });
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch inbox" });
    }
  });

  app.post("/api/inbox/:id/accept", authenticateUser, async (req, res) => {
    try {
      const { id } = req.params;
      // Mark accepted
      const item = await storage.acceptSharedItem(id);

      // Create or load recipient board and create idea
      let recipientBoard = await storage.getBoardByUserId(req.userId!);
      if (!recipientBoard) {
        recipientBoard = await storage.createBoard(req.userId!);
      }
      const idea = await storage.createIdea(recipientBoard.id, {
        title: item.title,
        content: item.content,
        column: "ideas",
      });

      res.json({ item, idea });
    } catch (error) {
      res.status(500).json({ message: "Failed to accept item" });
    }
  });

  app.post("/api/inbox/:id/dismiss", authenticateUser, async (req, res) => {
    try {
      const { id } = req.params;
      await storage.dismissSharedItem(id);
      res.json({ message: "Dismissed" });
    } catch (error) {
      res.status(500).json({ message: "Failed to dismiss item" });
    }
  });

  // Mood analysis routes
  app.post("/api/ideas/:id/mood", authenticateUser, async (req, res) => {
    try {
      const { id } = req.params;
      const { mood, confidence } = req.body;
      
      const ideaMood = await storage.updateIdeaMood(id, mood, confidence);
      res.json({ mood: ideaMood });
    } catch (error) {
      res.status(500).json({ message: "Failed to analyze mood" });
    }
  });

  app.get("/api/ideas/:id/mood", authenticateUser, async (req, res) => {
    try {
      const { id } = req.params;
      const mood = await storage.getIdeaMood(id);
      res.json({ mood });
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch mood" });
    }
  });

  // AI-powered mood analysis
  app.post("/api/ai/mood-analysis", authenticateUser, async (req, res) => {
    try {
      const { ideaId, title, content } = req.body;
      
      if (!openai) {
        // Fallback to mock mood analysis
        const moods = ["positive", "neutral", "negative"];
        const randomMood = moods[Math.floor(Math.random() * moods.length)];
        const confidence = Math.floor(Math.random() * 40) + 60; // 60-100%
        
        const mood = await storage.updateIdeaMood(ideaId, randomMood, confidence);
        return res.json({ mood });
      }

      const completion = await openai.chat.completions.create({
        model: "gpt-3.5-turbo",
        messages: [
          {
            role: "system",
            content: "You are an expert sentiment analyzer. Analyze the given text and determine if it expresses positive, neutral, or negative sentiment. Respond with JSON containing 'mood' (positive/neutral/negative) and 'confidence' (0-100)."
          },
          {
            role: "user",
            content: `Analyze the sentiment of this idea:\n\nTitle: ${title}\nContent: ${content}\n\nRespond with JSON: {"mood": "positive|neutral|negative", "confidence": 0-100}`
          }
        ],
        max_tokens: 100,
        temperature: 0.1,
      });

      const response = completion.choices[0]?.message?.content;
      const analysis = JSON.parse(response || '{"mood": "neutral", "confidence": 50}');
      
      const mood = await storage.updateIdeaMood(ideaId, analysis.mood, analysis.confidence);
      res.json({ mood });
    } catch (error) {
      console.error("AI mood analysis error:", error);
      res.status(500).json({ message: "Failed to analyze mood" });
    }
  });

  // Search routes
  app.get("/api/boards/:id/search", authenticateUser, async (req, res) => {
    try {
      const { id } = req.params;
      const { q } = req.query;
      
      const access = await storage.checkBoardAccess(id, req.userId!);
      if (!access.hasAccess) {
        return res.status(403).json({ message: "Access denied" });
      }

      if (!q || typeof q !== 'string') {
        return res.status(400).json({ message: "Search query required" });
      }

      const ideas = await storage.searchIdeas(id, q);
      res.json({ ideas });
    } catch (error) {
      res.status(500).json({ message: "Search failed" });
    }
  });

  // Export routes
  app.get("/api/boards/:id/export/markdown", authenticateUser, async (req, res) => {
    try {
      const { id } = req.params;
      const access = await storage.checkBoardAccess(id, req.userId!);
      if (!access.hasAccess) {
        return res.status(403).json({ message: "Access denied" });
      }

      const board = await storage.getBoardByUserId(req.userId!);
      if (!board || board.id !== id) {
        return res.status(404).json({ message: "Board not found" });
      }

      const ideas = await storage.getIdeasByBoardId(id);
      
      let markdown = `# ${board.name}\n\n`;
      markdown += `Generated on: ${new Date().toLocaleDateString()}\n\n`;
      
      const columns = ["ideas", "in-progress", "completed"];
      const columnTitles = ["Ideas", "In Progress", "Completed"];
      
      columns.forEach((column, index) => {
        const columnIdeas = ideas.filter(idea => idea.column === column);
        markdown += `## ${columnTitles[index]} (${columnIdeas.length})\n\n`;
        
        columnIdeas.forEach(idea => {
          markdown += `### ${idea.title}\n`;
          markdown += `${idea.content}\n\n`;
        });
      });

      res.setHeader('Content-Type', 'text/markdown');
      res.setHeader('Content-Disposition', `attachment; filename="${board.name}-export.md"`);
      res.send(markdown);
    } catch (error) {
      res.status(500).json({ message: "Export failed" });
    }
  });

  app.get("/api/boards/:id/export/pdf", authenticateUser, async (req, res) => {
    try {
      const { id } = req.params;
      const access = await storage.checkBoardAccess(id, req.userId!);
      if (!access.hasAccess) {
        return res.status(403).json({ message: "Access denied" });
      }

      const board = await storage.getBoardByUserId(req.userId!);
      if (!board || board.id !== id) {
        return res.status(404).json({ message: "Board not found" });
      }

      const ideas = await storage.getIdeasByBoardId(id);
      
      // Generate AI summary for PDF
      let aiSummary = "";
      if (ideas.length > 0) {
        if (openai) {
          const ideasText = ideas.map(idea => `"${idea.title}": ${idea.content}`).join('\n');
          const completion = await openai.chat.completions.create({
            model: "gpt-3.5-turbo",
            messages: [
              {
                role: "system",
                content: "You are an expert project manager. Create a concise executive summary of the brainstorming session."
              },
              {
                role: "user",
                content: `Create an executive summary for this brainstorming session:\n\n${ideasText}`
              }
            ],
            max_tokens: 300,
            temperature: 0.3,
          });
          aiSummary = completion.choices[0]?.message?.content || "";
        } else {
          aiSummary = "AI-powered summary generation requires OpenAI API key.";
        }
      }

      // For now, return JSON with PDF-ready data
      // In production, you'd use a library like puppeteer or jsPDF
      const pdfData = {
        title: board.name,
        date: new Date().toLocaleDateString(),
        summary: aiSummary,
        ideas: ideas.map(idea => ({
          title: idea.title,
          content: idea.content,
          column: idea.column,
          cluster: idea.clusterName
        }))
      };

      res.json({ pdfData, message: "PDF generation would be implemented with a PDF library" });
    } catch (error) {
      res.status(500).json({ message: "PDF export failed" });
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}

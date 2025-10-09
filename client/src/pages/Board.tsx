import { useState, useEffect } from "react";
import { LeftToolbar } from "@/components/LeftToolbar";
import { RightPanel, type Suggestion } from "@/components/RightPanel";
import { BoardColumn } from "@/components/BoardColumn";
import { IdeaCard } from "@/components/IdeaCard";
import { ThemeToggle } from "@/components/ThemeToggle";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { LogOut, Share2, Download, Search, Brain, Users, Inbox } from "lucide-react";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";

interface Idea {
  id: string;
  title: string;
  content: string;
  column: "ideas" | "in-progress" | "completed";
  clusterId?: number;
  clusterName?: string;
  clusterColor?: string;
  position?: number;
  createdAt?: string;
  updatedAt?: string;
  mood?: {
    mood: "positive" | "neutral" | "negative";
    confidence: number;
  };
}

interface BoardProps {
  user: {
    id: string;
    username: string;
  };
  onLogout: () => void;
}

const CLUSTER_COLORS = [
  { id: 1, name: "Product", color: "hsl(340, 75%, 60%)" },
  { id: 2, name: "Technical", color: "hsl(195, 85%, 55%)" },
  { id: 3, name: "Design", color: "hsl(280, 70%, 60%)" },
  { id: 4, name: "Marketing", color: "hsl(150, 60%, 50%)" },
  { id: 5, name: "Research", color: "hsl(35, 90%, 60%)" },
];

export default function Board({ user, onLogout }: BoardProps) {
  const { toast } = useToast();
  const [ideas, setIdeas] = useState<Idea[]>([]);
  const [suggestions, setSuggestions] = useState<Suggestion[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const [summary, setSummary] = useState<string>("");
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingIdea, setEditingIdea] = useState<Idea | null>(null);
  const [formData, setFormData] = useState({ title: "", content: "" });
  const [isProcessing, setIsProcessing] = useState(false);
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [searchResults, setSearchResults] = useState<Idea[]>([]);
  const [isShareDialogOpen, setIsShareDialogOpen] = useState(false);
  const [shareFormData, setShareFormData] = useState({ username: "", role: "viewer" });
  const [boardId, setBoardId] = useState<string>("");
  const [inboxItem, setInboxItem] = useState<{ id: string; title: string; content: string } | null>(null);
  const [isInboxDialogOpen, setIsInboxDialogOpen] = useState(false);
  const [isInboxOpen, setIsInboxOpen] = useState(false);
  const [inboxItems, setInboxItems] = useState<Array<{ id: string; title: string; content: string; createdAt?: string }>>([]);

  // Load board data on component mount
  useEffect(() => {
    const loadBoardData = async () => {
      try {
        const response = await fetch("/api/board", {
          credentials: "include",
        });
        
        if (response.ok) {
          const data = await response.json();
          console.log("Board data loaded:", data);
          setIdeas(data.ideas || []);
          setSuggestions(data.suggestions || []);
          setBoardId(data.board?.id || "");
          console.log("Board ID set to:", data.board?.id);
        } else {
          toast({
            title: "Error",
            description: "Failed to load board data",
            variant: "destructive",
          });
        }
      } catch (error) {
        toast({
          title: "Error",
          description: "Failed to connect to server",
          variant: "destructive",
        });
      } finally {
        setIsLoading(false);
      }
    };

    loadBoardData();
  }, [toast]);

  // Poll inbox for incoming shared items
  useEffect(() => {
    let isMounted = true;
    const poll = async () => {
      try {
        const response = await fetch("/api/inbox", { credentials: "include" });
        if (response.ok) {
          const data = await response.json();
          if (isMounted && Array.isArray(data.items)) {
            setInboxItems(data.items);
            const first = data.items.length > 0 ? data.items[0] : null;
            if (first && !isInboxOpen) {
              setInboxItem({ id: first.id, title: first.title, content: first.content });
              setIsInboxDialogOpen(true);
            }
          }
        }
      } catch (_e) {
        // ignore polling errors
      }
    };
    const interval = setInterval(poll, 5000);
    // Do an immediate check on mount
    poll();
    return () => {
      isMounted = false;
      clearInterval(interval);
    };
  }, []);

  const handleAddCard = () => {
    setEditingIdea(null);
    setFormData({ title: "", content: "" });
    setIsDialogOpen(true);
  };

  const handleEditCard = (id: string) => {
    const idea = ideas.find((i) => i.id === id);
    if (idea) {
      setEditingIdea(idea);
      setFormData({ title: idea.title, content: idea.content });
      setIsDialogOpen(true);
    }
  };

  const handleDeleteCard = async (id: string) => {
    try {
      const response = await fetch(`/api/ideas/${id}`, {
        method: "DELETE",
        credentials: "include",
      });

      if (response.ok) {
        setIdeas(ideas.filter((i) => i.id !== id));
        toast({
          title: "Card deleted",
          description: "The idea card has been removed from the board.",
        });
      } else {
        toast({
          title: "Error",
          description: "Failed to delete card",
          variant: "destructive",
        });
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to connect to server",
        variant: "destructive",
      });
    }
  };

  const handleSaveCard = async () => {
    if (!formData.title.trim()) {
      toast({
        title: "Title required",
        description: "Please enter a title for your idea.",
        variant: "destructive",
      });
      return;
    }

    try {
      if (editingIdea) {
        const response = await fetch(`/api/ideas/${editingIdea.id}`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          credentials: "include",
          body: JSON.stringify({
            title: formData.title,
            content: formData.content,
          }),
        });

        if (response.ok) {
          const updatedIdea = await response.json();
          setIdeas(ideas.map((i) => (i.id === editingIdea.id ? updatedIdea : i)));
          toast({
            title: "Card updated",
            description: "Your idea has been successfully updated.",
          });
        } else {
          toast({
            title: "Error",
            description: "Failed to update card",
            variant: "destructive",
          });
        }
      } else {
        const response = await fetch("/api/ideas", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          credentials: "include",
          body: JSON.stringify({
            title: formData.title,
            content: formData.content,
            column: "ideas",
          }),
        });

        if (response.ok) {
          const newIdea = await response.json();
          setIdeas([...ideas, newIdea]);
          
          // Generate AI suggestions
          const aiResponse = await fetch("/api/ai/suggestions", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            credentials: "include",
            body: JSON.stringify({ idea: `${formData.title}: ${formData.content}` }),
          });

          if (aiResponse.ok) {
            const aiData = await aiResponse.json();
            const aiSuggestions = aiData.suggestions || [];
            
            // Add each suggestion to database
            for (const suggestion of aiSuggestions) {
              const suggestionResponse = await fetch("/api/suggestions", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                credentials: "include",
                body: JSON.stringify({ text: suggestion.text }),
              });

              if (suggestionResponse.ok) {
                const newSuggestion = await suggestionResponse.json();
                setSuggestions(prev => [newSuggestion, ...prev]);
              }
            }
          }
          
          toast({
            title: "Card added",
            description: "Your idea has been added to the board with AI suggestions!",
          });
        } else {
          toast({
            title: "Error",
            description: "Failed to create card",
            variant: "destructive",
          });
        }
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to connect to server",
        variant: "destructive",
      });
    }

    setIsDialogOpen(false);
    setFormData({ title: "", content: "" });
  };

  const handleMoveCard = async (id: string, direction: "left" | "right") => {
    const idea = ideas.find((i) => i.id === id);
    if (!idea) return;

    const columns: Array<"ideas" | "in-progress" | "completed"> = [
      "ideas",
      "in-progress",
      "completed",
    ];
    const currentIndex = columns.indexOf(idea.column);
    const newIndex =
      direction === "left"
        ? Math.max(0, currentIndex - 1)
        : Math.min(columns.length - 1, currentIndex + 1);

    if (newIndex !== currentIndex) {
      try {
        const response = await fetch(`/api/ideas/${id}/move`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          credentials: "include",
          body: JSON.stringify({
            column: columns[newIndex],
            position: 0,
          }),
        });

        if (response.ok) {
          const updatedIdea = await response.json();
          setIdeas(ideas.map((i) => (i.id === id ? updatedIdea : i)));
          toast({
            title: "Card moved",
            description: `Moved to ${columns[newIndex].replace("-", " ")}`,
          });
        } else {
          toast({
            title: "Error",
            description: "Failed to move card",
            variant: "destructive",
          });
        }
      } catch (error) {
        toast({
          title: "Error",
          description: "Failed to connect to server",
          variant: "destructive",
        });
      }
    }
  };

  const handleClusterIdeas = async () => {
    setIsProcessing(true);
    
    try {
      const response = await fetch("/api/ai/cluster", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
      });

      if (response.ok) {
        const data = await response.json();
        if (data.ideas) {
          setIdeas(data.ideas);
          toast({
            title: "Ideas clustered",
            description: "AI has organized your ideas into themed groups.",
          });
        } else {
          toast({
            title: "No ideas to cluster",
            description: data.message || "Add some ideas first!",
          });
        }
      } else {
        toast({
          title: "Error",
          description: "Failed to cluster ideas",
          variant: "destructive",
        });
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to connect to server",
        variant: "destructive",
      });
    } finally {
      setIsProcessing(false);
    }
  };

  const handleSummarize = async () => {
    setIsProcessing(true);
    
    try {
      const response = await fetch("/api/ai/summarize", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
      });

      if (response.ok) {
        const data = await response.json();
        setSummary(data.summary);
        toast({
          title: "Summary generated",
          description: "AI has created a board summary. Check the right panel!",
        });
      } else {
        toast({
          title: "Error",
          description: "Failed to generate summary",
          variant: "destructive",
        });
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to connect to server",
        variant: "destructive",
      });
    } finally {
      setIsProcessing(false);
    }
  };

  const handleAddSuggestion = (text: string) => {
    const newIdea: Idea = {
      id: Date.now().toString(),
      title: text.slice(0, 60) + (text.length > 60 ? "..." : ""),
      content: text,
      column: "ideas",
    };
    setIdeas([...ideas, newIdea]);
    setSuggestions(suggestions.filter((s) => s.text !== text));
    toast({
      title: "Suggestion added",
      description: "AI suggestion has been added to your board.",
    });
  };

  // Share a specific idea to a recipient username
  const handleShareIdea = async (id: string, title: string, content: string) => {
    const recipientUsername = window.prompt("Enter recipient username to share with:");
    if (!recipientUsername) return;
    if (!boardId) {
      toast({ title: "Share failed", description: "Board not loaded yet", variant: "destructive" });
      return;
    }
    try {
      const response = await fetch("/api/share-item", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ recipientUsername, sourceBoardId: boardId, title, content }),
      });
      if (response.ok) {
        toast({ title: "Shared", description: `Sent to ${recipientUsername}` });
      } else {
        const err = await response.json().catch(() => ({}));
        toast({ title: "Share failed", description: err.message || "Unable to share", variant: "destructive" });
      }
    } catch (_e) {
      toast({ title: "Network error", description: "Unable to share", variant: "destructive" });
    }
  };

  // Search functionality
  const handleSearch = async (query: string) => {
    console.log("Search called with query:", query, "boardId:", boardId);
    if (!query.trim()) {
      setSearchResults([]);
      return;
    }

    if (!boardId) {
      console.log("No boardId available");
      toast({
        title: "Search failed",
        description: "Board not loaded yet",
        variant: "destructive",
      });
      return;
    }

    try {
      console.log("Making search request to:", `/api/boards/${boardId}/search?q=${encodeURIComponent(query)}`);
      const response = await fetch(`/api/boards/${boardId}/search?q=${encodeURIComponent(query)}`, {
        credentials: "include",
      });

      console.log("Search response status:", response.status);
      if (response.ok) {
        const data = await response.json();
        console.log("Search results:", data);
        setSearchResults(data.ideas || []);
      } else {
        const errorText = await response.text();
        console.log("Search error response:", errorText);
        toast({
          title: "Search failed",
          description: "Unable to search ideas",
          variant: "destructive",
        });
      }
    } catch (error) {
      console.log("Search error:", error);
      toast({
        title: "Search error",
        description: "Failed to connect to server",
        variant: "destructive",
      });
    }
  };

  // Mood analysis functionality
  const handleAnalyzeMood = async (ideaId: string, title: string, content: string) => {
    try {
      const response = await fetch("/api/ai/mood-analysis", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ ideaId, title, content }),
      });

      if (response.ok) {
        const data = await response.json();
        setIdeas(ideas.map(idea => 
          idea.id === ideaId 
            ? { ...idea, mood: data.mood }
            : idea
        ));
        toast({
          title: "Mood analyzed",
          description: `Idea sentiment: ${data.mood.mood} (${data.mood.confidence}% confidence)`,
        });
      }
    } catch (error) {
      toast({
        title: "Analysis failed",
        description: "Unable to analyze mood",
        variant: "destructive",
      });
    }
  };

  // Export functionality
  const handleExportMarkdown = async () => {
    console.log("Export markdown called, boardId:", boardId);
    if (!boardId) {
      console.log("No boardId available for export");
      toast({
        title: "Export failed",
        description: "Board not loaded yet",
        variant: "destructive",
      });
      return;
    }

    try {
      console.log("Making export request to:", `/api/boards/${boardId}/export/markdown`);
      const response = await fetch(`/api/boards/${boardId}/export/markdown`, {
        credentials: "include",
      });

      console.log("Export response status:", response.status);
      if (response.ok) {
        const blob = await response.blob();
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `board-export-${new Date().toISOString().split('T')[0]}.md`;
        document.body.appendChild(a);
        a.click();
        window.URL.revokeObjectURL(url);
        document.body.removeChild(a);
        
        toast({
          title: "Export successful",
          description: "Board exported as Markdown",
        });
      } else {
        const errorText = await response.text();
        console.log("Export error response:", errorText);
        toast({
          title: "Export failed",
          description: "Unable to export board",
          variant: "destructive",
        });
      }
    } catch (error) {
      console.log("Export error:", error);
      toast({
        title: "Export failed",
        description: "Unable to export board",
        variant: "destructive",
      });
    }
  };

  const handleExportPDF = async () => {
    if (!boardId) {
      toast({
        title: "Export failed",
        description: "Board not loaded yet",
        variant: "destructive",
      });
      return;
    }

    try {
      const response = await fetch(`/api/boards/${boardId}/export/pdf`, {
        credentials: "include",
      });

      if (response.ok) {
        const data = await response.json();
        // For now, just show the data - in production you'd generate actual PDF
        console.log("PDF Data:", data.pdfData);
        toast({
          title: "PDF Export",
          description: "PDF generation would be implemented with a PDF library",
        });
      } else {
        toast({
          title: "Export failed",
          description: "Unable to export PDF",
          variant: "destructive",
        });
      }
    } catch (error) {
      toast({
        title: "Export failed",
        description: "Unable to export PDF",
        variant: "destructive",
      });
    }
  };

  // Board sharing functionality
  const handleShareBoard = async () => {
    console.log("Share board called, boardId:", boardId, "shareFormData:", shareFormData);
    if (!shareFormData.username.trim()) {
      toast({
        title: "Username required",
        description: "Please enter a username to share with",
        variant: "destructive",
      });
      return;
    }

    if (!boardId) {
      console.log("No boardId available for sharing");
      toast({
        title: "Share failed",
        description: "Board not loaded yet",
        variant: "destructive",
      });
      return;
    }

    try {
      console.log("Making share request to:", `/api/boards/${boardId}/share`);
      const response = await fetch(`/api/boards/${boardId}/share`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify(shareFormData),
      });

      console.log("Share response status:", response.status);
      if (response.ok) {
        toast({
          title: "Board shared",
          description: `Board shared with ${shareFormData.username} as ${shareFormData.role}`,
        });
        setIsShareDialogOpen(false);
        setShareFormData({ username: "", role: "viewer" });
      } else {
        const error = await response.json();
        console.log("Share error response:", error);
        toast({
          title: "Share failed",
          description: error.message || "Unable to share board",
          variant: "destructive",
        });
      }
    } catch (error) {
      console.log("Share error:", error);
      toast({
        title: "Share error",
        description: "Failed to connect to server",
        variant: "destructive",
      });
    }
  };

  // Inbox actions
  const handleAcceptInbox = async () => {
    if (!inboxItem) return;
    try {
      const response = await fetch(`/api/inbox/${inboxItem.id}/accept`, {
        method: "POST",
        credentials: "include",
      });
      if (response.ok) {
        const data = await response.json();
        if (data.idea) {
          setIdeas(prev => [...prev, data.idea]);
        }
        toast({ title: "Item accepted", description: "Added to your Ideas." });
      } else {
        toast({ title: "Accept failed", description: "Could not accept item.", variant: "destructive" });
      }
    } catch (_e) {
      toast({ title: "Network error", description: "Could not accept item.", variant: "destructive" });
    } finally {
      setIsInboxDialogOpen(false);
      setInboxItem(null);
    }
  };

  const handleDismissInbox = async () => {
    if (!inboxItem) return;
    try {
      const response = await fetch(`/api/inbox/${inboxItem.id}/dismiss`, {
        method: "POST",
        credentials: "include",
      });
      if (response.ok) {
        toast({ title: "Dismissed", description: "Item dismissed." });
      }
    } catch (_e) {
      // ignore
    } finally {
      setIsInboxDialogOpen(false);
      setInboxItem(null);
    }
  };

  // Inbox panel actions
  const refreshInbox = async () => {
    try {
      const response = await fetch("/api/inbox", { credentials: "include" });
      if (response.ok) {
        const data = await response.json();
        setInboxItems(Array.isArray(data.items) ? data.items : []);
      }
    } catch (_e) {}
  };

  const handleAcceptItem = async (id: string) => {
    try {
      const response = await fetch(`/api/inbox/${id}/accept`, { method: "POST", credentials: "include" });
      if (response.ok) {
        const data = await response.json();
        if (data.idea) setIdeas(prev => [...prev, data.idea]);
        setInboxItems(prev => prev.filter(i => i.id !== id));
        toast({ title: "Item accepted", description: "Added to your Ideas." });
      }
    } catch (_e) {}
  };

  const handleDismissItem = async (id: string) => {
    try {
      const response = await fetch(`/api/inbox/${id}/dismiss`, { method: "POST", credentials: "include" });
      if (response.ok) setInboxItems(prev => prev.filter(i => i.id !== id));
    } catch (_e) {}
  };


  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Loading your board...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-screen w-full flex-col">
      {/* Header */}
      <header className="border-b border-border bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="flex h-14 items-center justify-between px-6">
          <div className="flex items-center gap-4">
            <h1 className="text-lg font-semibold">SparkBoard</h1>
            <span className="text-sm text-muted-foreground">
              Welcome, {user.username}
            </span>
          </div>
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" onClick={() => { setIsInboxOpen(true); refreshInbox(); }}>
              <Inbox className="h-4 w-4 mr-2" />
              Inbox {inboxItems.length > 0 ? `(${inboxItems.length})` : ""}
            </Button>
            <Button variant="outline" size="sm" onClick={() => setIsSearchOpen(true)}>
              <Search className="h-4 w-4 mr-2" />
              Search
            </Button>
            <Button variant="outline" size="sm" onClick={() => setIsShareDialogOpen(true)}>
              <Share2 className="h-4 w-4 mr-2" />
              Share
            </Button>
            <Button variant="outline" size="sm" onClick={handleExportMarkdown}>
              <Download className="h-4 w-4 mr-2" />
              Export
            </Button>
            <ThemeToggle />
            <Button variant="outline" size="sm" onClick={onLogout}>
              <LogOut className="h-4 w-4 mr-2" />
              Logout
            </Button>
          </div>
        </div>
      </header>
      
      {/* Main Content */}
      <div className="flex flex-1 overflow-hidden">
      <LeftToolbar
        onAddCard={handleAddCard}
        onClusterIdeas={handleClusterIdeas}
        onSummarize={handleSummarize}
        isProcessing={isProcessing}
      />

      <div className="flex-1 flex flex-col overflow-hidden">
        <header className="flex items-center justify-between p-4 border-b border-border">
          <div>
            <h1 className="text-2xl font-bold" data-testid="text-board-title">
              My Brainstorm Board
            </h1>
            <p className="text-sm text-muted-foreground">
              AI-powered idea organization
            </p>
          </div>
          <ThemeToggle />
        </header>

        <div className="flex-1 overflow-x-auto overflow-y-hidden">
          <div className="flex gap-6 p-6 h-full">
            <BoardColumn title="Ideas" count={ideas.filter(i => i.column === "ideas").length}>
              {ideas.filter(i => i.column === "ideas").map((idea) => (
                <IdeaCard
                  key={idea.id}
                  {...idea}
                  onEdit={handleEditCard}
                  onDelete={handleDeleteCard}
                  onMove={handleMoveCard}
                  onAnalyzeMood={handleAnalyzeMood}
                  onShare={handleShareIdea}
                />
              ))}
            </BoardColumn>

            <BoardColumn
              title="In Progress"
              count={ideas.filter(i => i.column === "in-progress").length}
            >
              {ideas.filter(i => i.column === "in-progress").map((idea) => (
                <IdeaCard
                  key={idea.id}
                  {...idea}
                  onEdit={handleEditCard}
                  onDelete={handleDeleteCard}
                  onMove={handleMoveCard}
                  onAnalyzeMood={handleAnalyzeMood}
                />
              ))}
            </BoardColumn>

            <BoardColumn
              title="Completed"
              count={ideas.filter(i => i.column === "completed").length}
            >
              {ideas.filter(i => i.column === "completed").map((idea) => (
                <IdeaCard
                  key={idea.id}
                  {...idea}
                  onEdit={handleEditCard}
                  onDelete={handleDeleteCard}
                  onMove={handleMoveCard}
                  onAnalyzeMood={handleAnalyzeMood}
                />
              ))}
            </BoardColumn>
          </div>
        </div>
      </div>

      <RightPanel
        summary={summary}
        suggestions={suggestions}
        onAddSuggestion={handleAddSuggestion}
      />

      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent data-testid="dialog-card-form">
          <DialogHeader>
            <DialogTitle>
              {editingIdea ? "Edit Idea" : "Add New Idea"}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="title">Title</Label>
              <Input
                id="title"
                placeholder="Enter idea title..."
                value={formData.title}
                onChange={(e) =>
                  setFormData({ ...formData, title: e.target.value })
                }
                data-testid="input-title"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="content">Description</Label>
              <Textarea
                id="content"
                placeholder="Describe your idea in detail..."
                value={formData.content}
                onChange={(e) =>
                  setFormData({ ...formData, content: e.target.value })
                }
                rows={4}
                data-testid="input-content"
              />
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setIsDialogOpen(false)}
              data-testid="button-cancel"
            >
              Cancel
            </Button>
            <Button onClick={handleSaveCard} data-testid="button-save">
              {editingIdea ? "Update" : "Add"} Idea
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Search Dialog */}
      <Dialog open={isSearchOpen} onOpenChange={setIsSearchOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Search Ideas</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="search">Search Query</Label>
              <Input
                id="search"
                placeholder="Search ideas..."
                value={searchQuery}
                onChange={(e) => {
                  setSearchQuery(e.target.value);
                  handleSearch(e.target.value);
                }}
              />
            </div>
            {searchResults.length > 0 && (
              <div className="space-y-2">
                <Label>Search Results ({searchResults.length})</Label>
                <div className="max-h-60 overflow-y-auto space-y-2">
                  {searchResults.map((idea) => (
                    <div key={idea.id} className="p-3 border rounded-lg">
                      <h4 className="font-medium">{idea.title}</h4>
                      <p className="text-sm text-muted-foreground">{idea.content}</p>
                      <div className="flex items-center gap-2 mt-2">
                        <span className="text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded">
                          {idea.column}
                        </span>
                        {idea.mood && (
                          <span className={`text-xs px-2 py-1 rounded ${
                            idea.mood.mood === 'positive' ? 'bg-green-100 text-green-800' :
                            idea.mood.mood === 'negative' ? 'bg-red-100 text-red-800' :
                            'bg-gray-100 text-gray-800'
                          }`}>
                            {idea.mood.mood} ({idea.mood.confidence}%)
                          </span>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsSearchOpen(false)}>
              Close
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Share Dialog */}
      <Dialog open={isShareDialogOpen} onOpenChange={setIsShareDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Share Board</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="share-username">Username</Label>
              <Input
                id="share-username"
                placeholder="Enter username to share with..."
                value={shareFormData.username}
                onChange={(e) =>
                  setShareFormData({ ...shareFormData, username: e.target.value })
                }
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="share-role">Role</Label>
              <select
                id="share-role"
                className="w-full p-2 border rounded-md"
                value={shareFormData.role}
                onChange={(e) =>
                  setShareFormData({ ...shareFormData, role: e.target.value })
                }
              >
                <option value="viewer">Viewer (read-only)</option>
                <option value="editor">Editor (can edit)</option>
              </select>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsShareDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleShareBoard}>
              Share Board
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Inbox Dialog */}
      <Dialog open={isInboxDialogOpen} onOpenChange={setIsInboxDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Incoming shared item</DialogTitle>
          </DialogHeader>
          {inboxItem && (
            <div className="space-y-2 py-2">
              <div>
                <Label>Title</Label>
                <div className="mt-1 p-2 border rounded-md">{inboxItem.title}</div>
              </div>
              <div>
                <Label>Content</Label>
                <div className="mt-1 p-2 border rounded-md whitespace-pre-wrap">{inboxItem.content}</div>
              </div>
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={handleDismissInbox}>Dismiss</Button>
            <Button onClick={handleAcceptInbox}>Accept into Ideas</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Inbox Panel */}
      <Sheet open={isInboxOpen} onOpenChange={setIsInboxOpen}>
        <SheetContent side="right" className="w-[380px] sm:w-[420px]">
          <SheetHeader>
            <SheetTitle>Inbox</SheetTitle>
          </SheetHeader>
          <div className="mt-4 space-y-3">
            {inboxItems.length === 0 ? (
              <div className="text-sm text-muted-foreground">No new items.</div>
            ) : (
              inboxItems.map(item => (
                <div key={item.id} className="p-3 border rounded-md">
                  <div className="font-medium">{item.title}</div>
                  <div className="text-sm text-muted-foreground whitespace-pre-wrap mt-1">{item.content}</div>
                  <div className="flex gap-2 mt-2">
                    <Button size="sm" onClick={() => handleAcceptItem(item.id)}>Accept</Button>
                    <Button size="sm" variant="outline" onClick={() => handleDismissItem(item.id)}>Dismiss</Button>
                  </div>
                </div>
              ))
            )}
          </div>
        </SheetContent>
      </Sheet>
      </div>
    </div>
  );
}

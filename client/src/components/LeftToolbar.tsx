import { Button } from "@/components/ui/button";
import { Plus, Sparkles, FileText } from "lucide-react";
import { Separator } from "@/components/ui/separator";

export interface LeftToolbarProps {
  onAddCard?: () => void;
  onClusterIdeas?: () => void;
  onSummarize?: () => void;
  isProcessing?: boolean;
}

export function LeftToolbar({
  onAddCard,
  onClusterIdeas,
  onSummarize,
  isProcessing = false,
}: LeftToolbarProps) {
  return (
    <div className="w-64 border-r border-border p-6 space-y-4">
      <div className="space-y-2">
        <h3 className="text-sm font-medium text-muted-foreground mb-3">
          Actions
        </h3>
        <Button
          className="w-full justify-start"
          onClick={onAddCard}
          data-testid="button-add-card"
        >
          <Plus className="mr-2 h-4 w-4" />
          Add Idea Card
        </Button>
      </div>

      <Separator />

      <div className="space-y-2">
        <h3 className="text-sm font-medium text-muted-foreground mb-3">
          AI Features
        </h3>
        <Button
          variant="outline"
          className="w-full justify-start"
          onClick={onClusterIdeas}
          disabled={isProcessing}
          data-testid="button-cluster"
        >
          <Sparkles className="mr-2 h-4 w-4" />
          {isProcessing ? "Clustering..." : "Cluster Ideas"}
        </Button>
        <Button
          variant="outline"
          className="w-full justify-start"
          onClick={onSummarize}
          disabled={isProcessing}
          data-testid="button-summarize"
        >
          <FileText className="mr-2 h-4 w-4" />
          {isProcessing ? "Summarizing..." : "Summarize Board"}
        </Button>
      </div>

      <Separator />

      <div className="pt-4">
        <p className="text-xs text-muted-foreground">
          💡 Tip: Add ideas and let AI suggest related concepts and cluster
          them automatically.
        </p>
      </div>
    </div>
  );
}

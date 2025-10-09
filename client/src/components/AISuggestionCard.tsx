import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Sparkles, Plus } from "lucide-react";

export interface AISuggestionCardProps {
  id: string;
  suggestion: string;
  onAdd?: (suggestion: string) => void;
}

export function AISuggestionCard({
  id,
  suggestion,
  onAdd,
}: AISuggestionCardProps) {
  return (
    <Card
      className="border-l-4 hover-elevate transition-shadow duration-150"
      style={{
        borderLeftColor: "hsl(var(--ai-accent))",
      }}
      data-testid={`card-suggestion-${id}`}
    >
      <div className="p-3">
        <div className="flex items-start gap-2 mb-2">
          <Sparkles className="h-4 w-4 text-ai-accent flex-shrink-0 mt-0.5" />
          <p className="text-sm flex-1" data-testid={`text-suggestion-${id}`}>
            {suggestion}
          </p>
        </div>
        <Button
          size="sm"
          variant="outline"
          className="w-full h-7 text-xs"
          onClick={() => onAdd?.(suggestion)}
          data-testid={`button-add-suggestion-${id}`}
        >
          <Plus className="h-3 w-3 mr-1" />
          Add to Board
        </Button>
      </div>
    </Card>
  );
}

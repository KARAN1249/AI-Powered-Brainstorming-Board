import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card } from "@/components/ui/card";
import { Sparkles, Clock } from "lucide-react";
import { AISuggestionCard } from "./AISuggestionCard";

export interface Suggestion {
  id: string;
  text: string;
  timestamp: string;
}

export interface RightPanelProps {
  summary?: string;
  suggestions?: Suggestion[];
  onAddSuggestion?: (text: string) => void;
}

export function RightPanel({
  summary,
  suggestions = [],
  onAddSuggestion,
}: RightPanelProps) {
  return (
    <div className="w-96 border-l border-border p-6 overflow-y-auto">
      <Tabs defaultValue="summary" className="w-full">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="summary" data-testid="tab-summary">
            Summary
          </TabsTrigger>
          <TabsTrigger value="suggestions" data-testid="tab-suggestions">
            Suggestions
          </TabsTrigger>
        </TabsList>

        <TabsContent value="summary" className="space-y-4 mt-4">
          {summary ? (
            <Card className="p-4">
              <div className="flex items-start gap-2 mb-3">
                <Sparkles className="h-5 w-5 text-ai-accent flex-shrink-0 mt-0.5" />
                <h3 className="font-semibold">AI Board Summary</h3>
              </div>
              <div className="prose prose-sm max-w-none dark:prose-invert">
                <div
                  className="text-sm text-foreground whitespace-pre-wrap"
                  data-testid="text-summary"
                >
                  {summary}
                </div>
              </div>
            </Card>
          ) : (
            <Card className="p-6 text-center">
              <Sparkles className="h-12 w-12 text-muted-foreground mx-auto mb-3" />
              <p className="text-sm text-muted-foreground">
                Click "Summarize Board" to generate an AI summary of your ideas
              </p>
            </Card>
          )}
        </TabsContent>

        <TabsContent value="suggestions" className="space-y-3 mt-4">
          {suggestions.length > 0 ? (
            suggestions.map((suggestion) => (
              <div key={suggestion.id} className="space-y-2">
                <AISuggestionCard
                  id={suggestion.id}
                  suggestion={suggestion.text}
                  onAdd={onAddSuggestion}
                />
                <div className="flex items-center gap-1 text-xs text-muted-foreground pl-2">
                  <Clock className="h-3 w-3" />
                  <span>{suggestion.timestamp}</span>
                </div>
              </div>
            ))
          ) : (
            <Card className="p-6 text-center">
              <Sparkles className="h-12 w-12 text-muted-foreground mx-auto mb-3" />
              <p className="text-sm text-muted-foreground">
                AI suggestions will appear here when you add ideas
              </p>
            </Card>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}

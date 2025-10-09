import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { GripVertical, Pencil, Trash2, MoveRight, Brain, Share2 } from "lucide-react";
import { Badge } from "@/components/ui/badge";
// import { useDraggable } from '@dnd-kit/core';
// import { CSS } from '@dnd-kit/utilities';

export interface IdeaCardProps {
  id: string;
  title: string;
  content: string;
  clusterId?: number;
  clusterName?: string;
  clusterColor?: string;
  mood?: {
    mood: "positive" | "neutral" | "negative";
    confidence: number;
  };
  onEdit?: (id: string) => void;
  onDelete?: (id: string) => void;
  onMove?: (id: string, direction: "left" | "right") => void;
  onAnalyzeMood?: (id: string, title: string, content: string) => void;
  onShare?: (id: string, title: string, content: string) => void;
}

export function IdeaCard({
  id,
  title,
  content,
  clusterId,
  clusterName,
  clusterColor,
  mood,
  onEdit,
  onDelete,
  onMove,
  onAnalyzeMood,
  onShare,
}: IdeaCardProps) {
  const cluster = clusterId && clusterName && clusterColor ? {
    id: clusterId,
    name: clusterName,
    color: clusterColor,
  } : undefined;

  // const {
  //   attributes,
  //   listeners,
  //   setNodeRef,
  //   transform,
  //   isDragging,
  // } = useDraggable({
  //   id: id,
  // });

  // const style = {
  //   transform: CSS.Translate.toString(transform),
  //   opacity: isDragging ? 0.5 : 1,
  // };
  return (
    <Card
      style={
        cluster
          ? {
              borderLeft: `4px solid ${cluster.color}`,
            }
          : undefined
      }
      className="group relative hover-elevate active-elevate-2 transition-shadow duration-150"
      data-testid={`card-idea-${id}`}
    >
      <div className="p-4">
        <div className="flex items-start justify-between gap-2 mb-3">
          <div className="flex items-center gap-2 flex-1 min-w-0">
            <GripVertical 
              className="h-4 w-4 text-muted-foreground flex-shrink-0 cursor-grab active:cursor-grabbing" 
            />
            <h3 className="font-medium text-base truncate" data-testid={`text-title-${id}`}>
              {title}
            </h3>
          </div>
          <div className="flex items-center gap-1">
            <Button
              variant="ghost"
              size="icon"
              className="h-7 w-7 opacity-0 group-hover:opacity-100 transition-opacity"
              onClick={() => onShare?.(id, title, content)}
              title="Share this idea"
            >
              <Share2 className="h-3.5 w-3.5" />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              className="h-7 w-7 opacity-0 group-hover:opacity-100 transition-opacity"
              onClick={() => onAnalyzeMood?.(id, title, content)}
              data-testid={`button-mood-${id}`}
              title="Analyze mood"
            >
              <Brain className="h-3.5 w-3.5" />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              className="h-7 w-7 opacity-0 group-hover:opacity-100 transition-opacity"
              onClick={() => onEdit?.(id)}
              data-testid={`button-edit-${id}`}
            >
              <Pencil className="h-3.5 w-3.5" />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              className="h-7 w-7 opacity-0 group-hover:opacity-100 transition-opacity"
              onClick={() => onDelete?.(id)}
              data-testid={`button-delete-${id}`}
            >
              <Trash2 className="h-3.5 w-3.5" />
            </Button>
          </div>
        </div>

        <p className="text-sm text-muted-foreground mb-3" data-testid={`text-content-${id}`}>
          {content}
        </p>

        <div className="flex items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            {cluster && (
              <Badge
                variant="outline"
                className="text-xs"
                style={{
                  backgroundColor: `${cluster.color}10`,
                  borderColor: cluster.color,
                  color: cluster.color,
                }}
                data-testid={`badge-cluster-${id}`}
              >
                {cluster.name}
              </Badge>
            )}
            {mood && (
              <Badge
                variant="outline"
                className={`text-xs ${
                  mood.mood === 'positive' ? 'bg-green-50 text-green-700 border-green-200' :
                  mood.mood === 'negative' ? 'bg-red-50 text-red-700 border-red-200' :
                  'bg-gray-50 text-gray-700 border-gray-200'
                }`}
                data-testid={`badge-mood-${id}`}
              >
                {mood.mood} ({mood.confidence}%)
              </Badge>
            )}
          </div>
          <div className="flex items-center gap-1 ml-auto">
            <Button
              variant="ghost"
              size="sm"
              className="h-7 px-2 text-xs"
              onClick={() => onMove?.(id, "left")}
              data-testid={`button-move-left-${id}`}
            >
              <MoveRight className="h-3 w-3 rotate-180 mr-1" />
              Move
            </Button>
            <Button
              variant="ghost"
              size="sm"
              className="h-7 px-2 text-xs"
              onClick={() => onMove?.(id, "right")}
              data-testid={`button-move-right-${id}`}
            >
              Move
              <MoveRight className="h-3 w-3 ml-1" />
            </Button>
          </div>
        </div>
      </div>
    </Card>
  );
}

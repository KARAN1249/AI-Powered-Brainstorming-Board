import React from 'react';
import {
  DndContext,
  DragEndEvent,
  DragOverEvent,
  DragStartEvent,
  PointerSensor,
  useSensor,
  useSensors,
  DragOverlay,
  defaultDropAnimationSideEffects,
} from '@dnd-kit/core';
import {
  SortableContext,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable';
import { createPortal } from 'react-dom';
import { IdeaCard } from './IdeaCard';
import { BoardColumn } from './BoardColumn';
import { useToast } from '@/hooks/use-toast';

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
}

interface DragDropBoardProps {
  ideas: Idea[];
  onMoveCard: (id: string, column: string, position: number) => Promise<void>;
  onEditCard: (id: string) => void;
  onDeleteCard: (id: string) => Promise<void>;
}

export function DragDropBoard({ ideas, onMoveCard, onEditCard, onDeleteCard }: DragDropBoardProps) {
  const { toast } = useToast();
  const [activeId, setActiveId] = React.useState<string | null>(null);
  
  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8,
      },
    })
  );

  const ideasByColumn = {
    ideas: ideas.filter((i) => i.column === "ideas"),
    "in-progress": ideas.filter((i) => i.column === "in-progress"),
    completed: ideas.filter((i) => i.column === "completed"),
  };

  const handleDragStart = (event: DragStartEvent) => {
    setActiveId(event.active.id as string);
  };

  const handleDragEnd = async (event: DragEndEvent) => {
    const { active, over } = event;
    setActiveId(null);

    if (!over) return;

    const activeId = active.id as string;
    const overId = over.id as string;

    // Find the active idea
    const activeIdea = ideas.find(idea => idea.id === activeId);
    if (!activeIdea) return;

    // Determine the target column
    let targetColumn: string;
    if (overId === 'ideas' || overId === 'in-progress' || overId === 'completed') {
      targetColumn = overId;
    } else {
      // If dropped on another card, find which column it belongs to
      const overIdea = ideas.find(idea => idea.id === overId);
      if (!overIdea) return;
      targetColumn = overIdea.column;
    }

    // Don't do anything if dropped in the same column
    if (activeIdea.column === targetColumn) return;

    try {
      await onMoveCard(activeId, targetColumn, 0);
      toast({
        title: "Card moved",
        description: `Moved to ${targetColumn.replace("-", " ")}`,
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to move card",
        variant: "destructive",
      });
    }
  };

  const activeIdea = activeId ? ideas.find(idea => idea.id === activeId) : null;

  return (
    <DndContext
      sensors={sensors}
      onDragStart={handleDragStart}
      onDragEnd={handleDragEnd}
    >
      <div className="flex-1 flex gap-6 p-6 overflow-x-auto">
        <SortableContext
          id="ideas"
          items={ideasByColumn.ideas.map(idea => idea.id)}
          strategy={verticalListSortingStrategy}
        >
          <BoardColumn title="Ideas" count={ideasByColumn.ideas.length}>
            {ideasByColumn.ideas.map((idea) => (
              <IdeaCard
                key={idea.id}
                id={idea.id}
                title={idea.title}
                content={idea.content}
                clusterId={idea.clusterId}
                clusterName={idea.clusterName}
                clusterColor={idea.clusterColor}
                onEdit={onEditCard}
                onDelete={onDeleteCard}
              />
            ))}
          </BoardColumn>
        </SortableContext>

        <SortableContext
          id="in-progress"
          items={ideasByColumn["in-progress"].map(idea => idea.id)}
          strategy={verticalListSortingStrategy}
        >
          <BoardColumn
            title="In Progress"
            count={ideasByColumn["in-progress"].length}
          >
            {ideasByColumn["in-progress"].map((idea) => (
              <IdeaCard
                key={idea.id}
                id={idea.id}
                title={idea.title}
                content={idea.content}
                clusterId={idea.clusterId}
                clusterName={idea.clusterName}
                clusterColor={idea.clusterColor}
                onEdit={onEditCard}
                onDelete={onDeleteCard}
              />
            ))}
          </BoardColumn>
        </SortableContext>

        <SortableContext
          id="completed"
          items={ideasByColumn.completed.map(idea => idea.id)}
          strategy={verticalListSortingStrategy}
        >
          <BoardColumn
            title="Completed"
            count={ideasByColumn.completed.length}
          >
            {ideasByColumn.completed.map((idea) => (
              <IdeaCard
                key={idea.id}
                id={idea.id}
                title={idea.title}
                content={idea.content}
                clusterId={idea.clusterId}
                clusterName={idea.clusterName}
                clusterColor={idea.clusterColor}
                onEdit={onEditCard}
                onDelete={onDeleteCard}
              />
            ))}
          </BoardColumn>
        </SortableContext>
      </div>

      {createPortal(
        <DragOverlay
          dropAnimation={{
            sideEffects: defaultDropAnimationSideEffects({
              styles: {
                active: {
                  opacity: '0.5',
                },
              },
            }),
          }}
        >
          {activeIdea ? (
            <IdeaCard
              id={activeIdea.id}
              title={activeIdea.title}
              content={activeIdea.content}
              clusterId={activeIdea.clusterId}
              clusterName={activeIdea.clusterName}
              clusterColor={activeIdea.clusterColor}
            />
          ) : null}
        </DragOverlay>,
        document.body
      )}
    </DndContext>
  );
}


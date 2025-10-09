import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

export interface BoardColumnProps {
  title: string;
  count: number;
  children: React.ReactNode;
}

export function BoardColumn({ title, count, children }: BoardColumnProps) {
  return (
    <div className="flex-shrink-0 w-80">
      <div className="sticky top-0 z-10 bg-background/80 backdrop-blur-sm pb-3 mb-3">
        <div className="flex items-center justify-between gap-2">
          <h2 className="text-xl font-semibold" data-testid={`text-column-${title.toLowerCase()}`}>
            {title}
          </h2>
          <Badge variant="secondary" className="text-xs" data-testid={`badge-count-${title.toLowerCase()}`}>
            {count}
          </Badge>
        </div>
      </div>
      <div className="space-y-3 min-h-[200px]" data-testid={`column-${title.toLowerCase()}`}>
        {children}
      </div>
    </div>
  );
}

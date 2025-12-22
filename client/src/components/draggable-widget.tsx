import React from 'react';
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { GripVertical } from 'lucide-react';
import { cn } from '@/lib/utils';

interface DraggableWidgetProps {
  id: string;
  children: React.ReactNode;
  className?: string;
}

export function DraggableWidget({ id, children, className }: DraggableWidgetProps) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={cn(
        'relative group',
        isDragging && 'z-50 opacity-90 shadow-2xl shadow-primary/20 scale-[1.02]',
        className
      )}
      data-testid={`draggable-widget-${id}`}
    >
      <div
        {...attributes}
        {...listeners}
        className={cn(
          'absolute -left-2 top-1/2 -translate-y-1/2 z-10',
          'flex items-center justify-center w-6 h-10',
          'rounded-md cursor-grab active:cursor-grabbing',
          'bg-background/80 backdrop-blur-sm border border-border/50',
          'opacity-0 group-hover:opacity-100 transition-opacity duration-200',
          'hover:bg-muted hover:border-primary/30',
          isDragging && 'opacity-100 cursor-grabbing bg-primary/10 border-primary/50'
        )}
        data-testid={`drag-handle-${id}`}
      >
        <GripVertical className="w-4 h-4 text-muted-foreground" />
      </div>
      {children}
    </div>
  );
}

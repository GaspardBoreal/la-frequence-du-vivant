import React from 'react';
import { useDraggable } from '@dnd-kit/core';
import { CSS } from '@dnd-kit/utilities';

interface DraggableApparitionProps {
  id: string;
  children: React.ReactNode;
  position: { x: number; y: number };
  zIndex: number;
}

const DraggableApparition: React.FC<DraggableApparitionProps> = ({
  id,
  children,
  position,
  zIndex,
}) => {
  const { attributes, listeners, setNodeRef, transform, isDragging } = useDraggable({ id });

  const style: React.CSSProperties = {
    left: `${Math.min(position.x, 60)}%`,
    top: `${position.y}%`,
    zIndex: isDragging ? 9999 : zIndex,
    transform: transform ? CSS.Translate.toString(transform) : undefined,
    cursor: isDragging ? 'grabbing' : 'grab',
    touchAction: 'none',
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={`absolute transition-shadow duration-200 ${
        isDragging ? 'scale-105 ring-2 ring-white/20 rounded-2xl' : ''
      }`}
      {...listeners}
      {...attributes}
    >
      {children}
    </div>
  );
};

export default DraggableApparition;

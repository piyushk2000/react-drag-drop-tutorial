import React from 'react';
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';

// Define reusable styles
const ITEM_STYLE = {
  opacity: 1,
};

const DRAGGING_STYLE = {
  opacity: 0.5,
};

const SortableItem = ({ id, children }) => {
  const {
    setNodeRef,
    transform,
    transition,
    isDragging,
    attributes,
    listeners,
  } = useSortable({ id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    ...(isDragging ? DRAGGING_STYLE : ITEM_STYLE),
  };

  return (
    <div ref={setNodeRef} style={style}>
      {React.cloneElement(children, { attributes, listeners })}
    </div>
  );
};

export default SortableItem;
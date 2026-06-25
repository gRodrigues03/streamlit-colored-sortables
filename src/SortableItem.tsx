import React, {ReactNode, FunctionComponent} from 'react';
import {useSortable} from '@dnd-kit/sortable';
import {CSS} from '@dnd-kit/utilities';

export interface SortableItemProps {
  id: string,
  ghost: boolean,
  isActive?: boolean,
  children?: ReactNode,
  isOverlay?: boolean,
}

export const SortableItem: FunctionComponent<SortableItemProps> = (props) => {
  // 1. Separate logic conditionally so we don't activate tracking on the Overlay element
  if (props.isOverlay) {
    const className = `btn sortables__item ${props.isActive ? "active" : ""} dragging`;
    const style: React.CSSProperties = {
      cursor: 'grabbing',
    };

    return (
      <li className={className} style={style}>
        {props.children ?? null}
      </li>
    );
  }

  // 2. This runs only for regular sortable items in the lists
  return <SortableItemInner {...props} />;
};

// Internal sub-component so hooks are always called unconditionally
const SortableItemInner: FunctionComponent<SortableItemProps> = (props) => {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging
  } = useSortable({id: props.id});

  const style: React.CSSProperties = {
    transform: transform ? CSS.Transform.toString(transform) : undefined,
    transition: transition,
    cursor: isDragging ? 'grabbing' : 'grab',
  };

  const className = `btn sortables__item ${props.isActive ? "active" : ""} ${isDragging ? "dragging" : ""}`;

  return (
    <li
      className={className}
      data-testid={props.children ?? null}
      ref={setNodeRef}
      style={style}
      {...attributes}
      {...listeners}
    >
      {props.children ?? null}
    </li>
  );
};
import React from 'react';
import { useIntl } from '@edx/frontend-platform/i18n';
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import {
  Col,
  Icon,
  Row,
} from '@openedx/paragon';
import { DragIndicator } from '@openedx/paragon/icons';

import messages from './messages';

interface SortableItemProps {
  id: string;
  data: {
    category: string;
    childAddable?: boolean;
    displayName: string;
    status: string;
  };
  isDroppable?: boolean;
  isDraggable?: boolean;
  children: React.ReactNode;
  componentStyle?: object;
  onClick?: (e: React.MouseEvent) => void;
}

const SortableItem = ({
  id,
  isDraggable = true,
  isDroppable = true,
  componentStyle,
  data,
  children,
  onClick,
}: SortableItemProps) => {
  const intl = useIntl();
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
    setActivatorNodeRef,
  } = useSortable({
    id,
    data,
    disabled: {
      draggable: !isDraggable,
      droppable: !isDroppable,
    },
    animateLayoutChanges: () => false,
  });

  const style = {
    position: 'relative',
    zIndex: isDragging ? 200 : undefined,
    transform: CSS.Translate.toString(transform),
    transition,
    ...componentStyle,
  };

  return (
    <Row
      ref={setNodeRef}
      tabIndex={onClick ? 0 : -1}
      style={style}
      className={`mx-0 outline-sortable-item${isDragging ? ' outline-sortable-item--dragging' : ''}`}
      onClick={onClick}
      onKeyDown={(e) => {
        if (!onClick) { return; }

        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          onClick(e);
        }
      }}
    >
      <Col className="extend-margin px-0">
        {children}
      </Col>
      {isDraggable && (
        <button
          ref={setActivatorNodeRef}
          key="drag-to-reorder-icon"
          aria-label={intl.formatMessage(messages.tooltipContent)}
          className="btn-icon btn-icon-secondary btn-icon-md outline-sortable-item__drag-btn"
          type="button"
          {...attributes}
          {...listeners}
        >
          <span className="btn-icon__icon-container">
            <Icon src={DragIndicator} />
          </span>
        </button>
      )}
    </Row>
  );
};

export default SortableItem;

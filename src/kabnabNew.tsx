import React, { useState } from 'react';
import {
  DndContext,
  DragOverlay,
  closestCorners,
  PointerSensor,
  useSensor,
  useSensors,
  rectSortingStrategy,
  useDroppable,
} from '@dnd-kit/core';
import {
  SortableContext,
  arrayMove,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable';
import SortableItem from './SortableItem';
import { Resizable } from 'react-resizable';
import 'react-resizable/css/styles.css';

const initialData = {
  columns: {
    todo: { id: 'todo', title: 'To Do', items: [{ id: '1', content: 'Task 1' }] },
    inprogress: { id: 'inprogress', title: 'In Progress', items: [{ id: '2', content: 'Task 2' }] },
    review: { id: 'review', title: 'Review', items: [] },
    done: { id: 'done', title: 'Done', items: [] },
  },
};

const Draggable = ({ id, attributes, listeners, children, onEdit, onDelete }) => {
  const [height, setHeight] = useState(100);

  const handleResize = (event, { size }) => {
    setHeight(size.height);
  };

  return (
    <Resizable
      height={height}
      width={200} // Fixed width
      axis="y" // Allow vertical resizing only
      onResize={handleResize}
      minConstraints={[200, 50]} // Minimum width and height
      maxConstraints={[200, Infinity]} // Maximum width fixed
    >
      <div
        style={{
          height: `${height}px`,
          padding: '8px',
          border: '1px solid #555',
          marginBottom: '4px',
          background: '#3C3C3C',
          color: '#f0f0f0',
          cursor: 'default',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
        }}
      >
        <div {...attributes} {...listeners} style={{ cursor: 'grab' }}>
          &#x2630;
        </div>
        <div style={{ flexGrow: 1, marginLeft: '8px' }}>
          {children}
        </div>
        <button onClick={() => onEdit(id)} style={{ marginRight: '4px', background: 'none', border: 'none', color: '#f0f0f0', cursor: 'pointer' }}>
          ✏️
        </button>
        <button onClick={() => onDelete(id)} style={{ background: 'none', border: 'none', color: '#f0f0f0', cursor: 'pointer' }}>
          🗑️
        </button>
      </div>
    </Resizable>
  );
};

const DroppableContainer = ({ id, children }) => {
  const { isOver, setNodeRef } = useDroppable({ id });

  return (
    <div
      ref={setNodeRef}
      style={{
        minHeight: '100px',
        background: isOver ? '#555555' : '#2C2C2C',
        padding: '8px',
        color: '#f0f0f0',
        flexGrow: 1,
      }}
    >
      {children}
    </div>
  );
};

const KanbanBoard = () => {
  const [columns, setColumns] = useState(initialData.columns);
  const [activeId, setActiveId] = useState(null);
  const [activeItem, setActiveItem] = useState(null);
  const [isEditing, setIsEditing] = useState(null);
  const [editContent, setEditContent] = useState('');

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 5,
      },
    })
  );

  const findContainer = (id) => {
    if (id in columns) return id;
    return Object.keys(columns).find(key =>
      columns[key].items.some(item => item.id === id)
    );
  };

  const findItemById = (id) => {
    for (const column of Object.values(columns)) {
      const item = column.items.find(item => item.id === id);
      if (item) return item;
    }
    return null;
  };

  const onDragStart = (event) => {
    const { active } = event;
    setActiveId(active.id);
    setActiveItem(findItemById(active.id));
  };

  const onDragOver = (event) => {
    const { active, over } = event;
    if (!over) return;

    const activeContainer = findContainer(active.id);
    const overContainer = findContainer(over.id);

    if (!activeContainer || !overContainer || activeContainer === overContainer) {
      return;
    }

    setColumns((prevColumns) => {
      const activeItems = [...prevColumns[activeContainer].items];
      const overItems = [...prevColumns[overContainer].items];

      const activeIndex = activeItems.findIndex(item => item.id === active.id);
      const [movedItem] = activeItems.splice(activeIndex, 1);

      overItems.splice(overItems.length, 0, movedItem);

      return {
        ...prevColumns,
        [activeContainer]: {
          ...prevColumns[activeContainer],
          items: activeItems,
        },
        [overContainer]: {
          ...prevColumns[overContainer],
          items: overItems,
        },
      };
    });
  };

  const onDragEnd = (event) => {
    const { active, over } = event;
    setActiveId(null);
    setActiveItem(null);
    if (!over) return;

    const activeContainer = findContainer(active.id);
    const overContainer = over.id in columns ? over.id : findContainer(over.id);

    if (!activeContainer || !overContainer) return;

    if (activeContainer !== overContainer) {
      return;
    }

    const activeIndex = columns[activeContainer].items.findIndex(item => item.id === active.id);
    const overIndex = columns[overContainer].items.findIndex(item => item.id === over.id);

    if (activeIndex !== overIndex) {
      setColumns(prevColumns => ({
        ...prevColumns,
        [activeContainer]: {
          ...prevColumns[activeContainer],
          items: arrayMove(prevColumns[activeContainer].items, activeIndex, overIndex),
        },
      }));
    }
  };

  const addCard = (columnId) => {
    const newId = Date.now().toString();
    const newItem = { id: newId, content: `Task ${newId}`, subItems: [] };
    setColumns({
      ...columns,
      [columnId]: {
        ...columns[columnId],
        items: [...columns[columnId].items, newItem],
      },
    });
    console.log('Added', newItem, 'to', columnId);
  };

  const deleteCard = (cardId) => {
    const updatedColumns = { ...columns };
    Object.values(updatedColumns).forEach(column => {
      column.items = column.items.filter(item => item.id !== cardId);
    });
    setColumns(updatedColumns);
  };

  const editCard = (cardId) => {
    const item = Object.values(columns).flatMap(col => col.items).find(i => i.id === cardId);
    if (item) {
      setIsEditing(cardId);
      setEditContent(item.content);
    }
  };

  const saveEdit = (cardId) => {
    const updatedColumns = { ...columns };
    Object.values(updatedColumns).forEach(column => {
      column.items = column.items.map(item => item.id === cardId ? { ...item, content: editContent } : item);
    });
    setColumns(updatedColumns);
    setIsEditing(null);
    setEditContent('');
  };

  return (
    <DndContext
      sensors={sensors}
      collisionDetection={closestCorners}
      onDragStart={onDragStart}
      onDragOver={onDragOver}
      onDragEnd={onDragEnd}
    >
      <div style={{ display: 'flex', gap: '16px', padding: '16px', background: '#1E1E1E', color: '#f0f0f0' }}>
        {Object.values(columns).map(column => (
          <DroppableContainer key={column.id} id={column.id}>
            <div
              style={{
                flex: 1,
                border: '1px solid #555',
                background: '#2C2C2C',
                display: 'flex',
                flexDirection: 'column',
                padding: '8px',
                borderRadius: '8px',
                boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1)',
              }}
            >
              <h3 style={{ textAlign: 'center', color: '#f0f0f0' }}>{column.title}</h3>
              <SortableContext
                items={column.items.map(item => item.id)}
                strategy={verticalListSortingStrategy}
              >
                <div style={{ minHeight: '50px' }}>
                  {column.items.length > 0 ? (
                    column.items.map(item => (
                      isEditing === item.id ? (
                        <div key={item.id} style={{ marginBottom: '4px' }}>
                          <input
                            type="text"
                            value={editContent}
                            onChange={(e) => setEditContent(e.target.value)}
                            style={{
                              width: '80%',
                              padding: '6px',
                              borderRadius: '4px',
                              border: '1px solid #555',
                              background: '#3C3C3C',
                              color: '#f0f0f0',
                            }}
                          />
                          <button
                            onClick={() => saveEdit(item.id)}
                            style={{
                              padding: '6px',
                              marginLeft: '4px',
                              borderRadius: '4px',
                              border: 'none',
                              background: '#555555',
                              color: '#f0f0f0',
                              cursor: 'pointer',
                            }}
                          >
                            Save
                          </button>
                        </div>
                      ) : (
                        <SortableItem key={item.id} id={item.id}>
                          <Draggable id={item.id} onEdit={editCard} onDelete={deleteCard}>
                            {item.content}
                          </Draggable>
                        </SortableItem>
                      )
                    ))
                  ) : (
                    <div style={{ padding: '8px', color: '#888' }}>
                      No items
                    </div>
                  )}
                </div>
              </SortableContext>
              <button
                onClick={() => addCard(column.id)}
                style={{
                  margin: '8px',
                  background: '#555555',
                  color: '#f0f0f0',
                  border: 'none',
                  padding: '8px',
                  cursor: 'pointer',
                  borderRadius: '4px',
                }}
              >
                Add Card
              </button>
            </div>
          </DroppableContainer>
        ))}
      </div>
      <DragOverlay>
        {activeItem ? (
          <Draggable id={activeItem.id}>
            {activeItem.content}
          </Draggable>
        ) : null}
      </DragOverlay>
    </DndContext>
  );
};

export default KanbanBoard;
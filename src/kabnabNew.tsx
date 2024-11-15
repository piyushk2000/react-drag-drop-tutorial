import React, { useState } from 'react';
import {
  DndContext,
  DragOverlay,
  closestCorners,
  PointerSensor,
  useSensor,
  useSensors,
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
import { v4 as uuidv4 } from 'uuid';

// Define TypeScript interfaces
interface Item {
  id: string;
  content: string;
  subItems?: Item[];
}

interface Column {
  id: string;
  title: string;
  items: Item[];
}

interface Columns {
  [key: string]: Column;
}

interface DraggableProps {
  id: string;
  attributes?: any;
  listeners?: any;
  children?: React.ReactNode;
  onEdit?: (id: string) => void;
  onDelete?: (id: string) => void;
}

interface DroppableContainerProps {
  id: string;
  children: React.ReactNode;
  style?: React.CSSProperties;
}

const initialData: { columns: Columns } = {
  columns: {
    vendor: { id: 'vendor', title: 'Vendor', items: [{ id: '1', content: 'Task 1' }] },
    support: { id: 'support', title: 'Support', items: [{ id: '2', content: 'Task 2' }] },
    core: { id: 'core', title: 'Core', items: [] },
    client: { id: 'client', title: 'Client', items: [] },
  },
};

const Draggable: React.FC<DraggableProps> = ({ id, attributes, listeners, children, onEdit, onDelete }) => {
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

const DroppableContainer: React.FC<DroppableContainerProps> = ({ id, children, style }) => {
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
        ...style, // Allow additional styles
      }}
    >
      {children}
    </div>
  );
};

const KanbanBoard: React.FC = () => {
  const [columns, setColumns] = useState<Columns>(initialData.columns);
  const [activeId, setActiveId] = useState<string | null>(null);
  const [activeItem, setActiveItem] = useState<Item | null>(null);
  const [isEditing, setIsEditing] = useState<string | null>(null); // Ensure only one edit at a time
  const [editContent, setEditContent] = useState<string>('');

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 5,
      },
    })
  );

  const findContainer = (id: string) => {
    if (id in columns) return id;
    return Object.keys(columns).find(key =>
      columns[key].items.some(item => item.id === id)
    );
  };

  const findItemById = (id: string) => {
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
    console.log(`Dragging over column: ${over?.id}`);
  };

  const onDragEnd = (event) => {
    const { active, over } = event;
    console.log(`Drag ended for item: ${active.id} over: ${over?.id}`);
    setActiveId(null);
    setActiveItem(null);
    if (!over) {
      console.log('Item was dropped outside any container.');
      return;
    }

    const activeContainer = findContainer(active.id);
    const overContainer = over.id in columns ? over.id : findContainer(over.id);

    if (!activeContainer || !overContainer) {
      console.log('Could not determine containers.');
      return;
    }

    if (activeContainer !== overContainer) {
      console.log(`Moved item ${active.id} from ${activeContainer} to ${overContainer}`);
      return;
    }

    const activeIndex = columns[activeContainer].items.findIndex(item => item.id === active.id);
    const overIndex = columns[overContainer].items.findIndex(item => item.id === over.id);

    if (activeIndex !== overIndex && overIndex !== -1) {
      setColumns(prevColumns => ({
        ...prevColumns,
        [activeContainer]: {
          ...prevColumns[activeContainer],
          items: arrayMove(prevColumns[activeContainer].items, activeIndex, overIndex),
        },
      }));
      console.log(`Changed order of item ${active.id} within ${activeContainer} from index ${activeIndex} to ${overIndex}`);
    } else {
      console.log('Item dropped in the same position.');
    }
  };

  const addCard = (columnId: string) => {
    const newId = uuidv4(); // Use UUID for unique IDs
    const newItem: Item = { id: newId, content: `Task ${newId}`, subItems: [] };
    setColumns({
      ...columns,
      [columnId]: {
        ...columns[columnId],
        items: [...columns[columnId].items, newItem],
      },
    });
    console.log('Added', newItem, 'to', columnId);
  };

  const deleteCard = (cardId: string) => {
    const updatedColumns = { ...columns };
    Object.values(updatedColumns).forEach(column => {
      column.items = column.items.filter(item => item.id !== cardId);
    });
    setColumns(updatedColumns);
  };

  const editCard = (cardId: string) => {
    const item = Object.values(columns).flatMap(col => col.items).find(i => i.id === cardId);
    if (item) {
      setIsEditing(cardId);
      setEditContent(item.content);
    }
  };

  const saveEdit = (cardId: string) => {
    if (editContent.trim() === '') {
      alert('Content cannot be empty.');
      return;
    }
    const updatedColumns: Columns = { ...columns };
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
      <div 
        style={{ 
          padding: '16px', 
          background: '#1E1E1E', 
          color: '#f0f0f0',
          display: 'flex',
          flexDirection: 'row',
          gap: '16px',
        }}
      >
        <DroppableContainer id="vendor" style={{ flex: 1 }}>
          <div
            style={{
              width: '100%',
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
            <h3 style={{ textAlign: 'center', color: '#f0f0f0' }}>Vendor</h3>
            <SortableContext
              items={columns.vendor.items.map(item => item.id)}
              strategy={verticalListSortingStrategy}
            >
              <div style={{ minHeight: '50px' }}>
                {columns.vendor.items.length > 0 ? (
                  columns.vendor.items.map(item => (
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
              onClick={() => addCard('vendor')}
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

        <div 
          style={{ 
            display: 'flex', 
            flexDirection: 'column',
            flex: 2, // Set middle column to 50%
            gap: '16px',
          }}
        >
          <DroppableContainer id="support">
            <div
              style={{
                width: '100%',
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
              <h3 style={{ textAlign: 'center', color: '#f0f0f0' }}>Support</h3>
              <SortableContext
                items={columns.support.items.map(item => item.id)}
                strategy={verticalListSortingStrategy}
              >
                <div style={{ minHeight: '50px' }}>
                  {columns.support.items.length > 0 ? (
                    columns.support.items.map(item => (
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
                onClick={() => addCard('support')}
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

          <DroppableContainer id="core">
            <div
              style={{
                width: '100%',
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
              <h3 style={{ textAlign: 'center', color: '#f0f0f0' }}>Core</h3>
              <SortableContext
                items={columns.core.items.map(item => item.id)}
                strategy={verticalListSortingStrategy}
              >
                <div style={{ minHeight: '50px' }}>
                  {columns.core.items.length > 0 ? (
                    columns.core.items.map(item => (
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
                onClick={() => addCard('core')}
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
        </div>

        <DroppableContainer id="client" style={{ flex: 1 }}>
          <div
            style={{
              width: '100%',
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
            <h3 style={{ textAlign: 'center', color: '#f0f0f0' }}>Client</h3>
            <SortableContext
              items={columns.client.items.map(item => item.id)}
              strategy={verticalListSortingStrategy}
            >
              <div style={{ minHeight: '50px' }}>
                {columns.client.items.length > 0 ? (
                  columns.client.items.map(item => (
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
              onClick={() => addCard('client')}
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
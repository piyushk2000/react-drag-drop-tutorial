import React, { useState } from 'react';
import { DndContext, useDraggable, useDroppable } from '@dnd-kit/core';
import { Responsive, WidthProvider } from 'react-grid-layout';
import 'react-grid-layout/css/styles.css';
import 'react-resizable/css/styles.css';

const ResponsiveGridLayout = WidthProvider(Responsive);

const initialData = {
  columns: {
    todo: { id: 'todo', title: 'To Do', items: [{ id: '1', content: 'Task 1' }] },
    inprogress: { id: 'inprogress', title: 'In Progress', items: [{ id: '2', content: 'Task 2' }] },
  },
};

const Draggable = ({ id, children }) => {
  const { attributes, listeners, setNodeRef } = useDraggable({ id });
  return (
    <div
      ref={setNodeRef}
      {...listeners}
      {...attributes}
      style={{
        padding: '8px',
        border: '1px solid #555', // Updated border color
        marginBottom: '4px',
        background: '#3C3C3C', // Darker card background
        color: '#f0f0f0', // Light text color
        cursor: 'grab',
      }}
    >
      {children}
    </div>
  );
};

const Droppable = ({ id, children }) => {
  const { isOver, setNodeRef } = useDroppable({ id });
  return (
    <div
      ref={setNodeRef}
      style={{
        minHeight: '100px',
        background: isOver ? '#555555' : '#2C2C2C', // Dark backgrounds
        padding: '8px',
        color: '#f0f0f0', // Light text color
      }}
    >
      {children}
    </div>
  );
};

const KanbanBoard = () => {
  const [data, setData] = useState(initialData);

  const onDragEnd = (event) => {
    const { active, over } = event;
    if (!over) return;
    if (active.id !== over.id) {
      const sourceColumn = Object.values(data.columns).find(col => col.items.find(item => item.id === active.id));
      const targetColumn = data.columns[over.id] ? data.columns[over.id] : null;
      if (sourceColumn && targetColumn) {
        const item = sourceColumn.items.find(i => i.id === active.id);
        sourceColumn.items = sourceColumn.items.filter(i => i.id !== active.id);
        targetColumn.items = [...targetColumn.items, item];
        setData({ ...data });
        console.log('Moved', item, 'to', targetColumn.id);
      }
    }
  };

  const addCard = (columnId) => {
    const newId = Date.now().toString();
    const newItem = { id: newId, content: `Task ${newId}` };
    data.columns[columnId].items.push(newItem);
    setData({ ...data });
    console.log('Added', newItem, 'to', columnId);
  };

  const layout = Object.keys(data.columns).map((key, index) => ({
    i: key,
    x: index * 3,
    y: 0,
    w: 3,
    h: 10,
    minW: 2,
    minH: 5,
  }));

  return (
    <DndContext onDragEnd={onDragEnd}>
      <ResponsiveGridLayout
        className="layout"
        layouts={{ lg: layout }}
        draggableHandle=".drag-handle"
        breakpoints={{ lg: 1200, md: 996, sm: 768 }}
        cols={{ lg: 12, md: 10, sm: 6 }}
        rowHeight={30}
        onLayoutChange={() => console.log('Layout updated')}
        style={{ background: '#1E1E1E', color: '#f0f0f0' }} // Dark board background and light text
      >
        {Object.values(data.columns).map(column => (
          <div
            key={column.id}
            style={{
              border: '1px solid #555', // Updated border color
              background: '#2C2C2C', // Dark column background
              display: 'flex',
              flexDirection: 'column',
            }}
          >
            <div
              className="drag-handle"
              style={{
                cursor: 'grab',
                display: 'flex',
                justifyContent: 'flex-end',
                padding: '4px',
                background: '#3C3C3C', // Dark handle background
                color: '#f0f0f0', // Light handle icon
              }}
            >
              &#x2630;
            </div>
            <h3 style={{ textAlign: 'center', color: '#f0f0f0' }}> {/* Light text color */}
              {column.title}
            </h3>
            <Droppable id={column.id}>
              {column.items.map(item => (
                <Draggable key={item.id} id={item.id}>
                  {item.content}
                </Draggable>
              ))}
            </Droppable>
            <button
              onClick={() => addCard(column.id)}
              style={{
                margin: '8px',
                background: '#555555', // Dark button background
                color: '#f0f0f0', // Light button text
                border: 'none',
                padding: '8px',
                cursor: 'pointer',
              }}
            >
              Add Card
            </button>
          </div>
        ))}
      </ResponsiveGridLayout>
    </DndContext>
  );
};

export default KanbanBoard;
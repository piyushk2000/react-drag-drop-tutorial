import React, { useState } from 'react';
import { DndContext, useDraggable, useDroppable, DragOverlay } from '@dnd-kit/core';
import { Responsive, WidthProvider } from 'react-grid-layout';
import 'react-grid-layout/css/styles.css';
import 'react-resizable/css/styles.css';
import { SortableContext, verticalListSortingStrategy, arrayMove } from '@dnd-kit/sortable';
import SortableItem from './SortableItem'; // Ensure this import exists

const ResponsiveGridLayout = WidthProvider(Responsive);

const initialData = {
  columns: {
    todo: { id: 'todo', title: 'To Do', items: [{ id: '1', content: 'Task 1' }] },
    inprogress: { id: 'inprogress', title: 'In Progress', items: [{ id: '2', content: 'Task 2' }] },
  },
};

const Draggable = ({ id, children, onEdit, onDelete }) => {
  const { attributes, listeners, setNodeRef, isDragging } = useDraggable({ id });

  return (
    <div
      ref={setNodeRef}
      style={{
        padding: '8px',
        border: '1px solid #555',
        marginBottom: '4px',
        background: '#3C3C3C',
        color: '#f0f0f0',
        cursor: isDragging ? 'grabbing' : 'default',
        opacity: isDragging ? 0.5 : 1,
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
      }}
    >
      <div>
        <div {...listeners} {...attributes} style={{ cursor: 'grab' }}>
        &#x2630;
      </div>

      </div>
      
      <div style={{ flexGrow: 1, marginLeft: '8px' }}>
        {children}
      </div>
      {/* <div onMouseDown={(e) => e.stopPropagation()}> */}
        <button onClick={() => onEdit(id)} style={{ marginRight: '4px', background: 'none', border: 'none', color: '#f0f0f0', cursor: 'pointer' }}>
          ✏️
        </button>
        <button onClick={() => onDelete(id)} style={{ background: 'none', border: 'none', color: '#f0f0f0', cursor: 'pointer' }}>
          🗑️
        </button>
      {/* </div> */}
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
  const [data, setData] = useState(initialData);
  const [activeId, setActiveId] = useState(null);
  const [isEditing, setIsEditing] = useState(null);
  const [editContent, setEditContent] = useState('');
  const [columns, setColumns] = useState(initialData.columns);

  const onDragStart = (event) => {
    setActiveId(event.active.id);
  };

  const onDragEnd = (event) => {
    const { active, over } = event;
    setActiveId(null);
    if (!over) return;

    const activeColumn = Object.keys(columns).find(col =>
      columns[col].items.find(item => item.id === active.id)
    );

    const overColumnId = over.id;
    const overColumn = Object.keys(columns).find(col => col === overColumnId || columns[col].items.find(item => item.id === overColumnId));

    if (activeColumn && overColumn) {
      if (activeColumn !== overColumn) {
        const activeItem = columns[activeColumn].items.find(item => item.id === active.id);
        setColumns({
          ...columns,
          [activeColumn]: {
            ...columns[activeColumn],
            items: columns[activeColumn].items.filter(item => item.id !== active.id),
          },
          [overColumn]: {
            ...columns[overColumn],
            items: overColumnId ? [...columns[overColumn].items, activeItem] : [...columns[overColumn].items, activeItem],
          },
        });
      } else {
        const oldIndex = columns[activeColumn].items.findIndex(item => item.id === active.id);
        const newIndex = overColumnId ? columns[overColumn].items.findIndex(item => item.id === overColumnId) : columns[overColumn].items.length;
        const newItems = arrayMove(columns[activeColumn].items, oldIndex, newIndex);
        setColumns({
          ...columns,
          [activeColumn]: {
            ...columns[activeColumn],
            items: newItems,
          },
        });
      }
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

  const addColumn = () => {
    const newId = `column-${Date.now()}`;
    const newColumn = { id: newId, title: `New Column`, items: [] };
    setColumns({ ...columns, [newId]: newColumn });
  };

  const layout = Object.keys(columns).map((key, index) => ({
    i: key,
    x: index * 3,
    y: 0,
    w: 3,
    h: 10,
    minW: 2,
    minH: 5,
  }));

  return (
    <DndContext onDragEnd={onDragEnd} onDragStart={onDragStart}>
      <ResponsiveGridLayout
        className="layout"
        layouts={{ lg: layout }}
        draggableHandle=".drag-handle"
        breakpoints={{ lg: 1200, md: 996, sm: 768 }}
        cols={{ lg: 12, md: 10, sm: 6 }}
        rowHeight={30}
        onLayoutChange={() => console.log('Layout updated')}
        style={{ background: '#1E1E1E', color: '#f0f0f0' }}
      >
        {Object.values(columns).map(column => (
          <div
            key={column.id}
            style={{
              border: '1px solid #555',
              background: '#2C2C2C',
              display: 'flex',
              flexDirection: 'column',
              padding: '8px',
              borderRadius: '8px', // Rounded corners
              boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1)', // Shadow for depth
            }}
          >
            <div
              className="drag-handle"
              style={{
                cursor: 'grab',
                display: 'flex',
                justifyContent: 'flex-end',
                padding: '4px',
                background: '#3C3C3C',
                color: '#f0f0f0',
              }}
            >
              &#x2630;
            </div>
            <h3 style={{ textAlign: 'center', color: '#f0f0f0' }}>
              {column.title}
            </h3>
            <SortableContext
              items={column.items.map(item => item.id)}
              strategy={verticalListSortingStrategy}
            >
              <Droppable id={column.id}>
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
                  <div style={{ minHeight: '50px' }}></div> // Allow dropping on empty column
                )}
              </Droppable>
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
                transition: 'background 0.3s',
              }}
              onMouseOver={(e) => e.currentTarget.style.background = '#666666'}
              onMouseOut={(e) => e.currentTarget.style.background = '#555555'}
            >
              Add Card
            </button>
          </div>
        ))}
        <div
          key="add-column"
          style={{
            border: '2px dashed #555',
            background: '#2C2C2C',
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center',
            padding: '16px',
            cursor: 'pointer',
            borderRadius: '8px',
            transition: 'background 0.3s',
          }}
          onMouseOver={(e) => e.currentTarget.style.background = '#3C3C3C'}
          onMouseOut={(e) => e.currentTarget.style.background = '#2C2C2C'}
          onClick={addColumn}
        >
          + Add Column
        </div>
      </ResponsiveGridLayout>
      <DragOverlay>
        {activeId ? (
          <div
            style={{
              padding: '8px',
              border: '1px solid #555',
              background: '#3C3C3C',
              color: '#f0f0f0',
              cursor: 'grab',
              borderRadius: '4px',
              boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1)',
            }}
          >
            {columns[Object.keys(columns).find(col => 
              columns[col].items.find(item => item.id === activeId)
            )]?.items.find(item => item.id === activeId)?.content}
          </div>
        ) : null}
      </DragOverlay>
    </DndContext>
  );
};

export default KanbanBoard;
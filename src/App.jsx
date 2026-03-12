import React, { useState, useEffect } from 'react';
import { 
  DndContext, 
  TouchSensor, 
  MouseSensor, 
  useSensor, 
  useSensors, 
  closestCorners,
  DragOverlay,
  defaultDropAnimationSideEffects
} from '@dnd-kit/core';
import { 
  arrayMove, 
  SortableContext, 
  verticalListSortingStrategy, 
  useSortable 
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';

// --- 1. THE DRAGGABLE CARD COMPONENT ---
function SortableTask({ id, task, col, isDarkMode, getDotColor, deleteTask }) {
  const { 
    attributes, 
    listeners, 
    setNodeRef, 
    transform, 
    transition, 
    isDragging 
  } = useSortable({ id, data: { task, col } });

  const style = {
    transform: CSS.Translate.toString(transform),
    transition,
    opacity: isDragging ? 0.3 : 1,
    backgroundColor: isDarkMode ? '#1e293b' : 'white',
    padding: '22px',
    borderRadius: '20px',
    marginBottom: '15px',
    boxShadow: isDragging ? '0 20px 40px rgba(0,0,0,0.3)' : '0 4px 12px rgba(0,0,0,0.05)',
    border: isDarkMode ? '1px solid rgba(255,255,255,0.05)' : 'none',
    cursor: 'grab',
    touchAction: 'none', // STOPS PHONE FROM SCROLLING WHILE DRAGGING
  };

  return (
    <div ref={setNodeRef} style={style} {...attributes} {...listeners}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <span style={{ fontSize: '1.2rem', color: '#94a3b8' }}>⠿</span>
          <div style={{ width: '10px', height: '10px', borderRadius: '50%', backgroundColor: getDotColor(task.priority) }}></div>
          <span style={{ fontSize: '10px', fontWeight: '800', color: '#9ca3af' }}>{task.priority.toUpperCase()}</span>
        </div>
        <button 
            onPointerDown={(e) => e.stopPropagation()} // Prevents drag when clicking delete
            onClick={() => deleteTask(col, task.id)} 
            style={{ background: 'none', border: 'none', color: '#ef4444', cursor: 'pointer' }}
        >
            ×
        </button>
      </div>
      <h3 style={{ margin: '0 0 6px 0', fontSize: '1.1rem', color: isDarkMode ? '#f1f5f9' : '#1f2937', fontWeight: '800' }}>{task.title}</h3>
      <p style={{ margin: 0, fontSize: '0.85rem', color: '#94a3b8' }}>{task.description}</p>
    </div>
  );
}

// --- 2. THE MAIN APP ---
export default function App() {
  const [isDarkMode, setIsDarkMode] = useState(() => JSON.parse(localStorage.getItem('kanban-theme')) || false);
  const [tasks, setTasks] = useState(() => JSON.parse(localStorage.getItem('kanban-tasks')) || { todo: [], inProgress: [], done: [] });
  const [showModal, setShowModal] = useState(false);
  const [newTask, setNewTask] = useState({ title: '', description: '', priority: 'low' });

  // SENSORS: Enables Mouse on PC and Touch on Phone
  const sensors = useSensors(
    useSensor(MouseSensor),
    useSensor(TouchSensor, {
      activationConstraint: { delay: 200, tolerance: 5 }, // Long-press (200ms) to start drag on mobile
    })
  );

  useEffect(() => {
    localStorage.setItem('kanban-theme', JSON.stringify(isDarkMode));
    localStorage.setItem('kanban-tasks', JSON.stringify(tasks));
  }, [isDarkMode, tasks]);

  const progress = Math.round(((tasks.done.length) / (tasks.todo.length + tasks.inProgress.length + tasks.done.length || 1)) * 100);

  const getDotColor = (p) => p === 'high' ? '#ef4444' : p === 'medium' ? '#f59e0b' : '#22c55e';

  const handleDragEnd = (event) => {
    const { active, over } = event;
    if (!over) return;

    const activeId = active.id;
    const overId = over.id;

    const activeContainer = active.data.current.col;
    const overContainer = over.id in tasks ? over.id : over.data.current.col;

    if (activeContainer !== overContainer) {
      setTasks((prev) => {
        const activeItems = prev[activeContainer];
        const overItems = prev[overContainer];
        const taskToMove = activeItems.find(t => t.id === activeId);

        return {
          ...prev,
          [activeContainer]: activeItems.filter(t => t.id !== activeId),
          [overContainer]: [...overItems, taskToMove]
        };
      });
    }
  };

  const addTask = (e) => {
    e.preventDefault();
    const id = Date.now().toString();
    setTasks({ ...tasks, todo: [...tasks.todo, { ...newTask, id }] });
    setShowModal(false);
  };

  return (
    <DndContext sensors={sensors} collisionDetection={closestCorners} onDragEnd={handleDragEnd}>
      <div style={{
        backgroundImage: isDarkMode ? 'url("/dark-mode-kanban.jpg")' : 'url("/light-mode-kanban.jpg")',
        backgroundSize: 'cover', backgroundAttachment: 'fixed', minHeight: '100vh',
        fontFamily: 'Inter, sans-serif', padding: '40px 20px', boxSizing: 'border-box'
      }}>
        
        {/* Progress Tracker */}
        <div style={{ position: 'fixed', top: '20px', left: '20px', backgroundColor: 'rgba(0,0,0,0.4)', backdropFilter: 'blur(10px)', padding: '15px', borderRadius: '20px', minWidth: '180px', zIndex: 1000, color: 'white', border: '1px solid rgba(255,255,255,0.1)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.8rem', fontWeight: 'bold', marginBottom: '8px' }}>
            <span>PROGRESS</span>
            <span>{progress}%</span>
          </div>
          <div style={{ width: '100%', height: '8px', backgroundColor: 'rgba(255,255,255,0.1)', borderRadius: '10px' }}>
            <div style={{ width: `${progress}%`, height: '100%', backgroundColor: '#2563eb', transition: 'width 0.5s ease', borderRadius: '10px' }} />
          </div>
        </div>

        <button onClick={() => setIsDarkMode(!isDarkMode)} style={{ position: 'fixed', top: '20px', right: '20px', padding: '10px', borderRadius: '50%', cursor: 'pointer', zIndex: 1000 }}>
          {isDarkMode ? '🌙' : '☀️'}
        </button>

        <header style={{ textAlign: 'center', marginBottom: '60px', marginTop: '60px' }}>
          <h1 style={{ fontSize: '3.5rem', fontWeight: '900', color: isDarkMode ? 'white' : '#1e293b' }}>Kanban Board</h1>
          <button onClick={() => setShowModal(true)} style={{ padding: '14px 30px', backgroundColor: '#2563eb', color: 'white', border: 'none', borderRadius: '12px', fontWeight: 'bold', cursor: 'pointer' }}>+ Add New Task</button>
        </header>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '30px', maxWidth: '1200px', margin: '0 auto' }}>
          {['todo', 'inProgress', 'done'].map((col) => (
            <div key={col} style={{ backgroundColor: isDarkMode ? 'rgba(15,23,42,0.8)' : 'rgba(255,255,255,0.4)', backdropFilter: 'blur(20px)', padding: '25px', borderRadius: '32px', minHeight: '500px' }}>
              <h2 style={{ textAlign: 'center', fontSize: '0.8rem', color: isDarkMode ? '#94a3b8' : '#475569', marginBottom: '25px' }}>{col.toUpperCase()}</h2>
              
              <SortableContext id={col} items={tasks[col].map(t => t.id)} strategy={verticalListSortingStrategy}>
                <div style={{ minHeight: '400px' }}>
                    {tasks[col].map((task) => (
                    <SortableTask 
                        key={task.id} 
                        id={task.id} 
                        task={task} 
                        col={col} 
                        isDarkMode={isDarkMode} 
                        getDotColor={getDotColor} 
                        deleteTask={(col, id) => setTasks({...tasks, [col]: tasks[col].filter(t => t.id !== id)})} 
                    />
                    ))}
                </div>
              </SortableContext>
            </div>
          ))}
        </div>

        {showModal && (
          <div style={{ position: 'fixed', top: 0, left: 0, width: '100%', height: '100%', backgroundColor: 'rgba(0,0,0,0.8)', display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 2000 }}>
            <div style={{ backgroundColor: isDarkMode ? '#1e293b' : 'white', padding: '30px', borderRadius: '25px', width: '380px' }}>
               <form onSubmit={addTask}>
                  <input type="text" placeholder="Title" required style={{ width: '100%', padding: '12px', marginBottom: '15px' }} onChange={e => setNewTask({...newTask, title: e.target.value})} />
                  <textarea placeholder="Description" style={{ width: '100%', padding: '12px', marginBottom: '15px' }} onChange={e => setNewTask({...newTask, description: e.target.value})} />
                  <button type="submit" style={{ width: '100%', padding: '12px', backgroundColor: '#2563eb', color: 'white', border: 'none', borderRadius: '10px' }}>Save Task</button>
                  <button type="button" onClick={() => setShowModal(false)} style={{ width: '100%', marginTop: '10px', background: 'none', color: 'gray', border: 'none' }}>Cancel</button>
               </form>
            </div>
          </div>
        )}
      </div>
    </DndContext>
  );
}
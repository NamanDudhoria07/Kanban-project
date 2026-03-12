import React, { useState, useEffect, useRef } from 'react';

function App() {
  const [isDarkMode, setIsDarkMode] = useState(() => JSON.parse(localStorage.getItem('kanban-theme')) || false);
  const [tasks, setTasks] = useState(() => JSON.parse(localStorage.getItem('kanban-tasks')) || { todo: [], inProgress: [], done: [] });
  const [searchTerm, setSearchTerm] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [newTask, setNewTask] = useState({ title: '', description: '', priority: 'low' });
  
  // Dragging Refs
  const dragGhost = useRef(null);
  const dragData = useRef({ id: null, col: null, isDragging: false });
  const longPressTimer = useRef(null);

  const priorityWeight = { 'high': 3, 'medium': 2, 'low': 1 };
  const progress = Math.round((tasks.done.length / (tasks.todo.length + tasks.inProgress.length + tasks.done.length || 1)) * 100);

  useEffect(() => {
    localStorage.setItem('kanban-theme', JSON.stringify(isDarkMode));
    localStorage.setItem('kanban-tasks', JSON.stringify(tasks));
  }, [isDarkMode, tasks]);

  // --- SHARED MOVE LOGIC ---
  const moveTask = (taskId, sourceCol, destCol) => {
    if (sourceCol === destCol || !taskId) return;
    const taskToMove = tasks[sourceCol].find(t => t.id === taskId);
    if (!taskToMove) return;
    setTasks(prev => ({
      ...prev,
      [sourceCol]: prev[sourceCol].filter(t => t.id !== taskId),
      [destCol]: [...prev[destCol], taskToMove]
    }));
  };

  // --- MOBILE LONG PRESS LOGIC ---
  const onTouchStart = (e, task, col) => {
    const touch = e.touches[0];
    const target = e.currentTarget;

    // Start a timer for 300ms
    longPressTimer.current = setTimeout(() => {
      // 1. Give haptic feedback (vibrate)
      if (window.navigator.vibrate) window.navigator.vibrate(50);

      // 2. Activate Dragging
      dragData.current = { 
        id: task.id, 
        col: col, 
        isDragging: true,
        taskTitle: task.title 
      };

      // 3. Visual feedback
      target.style.transform = "scale(1.05) rotate(2deg)";
      target.style.boxShadow = "0 15px 30px rgba(0,0,0,0.2)";
    }, 300); // 300ms delay
  };

  const onTouchMove = (e) => {
    const touch = e.touches[0];

    // If they move their finger BEFORE the 300ms is up, cancel the timer (It's a scroll)
    if (!dragData.current.isDragging) {
      clearTimeout(longPressTimer.current);
      return;
    }

    // If dragging is active, move the ghost and stop scrolling
    e.preventDefault(); 
    if (dragGhost.current) {
      dragGhost.current.innerHTML = `<strong>${dragData.current.taskTitle}</strong>`;
      dragGhost.current.style.display = 'block';
      dragGhost.current.style.left = `${touch.clientX - 50}px`;
      dragGhost.current.style.top = `${touch.clientY - 20}px`;
    }
  };

  const onTouchEnd = (e) => {
    // Always clear timer on release
    clearTimeout(longPressTimer.current);

    if (dragData.current.isDragging) {
      const touch = e.changedTouches[0];
      if (dragGhost.current) dragGhost.current.style.display = 'none';

      const element = document.elementFromPoint(touch.clientX, touch.clientY);
      const column = element?.closest('.kanban-column');
      
      if (column) {
        const destCol = column.getAttribute('data-col');
        moveTask(dragData.current.id, dragData.current.col, destCol);
      }
    }

    // Reset styles
    e.currentTarget.style.transform = "scale(1)";
    e.currentTarget.style.boxShadow = "0 4px 12px rgba(0,0,0,0.05)";
    dragData.current = { id: null, isDragging: false };
  };

  return (
    <div style={{
      backgroundImage: isDarkMode ? 'url("/dark-mode-kanban.jpg")' : 'url("/light-mode-kanban.jpg")',
      backgroundSize: 'cover', backgroundAttachment: 'fixed', minHeight: '100vh',
      display: 'flex', flexDirection: 'column', alignItems: 'center',
      padding: '40px 20px', fontFamily: '"Inter", sans-serif'
    }}>
      <style>{`
        .task-card { 
            touch-action: auto; /* Browser handles scrolling normally */
            cursor: grab; 
            user-select: none;
            transition: transform 0.2s cubic-bezier(0.2, 0, 0.2, 1);
        }
        #drag-ghost {
          position: fixed; pointer-events: none; padding: 10px 20px;
          background: #2563eb; color: white; border-radius: 12px;
          box-shadow: 0 10px 20px rgba(0,0,0,0.3); z-index: 10000; display: none;
        }
      `}</style>

      <div id="drag-ghost" ref={dragGhost}></div>

      <div style={{ width: '100%', maxWidth: '1400px' }}>
        {/* Progress Tracker UI */}
        <div style={{
          position: 'fixed', top: '20px', left: '20px', zIndex: 100,
          backgroundColor: 'rgba(0,0,0,0.4)', backdropFilter: 'blur(10px)', padding: '15px', borderRadius: '20px', minWidth: '180px'
        }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', color: 'white', fontSize: '0.8rem' }}>
            <span>PROGRESS</span>
            <span>{progress}%</span>
          </div>
          <div style={{ width: '100%', height: '8px', backgroundColor: 'rgba(255,255,255,0.1)', borderRadius: '10px' }}>
            <div style={{ width: `${progress}%`, height: '100%', backgroundColor: '#2563eb', transition: 'width 0.8s ease' }}></div>
          </div>
        </div>

        <header style={{ textAlign: 'center', marginBottom: '40px', marginTop: '40px' }}>
          <h1 style={{ color: isDarkMode ? 'white' : '#1e293b' }}>Kanban Board</h1>
          <button onClick={() => setShowModal(true)} style={{ padding: '12px 30px', backgroundColor: '#2563eb', color: 'white', border: 'none', borderRadius: '12px' }}>+ Add Task</button>
        </header>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '30px' }}>
          {['todo', 'inProgress', 'done'].map((col) => (
            <div key={col} data-col={col} 
                 onDragOver={(e) => e.preventDefault()} 
                 onDrop={(e) => moveTask(e.dataTransfer.getData("taskId"), e.dataTransfer.getData("sourceCol"), col)}
                 className="kanban-column"
                 style={{ backgroundColor: 'rgba(255,255,255,0.1)', backdropFilter: 'blur(20px)', padding: '25px', borderRadius: '32px', minHeight: '500px' }}>
              
              <h2 style={{ textAlign: 'center', color: isDarkMode ? '#94a3b8' : '#475569' }}>{col.toUpperCase()}</h2>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
                {tasks[col]
                  .sort((a, b) => priorityWeight[b.priority] - priorityWeight[a.priority])
                  .map((task) => (
                  <div key={task.id} className="task-card"
                    draggable="true"
                    onDragStart={(e) => {
                        e.dataTransfer.setData("taskId", task.id);
                        e.dataTransfer.setData("sourceCol", col);
                    }}
                    onTouchStart={(e) => onTouchStart(e, task, col)}
                    onTouchMove={onTouchMove}
                    onTouchEnd={onTouchEnd}
                    style={{ backgroundColor: isDarkMode ? '#1e293b' : 'white', padding: '22px', borderRadius: '20px', boxShadow: '0 4px 12px rgba(0,0,0,0.05)' }}
                  >
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <span style={{ fontSize: '10px', fontWeight: '800', color: '#9ca3af' }}>{task.priority.toUpperCase()}</span>
                    </div>
                    <h3 style={{ margin: '5px 0', color: isDarkMode ? 'white' : 'black' }}>{task.title}</h3>
                    <p style={{ margin: 0, fontSize: '0.85rem', color: '#94a3b8' }}>{task.description}</p>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Basic Modal */}
      {showModal && (
        <div style={{ position: 'fixed', inset: 0, backgroundColor: 'rgba(0,0,0,0.7)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 }}>
          <div style={{ backgroundColor: isDarkMode ? '#1e293b' : 'white', padding: '30px', borderRadius: '20px' }}>
            <button onClick={() => {
                 setTasks({...tasks, todo: [...tasks.todo, {id: Date.now().toString(), title: "New Task", description: "Desc", priority: "low"}]});
                 setShowModal(false);
            }}>Quick Add Sample Task</button>
            <button onClick={() => setShowModal(false)}>Cancel</button>
          </div>
        </div>
      )}
    </div>
  );
}

export default App;
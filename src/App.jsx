import React, { useState, useEffect, useRef } from 'react';

function App() {
  const [isDarkMode, setIsDarkMode] = useState(() => JSON.parse(localStorage.getItem('kanban-theme')) || false);
  const [tasks, setTasks] = useState(() => JSON.parse(localStorage.getItem('kanban-tasks')) || { todo: [], inProgress: [], done: [] });
  const [searchTerm, setSearchTerm] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [isEditing, setIsEditing] = useState(null);
  const [newTask, setNewTask] = useState({ title: '', description: '', priority: 'low' });
  const [activeMenu, setActiveMenu] = useState(null);
  
  const menuRef = useRef(null);
  const dragGhost = useRef(null);
  const dragData = useRef({ id: null, col: null });

  // REFS FOR PRECISION TOUCH [SCROLL FIX]
  const longPressTimer = useRef(null);
  const isDragging = useRef(false);
  const touchStartPos = useRef({ x: 0, y: 0 });

  const priorityWeight = { 'high': 3, 'medium': 2, 'low': 1 };
  const totalTasks = tasks.todo.length + tasks.inProgress.length + tasks.done.length;
  const progress = totalTasks > 0 ? Math.round((tasks.done.length / totalTasks) * 100) : 0;

  useEffect(() => {
    localStorage.setItem('kanban-theme', JSON.stringify(isDarkMode));
    localStorage.setItem('kanban-tasks', JSON.stringify(tasks));
  }, [isDarkMode, tasks]);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (menuRef.current && !menuRef.current.contains(event.target)) setActiveMenu(null);
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // --- SHARED MOVEMENT LOGIC ---
  const moveTask = (taskId, sourceCol, destCol) => {
    if (!sourceCol || !destCol || sourceCol === destCol) return;
    const taskToMove = tasks[sourceCol].find(t => t.id === taskId);
    if (!taskToMove) return;

    setTasks(prev => ({
      ...prev,
      [sourceCol]: prev[sourceCol].filter(t => t.id !== taskId),
      [destCol]: [...prev[destCol], taskToMove]
    }));
  };

  // --- PC DRAG LOGIC ---
  const onDragStart = (e, taskId, sourceCol) => {
    e.dataTransfer.setData("taskId", taskId);
    e.dataTransfer.setData("sourceCol", sourceCol);
    e.currentTarget.style.opacity = '0.4';
  };
  const onDragEnd = (e) => { e.currentTarget.style.opacity = '1'; };
  const onDragOver = (e) => e.preventDefault();
  const onDrop = (e, destCol) => {
    const taskId = e.dataTransfer.getData("taskId");
    const sourceCol = e.dataTransfer.getData("sourceCol");
    moveTask(taskId, sourceCol, destCol);
  };

  // --- MOBILE TOUCH LOGIC (LONG-PRESS & SCROLL FIX) ---
  const onTouchStart = (e, task, col) => {
    if (e.target.closest('button')) return;
    const touch = e.touches[0];
    touchStartPos.current = { x: touch.clientX, y: touch.clientY };
    isDragging.current = false;

    longPressTimer.current = setTimeout(() => {
      isDragging.current = true;
      dragData.current = { id: task.id, col };
      if (dragGhost.current) {
        dragGhost.current.innerHTML = `<strong>${task.title}</strong>`;
        dragGhost.current.style.display = 'block';
        dragGhost.current.style.left = `${touch.clientX - 50}px`;
        dragGhost.current.style.top = `${touch.clientY - 20}px`;
      }
      if (window.navigator.vibrate) window.navigator.vibrate(40);
    }, 250); 
  };

  const onTouchMove = (e) => {
    const touch = e.touches[0];
    const dx = Math.abs(touch.clientX - touchStartPos.current.x);
    const dy = Math.abs(touch.clientY - touchStartPos.current.y);

    if (!isDragging.current) {
      if (dx > 10 || dy > 10) clearTimeout(longPressTimer.current);
      return; 
    }

    e.preventDefault(); 
    if (dragGhost.current) {
      dragGhost.current.style.left = `${touch.clientX - 50}px`;
      dragGhost.current.style.top = `${touch.clientY - 20}px`;
    }
  };

  const onTouchEnd = (e) => {
    clearTimeout(longPressTimer.current);
    if (!isDragging.current || !dragData.current.id) return;

    const touch = e.changedTouches[0];
    if (dragGhost.current) dragGhost.current.style.display = 'none';

    const element = document.elementFromPoint(touch.clientX, touch.clientY);
    const column = element?.closest('.kanban-column');
    
    if (column) {
      const destCol = column.getAttribute('data-col');
      moveTask(dragData.current.id, dragData.current.col, destCol);
    }
    
    isDragging.current = false;
    dragData.current = { id: null, col: null };
  };

  // --- UI HANDLERS ---
  const handleSaveTask = (e) => {
    e.preventDefault();
    if (!newTask.title) return;
    if (isEditing) {
      setTasks({...tasks, [isEditing.col]: tasks[isEditing.col].map(t => t.id === isEditing.taskId ? { ...t, ...newTask } : t)});
    } else {
      setTasks({...tasks, todo: [...tasks.todo, { ...newTask, id: Date.now().toString() }]});
    }
    setShowModal(false);
    setIsEditing(null);
  };

  const deleteTask = (col, id) => {
    if (window.confirm("Delete this task?")) {
      setTasks({ ...tasks, [col]: tasks[col].filter(t => t.id !== id) });
      setActiveMenu(null);
    }
  };

  return (
    <div style={{
      backgroundImage: isDarkMode ? 'url("/dark-mode-kanban.jpg")' : 'url("/light-mode-kanban.jpg")',
      backgroundSize: 'cover', backgroundAttachment: 'fixed', backgroundPosition: 'center', minHeight: '100vh',
      display: 'flex', flexDirection: 'column', alignItems: 'center',
      padding: '40px 20px', fontFamily: '"Inter", sans-serif', boxSizing: 'border-box', overflowX: 'hidden'
    }}>
      <style>{`
        .task-card { touch-action: auto; cursor: grab; user-select: none; }
        .progress-bar { transition: width 0.8s ease; }
        #drag-ghost {
          position: fixed; pointer-events: none; padding: 10px 20px;
          background: #2563eb; color: white; border-radius: 12px;
          box-shadow: 0 10px 20px rgba(0,0,0,0.3); z-index: 10000; display: none;
        }
      `}</style>

      <div id="drag-ghost" ref={dragGhost}></div>

      <div style={{ width: '100%', maxWidth: '1400px', position: 'relative' }}>
        
        {/* Progress Tracker Panel */}
        <div style={{
          position: 'absolute', top: '-15px', left: '10px',
          backgroundColor: isDarkMode ? 'rgba(255,255,255,0.08)' : 'rgba(255,255,255,0.4)',
          backdropFilter: 'blur(15px)', padding: '16px 24px', borderRadius: '22px', minWidth: '200px', zIndex: 5,
          border: '1px solid rgba(255,255,255,0.2)'
        }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
            <span style={{ fontSize: '0.8rem', fontWeight: '900', color: isDarkMode ? '#cbd5e1' : '#475569' }}>BOARD PROGRESS</span>
            <span style={{ fontSize: '1.1rem', fontWeight: '900', color: isDarkMode ? '#f1f5f9' : '#1e293b' }}>{progress}%</span>
          </div>
          <div style={{ width: '100%', height: '10px', backgroundColor: 'rgba(0,0,0,0.1)', borderRadius: '12px', overflow: 'hidden' }}>
            <div className="progress-bar" style={{ width: `${progress}%`, height: '100%', backgroundColor: progress === 100 ? '#22c55e' : '#2563eb' }}></div>
          </div>
        </div>

        <button onClick={() => setIsDarkMode(!isDarkMode)} style={{ position: 'absolute', top: '-10px', right: '10px', backgroundColor: isDarkMode ? 'rgba(255,255,255,0.1)' : 'white', border: 'none', borderRadius: '50%', width: '45px', height: '45px', cursor: 'pointer', zIndex: 10 }}>
          {isDarkMode ? '🌙' : '☀️'}
        </button>

        <header style={{ textAlign: 'center', marginBottom: '40px', paddingTop: '60px' }}>
          <h1 style={{ fontSize: 'clamp(2.2rem, 8vw, 3.8rem)', fontWeight: '900', color: isDarkMode ? '#f8fafc' : '#1f2937' }}>Kanban Board</h1>
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '15px' }}>
            <input type="text" placeholder="Search tasks..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} style={{ width: '90%', maxWidth: '450px', padding: '14px 24px', borderRadius: '18px', border: 'none', backgroundColor: isDarkMode ? 'rgba(255,255,255,0.12)' : 'rgba(255,255,255,0.45)', color: isDarkMode ? 'white' : '#1f2937', outline: 'none' }} />
            <button onClick={() => { setIsEditing(null); setNewTask({ title: '', description: '', priority: 'low' }); setShowModal(true); }} style={{ backgroundColor: '#2563eb', color: 'white', padding: '14px 36px', borderRadius: '16px', border: 'none', fontWeight: 'bold', cursor: 'pointer' }}>+ Add New Task</button>
          </div>
        </header>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '30px', width: '100%' }}>
          {['todo', 'inProgress', 'done'].map((col) => (
            <div key={col} data-col={col} onDragOver={onDragOver} onDrop={(e) => onDrop(e, col)} className="kanban-column"
              style={{ backgroundColor: isDarkMode ? 'rgba(15, 23, 42, 0.82)' : 'rgba(255, 255, 255, 0.45)', backdropFilter: 'blur(22px)', padding: '25px', borderRadius: '32px', minHeight: '550px' }}
            >
              <h2 style={{ fontSize: '0.85rem', fontWeight: '900', color: isDarkMode ? '#94a3b8' : '#475569', marginBottom: '30px', textAlign: 'center' }}>
                {col === 'inProgress' ? '🚀 In Progress' : col === 'todo' ? '📝 To Do' : '✅ Done'}
              </h2>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
                {tasks[col]
                  .filter(t => t.title.toLowerCase().includes(searchTerm.toLowerCase()))
                  .sort((a, b) => priorityWeight[b.priority] - priorityWeight[a.priority])
                  .map((task) => (
                  <div key={task.id} className="task-card" draggable="true" 
                    onDragStart={(e) => onDragStart(e, task.id, col)} 
                    onDragEnd={onDragEnd}
                    onTouchStart={(e) => onTouchStart(e, task, col)}
                    onTouchMove={onTouchMove}
                    onTouchEnd={onTouchEnd}
                    style={{ position: 'relative', backgroundColor: isDarkMode ? '#1e293b' : 'white', padding: '22px', borderRadius: '20px', boxShadow: '0 4px 12px rgba(0,0,0,0.05)' }}
                  >
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <span style={{ fontSize: '1.2rem', color: '#94a3b8' }}>⠿</span>
                        <div style={{ width: '10px', height: '10px', borderRadius: '50%', backgroundColor: task.priority === 'high' ? '#ef4444' : task.priority === 'medium' ? '#f59e0b' : '#22c55e' }}></div>
                        <span style={{ fontSize: '10px', fontWeight: '800', color: '#9ca3af' }}>{task.priority.toUpperCase()}</span>
                      </div>
                      
                      <div style={{ position: 'relative' }} ref={activeMenu === task.id ? menuRef : null}>
                        <button onClick={(e) => { e.stopPropagation(); setActiveMenu(activeMenu === task.id ? null : task.id); }} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#cbd5e1', fontSize: '1.2rem' }}>⋮</button>
                        {activeMenu === task.id && (
                          <div style={{ position: 'absolute', right: 0, top: '25px', backgroundColor: isDarkMode ? '#334155' : 'white', borderRadius: '12px', boxShadow: '0 10px 30px rgba(0,0,0,0.3)', zIndex: 20, width: '110px', border: '1px solid #ddd', overflow: 'hidden' }}>
                            <button onClick={() => { setIsEditing({ col, taskId: task.id }); setNewTask({ title: task.title, description: task.description, priority: task.priority }); setShowModal(true); setActiveMenu(null); }} style={{ display: 'block', width: '100%', padding: '10px', border: 'none', background: 'none', textAlign: 'left', cursor: 'pointer', color: isDarkMode ? 'white' : 'black' }}>Edit</button>
                            <button onClick={() => deleteTask(col, task.id)} style={{ display: 'block', width: '100%', padding: '10px', border: 'none', background: 'none', textAlign: 'left', cursor: 'pointer', color: '#ef4444' }}>Delete</button>
                          </div>
                        )}
                      </div>
                    </div>
                    <h3 style={{ margin: '0 0 6px 0', fontSize: '1.1rem', fontWeight: '800', color: isDarkMode ? '#f1f5f9' : '#1f2937' }}>{task.title}</h3>
                    <p style={{ margin: 0, fontSize: '0.85rem', color: isDarkMode ? '#94a3b8' : '#6b7280' }}>{task.description}</p>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>

      {showModal && (
        <div style={{ position: 'fixed', inset: 0, backgroundColor: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(10px)', display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 100 }}>
          <div style={{ backgroundColor: isDarkMode ? '#1e293b' : 'white', padding: '35px', borderRadius: '28px', width: '90%', maxWidth: '420px', border: '1px solid rgba(255,255,255,0.1)' }}>
            <h2 style={{ marginBottom: '25px', color: isDarkMode ? '#f1f5f9' : '#111827' }}>{isEditing ? 'Edit Task' : 'New Task'}</h2>
            <form onSubmit={handleSaveTask}>
              <input type="text" placeholder="Title" required value={newTask.title} onChange={(e) => setNewTask({...newTask, title: e.target.value})} style={{ width: '100%', padding: '14px', marginBottom: '15px', borderRadius: '12px', border: '1px solid #ccc', boxSizing: 'border-box', backgroundColor: isDarkMode ? '#0f172a' : '#fff', color: isDarkMode ? '#fff' : '#000' }} />
              <textarea placeholder="Description" value={newTask.description} onChange={(e) => setNewTask({...newTask, description: e.target.value})} style={{ width: '100%', padding: '14px', marginBottom: '15px', borderRadius: '12px', border: '1px solid #ccc', height: '100px', boxSizing: 'border-box', backgroundColor: isDarkMode ? '#0f172a' : '#fff', color: isDarkMode ? '#fff' : '#000' }} />
              <select value={newTask.priority} onChange={(e) => setNewTask({...newTask, priority: e.target.value})} style={{ width: '100%', padding: '14px', marginBottom: '25px', borderRadius: '12px', border: '1px solid #ccc', boxSizing: 'border-box', backgroundColor: isDarkMode ? '#0f172a' : '#fff', color: isDarkMode ? '#fff' : '#000' }}>
                <option value="low">Low Priority</option>
                <option value="medium">Medium Priority</option>
                <option value="high">High Priority</option>
              </select>
              <div style={{ display: 'flex', gap: '12px' }}>
                <button type="submit" style={{ flex: 1, backgroundColor: '#2563eb', color: 'white', padding: '14px', borderRadius: '12px', border: 'none', fontWeight: 'bold' }}>Save</button>
                <button type="button" onClick={() => { setShowModal(false); setIsEditing(null); }} style={{ flex: 1, backgroundColor: '#ccc', padding: '14px', borderRadius: '12px', border: 'none' }}>Cancel</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

export default App;
import React, { useState, useEffect, useRef } from 'react';

function App() {
  const [isDarkMode, setIsDarkMode] = useState(() => {
    const savedTheme = localStorage.getItem('kanban-theme');
    return savedTheme ? JSON.parse(savedTheme) : false;
  });

  const [tasks, setTasks] = useState(() => {
    const saved = localStorage.getItem('kanban-tasks');
    return saved ? JSON.parse(saved) : { todo: [], inProgress: [], done: [] };
  });

  const [searchTerm, setSearchTerm] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [isEditing, setIsEditing] = useState(null);
  const [newTask, setNewTask] = useState({ title: '', description: '', priority: 'low' });
  const [activeMenu, setActiveMenu] = useState(null);
  const menuRef = useRef(null);

  // --- PROGRESS CALCULATIONS ---
  const totalTasks = tasks.todo.length + tasks.inProgress.length + tasks.done.length;
  const completedTasks = tasks.done.length;
  const progress = totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0;

  useEffect(() => {
    localStorage.setItem('kanban-theme', JSON.stringify(isDarkMode));
  }, [isDarkMode]);

  useEffect(() => {
    localStorage.setItem('kanban-tasks', JSON.stringify(tasks));
  }, [tasks]);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (menuRef.current && !menuRef.current.contains(event.target)) {
        setActiveMenu(null);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const priorityWeight = { 'high': 3, 'medium': 2, 'low': 1 };

  const getDotColor = (priority) => {
    const p = (priority || "").toLowerCase().trim();
    if (p === 'high') return '#ef4444';
    if (p === 'medium') return '#f59e0b';
    if (p === 'low') return '#22c55e';
    return '#9ca3af';
  };

  const handleSaveTask = (e) => {
    e.preventDefault();
    if (!newTask.title) return;
    if (isEditing) {
      setTasks({
        ...tasks,
        [isEditing.col]: tasks[isEditing.col].map(t => 
          t.id === isEditing.taskId ? { ...t, ...newTask } : t
        )
      });
    } else {
      setTasks({ 
        ...tasks, 
        todo: [...tasks.todo, { ...newTask, id: Date.now().toString() }] 
      });
    }
    setShowModal(false);
  };

  const deleteTask = (column, taskId) => {
    if (window.confirm("Delete this task?")) {
      setTasks({
        ...tasks,
        [column]: tasks[column].filter(t => t.id !== taskId)
      });
      setActiveMenu(null);
    }
  };

  const onDragStart = (e, taskId, sourceCol) => {
    e.dataTransfer.setData("taskId", taskId);
    e.dataTransfer.setData("sourceCol", sourceCol);
  };

  const onDragOver = (e) => e.preventDefault();

  const onDrop = (e, destCol) => {
    const taskId = e.dataTransfer.getData("taskId");
    const sourceCol = e.dataTransfer.getData("sourceCol");
    if (sourceCol === destCol) return;
    const taskToMove = tasks[sourceCol].find(t => t.id === taskId);
    setTasks({
      ...tasks,
      [sourceCol]: tasks[sourceCol].filter(t => t.id !== taskId),
      [destCol]: [...tasks[destCol], taskToMove]
    });
  };

  return (
    <div style={{
      backgroundImage: isDarkMode ? 'url("/dark-mode-kanban.jpg")' : 'url("/light-mode-kanban.jpg")',
      backgroundSize: 'cover',
      backgroundPosition: 'center',
      backgroundAttachment: 'fixed',
      minHeight: '100vh',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      padding: 'clamp(20px, 5vw, 60px) clamp(10px, 3vw, 20px)',
      fontFamily: '"Inter", sans-serif',
      transition: 'background-image 0.5s ease-in-out',
      boxSizing: 'border-box',
      overflowX: 'hidden'
    }}>
      <style>{`
        .kanban-column { transition: transform 0.3s cubic-bezier(0.34, 1.56, 0.64, 1), box-shadow 0.3s ease !important; }
        .kanban-column:hover { transform: translateY(-10px); }
        .task-card { transition: transform 0.2s ease, background-color 0.2s ease !important; }
        .task-card:hover { transform: scale(1.02); background-color: ${isDarkMode ? '#2d3748' : '#ffffff'} !important; }
        .progress-bar { transition: width 0.8s cubic-bezier(0.65, 0, 0.35, 1); }
      `}</style>

      <div style={{ width: '100%', maxWidth: '1400px', position: 'relative' }}>
        
        {/* 🟢 ENHANCED PROGRESS TRACKER (Top Left) */}
        <div style={{
          position: 'absolute', top: '-15px', left: '10px',
          backgroundColor: isDarkMode ? 'rgba(255,255,255,0.08)' : 'rgba(255,255,255,0.4)',
          backdropFilter: 'blur(15px)', padding: '16px 24px', borderRadius: '22px',
          border: isDarkMode ? '1px solid rgba(255,255,255,0.15)' : '1px solid rgba(255,255,255,0.3)',
          display: 'flex', flexDirection: 'column', gap: '10px', minWidth: '200px', zIndex: 5,
          boxShadow: '0 10px 25px rgba(0,0,0,0.1)'
        }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ fontSize: '0.8rem', fontWeight: '900', color: isDarkMode ? '#cbd5e1' : '#475569', textTransform: 'uppercase', letterSpacing: '0.08em' }}>
              Board Progress
            </span>
            <span style={{ fontSize: '1.1rem', fontWeight: '900', color: isDarkMode ? '#f1f5f9' : '#1e293b' }}>
              {progress}%
            </span>
          </div>
          <div style={{ width: '100%', height: '10px', backgroundColor: isDarkMode ? 'rgba(255,255,255,0.1)' : '#e2e8f0', borderRadius: '12px', overflow: 'hidden' }}>
            <div className="progress-bar" style={{ 
              width: `${progress}%`, height: '100%', 
              backgroundColor: progress === 100 ? '#22c55e' : '#2563eb',
              boxShadow: progress > 0 ? `0 0 15px ${progress === 100 ? 'rgba(34, 197, 94, 0.6)' : 'rgba(37, 99, 235, 0.6)'}` : 'none'
            }}></div>
          </div>
        </div>

        <button 
          onClick={() => setIsDarkMode(!isDarkMode)}
          style={{
            position: 'absolute', top: '-10px', right: '10px',
            backgroundColor: isDarkMode ? 'rgba(255,255,255,0.1)' : 'white',
            border: 'none', borderRadius: '50%', width: '45px', height: '45px',
            cursor: 'pointer', fontSize: '1.2rem', boxShadow: '0 4px 10px rgba(0,0,0,0.1)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            zIndex: 10, color: isDarkMode ? 'white' : 'black'
          }}
        >
          {isDarkMode ? '🌙' : '☀️'}
        </button>

        <header style={{ textAlign: 'center', marginBottom: '40px', paddingTop: '60px' }}>
          <h1 style={{ 
            fontSize: 'clamp(2.2rem, 8vw, 3.8rem)', fontWeight: '900', 
            color: isDarkMode ? '#f8fafc' : '#1f2937', 
            marginBottom: '20px', letterSpacing: '-0.02em' 
          }}>
            Kanban Board
          </h1>
          
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '15px' }}>
            <input 
              type="text"
              placeholder="Search tasks..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              style={{
                width: '90%', maxWidth: '450px', padding: '14px 24px',
                borderRadius: '18px', border: 'none', outline: 'none',
                backgroundColor: isDarkMode ? 'rgba(255,255,255,0.12)' : 'rgba(255,255,255,0.45)',
                backdropFilter: 'blur(12px)', color: isDarkMode ? 'white' : '#1f2937',
                fontSize: '1rem', boxShadow: '0 4px 20px rgba(0,0,0,0.06)',
                border: isDarkMode ? '1px solid rgba(255,255,255,0.1)' : '1px solid rgba(255,255,255,0.2)'
              }}
            />

            <button 
              onClick={() => { setIsEditing(null); setNewTask({ title: '', description: '', priority: 'low' }); setShowModal(true); }} 
              style={{ 
                backgroundColor: '#2563eb', color: 'white', padding: '14px 36px', 
                borderRadius: '16px', border: 'none', cursor: 'pointer', 
                fontWeight: 'bold', fontSize: '1rem', boxShadow: '0 10px 25px -5px rgba(37, 99, 235, 0.4)'
              }}
            >
              + Add New Task
            </button>
          </div>
        </header>

        {/* --- REST OF THE CODE REMAINS THE SAME --- */}
        {showModal && (
          <div style={{ position: 'fixed', top: 0, left: 0, width: '100%', height: '100%', backgroundColor: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(10px)', display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 100 }}>
            <div style={{ backgroundColor: isDarkMode ? '#1e293b' : 'white', padding: '35px', borderRadius: '28px', width: '90%', maxWidth: '420px', boxShadow: '0 25px 50px -12px rgba(0,0,0,0.5)' }}>
              <h2 style={{ marginBottom: '25px', fontWeight: '800', color: isDarkMode ? '#f1f5f9' : '#111827' }}>{isEditing ? 'Edit Task' : 'New Task'}</h2>
              <form onSubmit={handleSaveTask}>
                <input 
                  type="text" placeholder="Title" required
                  value={newTask.title}
                  onChange={(e) => setNewTask({...newTask, title: e.target.value})}
                  style={{ width: '100%', padding: '14px', marginBottom: '15px', borderRadius: '12px', border: isDarkMode ? '1px solid #334155' : '1px solid #e5e7eb', backgroundColor: isDarkMode ? '#0f172a' : '#fff', color: isDarkMode ? 'white' : 'black', boxSizing: 'border-box' }}
                />
                <textarea 
                  placeholder="Description"
                  value={newTask.description}
                  onChange={(e) => setNewTask({...newTask, description: e.target.value})}
                  style={{ width: '100%', padding: '14px', marginBottom: '15px', borderRadius: '12px', border: isDarkMode ? '1px solid #334155' : '1px solid #e5e7eb', backgroundColor: isDarkMode ? '#0f172a' : '#fff', color: isDarkMode ? 'white' : 'black', height: '100px', resize: 'none', boxSizing: 'border-box' }}
                />
                <select 
                  value={newTask.priority}
                  onChange={(e) => setNewTask({...newTask, priority: e.target.value})}
                  style={{ width: '100%', padding: '14px', marginBottom: '25px', borderRadius: '12px', border: isDarkMode ? '1px solid #334155' : '1px solid #e5e7eb', backgroundColor: isDarkMode ? '#0f172a' : '#fff', color: isDarkMode ? 'white' : 'black', boxSizing: 'border-box' }}
                >
                  <option value="high">High Priority</option>
                  <option value="medium">Medium Priority</option>
                  <option value="low">Low Priority</option>
                </select>
                <div style={{ display: 'flex', gap: '12px' }}>
                  <button type="submit" style={{ flex: 1, backgroundColor: '#2563eb', color: 'white', padding: '14px', borderRadius: '12px', border: 'none', fontWeight: 'bold' }}>Save</button>
                  <button type="button" onClick={() => setShowModal(false)} style={{ flex: 1, backgroundColor: isDarkMode ? '#334155' : '#f3f4f6', color: isDarkMode ? '#cbd5e1' : '#6b7280', padding: '14px', borderRadius: '12px', border: 'none' }}>Cancel</button>
                </div>
              </form>
            </div>
          </div>
        )}

        <div style={{ 
          display: 'grid', 
          gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', 
          gap: '30px', 
          width: '100%'
        }}>
          {['todo', 'inProgress', 'done'].map((col) => (
            <div 
              key={col} onDragOver={onDragOver} onDrop={(e) => onDrop(e, col)}
              className="kanban-column"
              style={{ 
                backgroundColor: isDarkMode ? 'rgba(15, 23, 42, 0.82)' : 'rgba(255, 255, 255, 0.45)', 
                backdropFilter: 'blur(22px)', WebkitBackdropFilter: 'blur(22px)',
                padding: '25px', borderRadius: '32px', 
                minHeight: '550px', border: isDarkMode ? '1px solid rgba(255,255,255,0.08)' : '1px solid rgba(255,255,255,0.3)', 
                boxShadow: '0 10px 40px rgba(0, 0, 0, 0.06)',
                display: 'flex', flexDirection: 'column'
              }}
            >
              <h2 style={{ textTransform: 'uppercase', fontSize: '0.85rem', fontWeight: '900', color: isDarkMode ? '#94a3b8' : '#475569', marginBottom: '30px', textAlign: 'center', letterSpacing: '0.15em' }}>
                {col === 'inProgress' ? '🚀 In Progress' : col === 'todo' ? '📝 To Do' : '✅ Done'}
              </h2>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
                {[...tasks[col]]
                  .filter(task => task.title.toLowerCase().includes(searchTerm.toLowerCase()))
                  .sort((a, b) => (priorityWeight[b.priority] || 0) - (priorityWeight[a.priority] || 0))
                  .map((task) => (
                  <div key={task.id} className="task-card" draggable onDragStart={(e) => onDragStart(e, task.id, col)}
                    style={{ 
                      position: 'relative', 
                      backgroundColor: isDarkMode ? '#1e293b' : 'rgba(255, 255, 255, 0.95)', 
                      padding: '22px', borderRadius: '20px', cursor: 'grab', 
                      border: isDarkMode ? '1px solid rgba(255,255,255,0.04)' : 'none',
                      boxShadow: '0 4px 12px rgba(0,0,0,0.03)'
                    }}
                  >
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <div style={{ width: '10px', height: '10px', borderRadius: '50%', backgroundColor: getDotColor(task.priority) }}></div>
                        <span style={{ fontSize: '10px', fontWeight: '800', color: isDarkMode ? '#64748b' : '#9ca3af' }}>{task.priority.toUpperCase()}</span>
                      </div>
                      
                      <div style={{ position: 'relative' }} ref={activeMenu === task.id ? menuRef : null}>
                        <button onClick={(e) => { e.stopPropagation(); setActiveMenu(activeMenu === task.id ? null : task.id); }} style={{ background: 'none', border: 'none', cursor: 'pointer', color: isDarkMode ? '#475569' : '#cbd5e1', fontSize: '1.2rem' }}>⋮</button>
                        {activeMenu === task.id && (
                          <div style={{ position: 'absolute', right: 0, top: '25px', backgroundColor: isDarkMode ? '#334155' : 'white', borderRadius: '12px', boxShadow: '0 10px 30px rgba(0,0,0,0.3)', zIndex: 20, width: '110px', border: '1px solid #ddd', overflow: 'hidden' }}>
                            <button onClick={() => { const t = tasks[col].find(x => x.id === task.id); setIsEditing({ col, taskId: task.id }); setNewTask({ title: t.title, description: t.description, priority: t.priority }); setShowModal(true); setActiveMenu(null); }} style={{ display: 'block', width: '100%', padding: '10px', border: 'none', background: 'none', textAlign: 'left', cursor: 'pointer', fontSize: '0.85rem', color: isDarkMode ? 'white' : 'black' }}>Edit</button>
                            <button onClick={() => deleteTask(col, task.id)} style={{ display: 'block', width: '100%', padding: '10px', border: 'none', background: 'none', textAlign: 'left', cursor: 'pointer', fontSize: '0.85rem', color: '#ef4444' }}>Delete</button>
                          </div>
                        )}
                      </div>
                    </div>
                    <h3 style={{ margin: '0 0 6px 0', fontSize: '1.1rem', fontWeight: '800', color: isDarkMode ? '#f1f5f9' : '#1f2937' }}>{task.title}</h3>
                    <p style={{ margin: 0, fontSize: '0.85rem', color: isDarkMode ? '#94a3b8' : '#6b7280', lineHeight: '1.5' }}>{task.description}</p>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

export default App;
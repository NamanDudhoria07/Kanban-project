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
      // Dynamic padding for mobile
      padding: 'clamp(20px, 5vw, 60px) clamp(10px, 3vw, 20px)',
      fontFamily: '"Inter", sans-serif',
      transition: 'background-image 0.5s ease-in-out',
      boxSizing: 'border-box',
      overflowX: 'hidden'
    }}>
      <div style={{ width: '100%', maxWidth: '1200px', position: 'relative' }}>
        
        <button 
          onClick={() => setIsDarkMode(!isDarkMode)}
          style={{
            position: 'absolute', top: '-10px', right: '10px',
            backgroundColor: isDarkMode ? 'rgba(255,255,255,0.1)' : 'white',
            border: 'none', borderRadius: '50%', width: '40px', height: '40px',
            cursor: 'pointer', fontSize: '1.1rem', boxShadow: '0 4px 10px rgba(0,0,0,0.1)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            zIndex: 10
          }}
        >
          {isDarkMode ? '🌙' : '☀️'}
        </button>

        <header style={{ textAlign: 'center', marginBottom: '40px' }}>
          {/* Responsive font size */}
          <h1 style={{ 
            fontSize: 'clamp(2rem, 8vw, 3.5rem)', fontWeight: '900', 
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
                width: '90%', maxWidth: '400px', padding: '12px 20px',
                borderRadius: '15px', border: 'none', outline: 'none',
                backgroundColor: isDarkMode ? 'rgba(255,255,255,0.15)' : 'rgba(255,255,255,0.4)',
                backdropFilter: 'blur(10px)', color: isDarkMode ? 'white' : '#1f2937',
                fontSize: '1rem', boxShadow: '0 4px 15px rgba(0,0,0,0.05)',
                border: isDarkMode ? '1px solid rgba(255,255,255,0.1)' : 'none'
              }}
            />

            <button 
              onClick={() => { setIsEditing(null); setNewTask({ title: '', description: '', priority: 'low' }); setShowModal(true); }} 
              style={{ 
                backgroundColor: '#2563eb', color: 'white', padding: '12px 28px', 
                borderRadius: '12px', border: 'none', cursor: 'pointer', 
                fontWeight: 'bold', fontSize: '0.95rem'
              }}
            >
              + Add New Task
            </button>
          </div>
        </header>

        {showModal && (
          <div style={{ position: 'fixed', top: 0, left: 0, width: '100%', height: '100%', backgroundColor: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(10px)', display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 100 }}>
            <div style={{ backgroundColor: isDarkMode ? '#1e293b' : 'white', padding: '30px', borderRadius: '24px', width: '90%', maxWidth: '400px' }}>
              <h2 style={{ marginBottom: '20px', fontWeight: '800', color: isDarkMode ? '#f1f5f9' : '#111827' }}>{isEditing ? 'Edit Task' : 'New Task'}</h2>
              <form onSubmit={handleSaveTask}>
                <input 
                  type="text" placeholder="Title" required
                  value={newTask.title}
                  onChange={(e) => setNewTask({...newTask, title: e.target.value})}
                  style={{ width: '100%', padding: '12px', marginBottom: '12px', borderRadius: '10px', border: '1px solid #f3f4f6', boxSizing: 'border-box' }}
                />
                <textarea 
                  placeholder="Description"
                  value={newTask.description}
                  onChange={(e) => setNewTask({...newTask, description: e.target.value})}
                  style={{ width: '100%', padding: '12px', marginBottom: '12px', borderRadius: '10px', border: '1px solid #f3f4f6', height: '80px', resize: 'none', boxSizing: 'border-box' }}
                />
                <select 
                  value={newTask.priority}
                  onChange={(e) => setNewTask({...newTask, priority: e.target.value})}
                  style={{ width: '100%', padding: '12px', marginBottom: '20px', borderRadius: '10px', border: '1px solid #f3f4f6', boxSizing: 'border-box' }}
                >
                  <option value="high">High Priority</option>
                  <option value="medium">Medium Priority</option>
                  <option value="low">Low Priority</option>
                </select>
                <div style={{ display: 'flex', gap: '10px' }}>
                  <button type="submit" style={{ flex: 1, backgroundColor: '#2563eb', color: 'white', padding: '12px', borderRadius: '10px', border: 'none', fontWeight: 'bold' }}>Save</button>
                  <button type="button" onClick={() => setShowModal(false)} style={{ flex: 1, backgroundColor: isDarkMode ? '#334155' : '#f3f4f6', color: isDarkMode ? '#cbd5e1' : '#6b7280', padding: '12px', borderRadius: '10px', border: 'none' }}>Cancel</button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* MOBILE RESPONSIVE GRID: flexWrap + minWidth */}
        <div style={{ 
          display: 'flex', 
          flexWrap: 'wrap', 
          gap: '20px', 
          justifyContent: 'center',
          width: '100%'
        }}>
          {['todo', 'inProgress', 'done'].map((col) => (
            <div 
              key={col} onDragOver={onDragOver} onDrop={(e) => onDrop(e, col)}
              style={{ 
                backgroundColor: isDarkMode ? 'rgba(15, 23, 42, 0.85)' : 'rgba(255, 255, 255, 0.45)', 
                backdropFilter: 'blur(20px)', WebkitBackdropFilter: 'blur(20px)',
                padding: '20px', borderRadius: '24px', 
                flex: '1 1 300px', // Shrinks to 300px then stacks
                maxWidth: '400px',
                minHeight: '400px', border: isDarkMode ? '1px solid rgba(255,255,255,0.08)' : 'none', 
                boxShadow: '0 10px 30px rgba(0, 0, 0, 0.04)'
              }}
            >
              <h2 style={{ textTransform: 'uppercase', fontSize: '0.8rem', fontWeight: '900', color: isDarkMode ? '#cbd5e1' : '#4b5563', marginBottom: '25px', textAlign: 'center', letterSpacing: '0.1em' }}>
                {col === 'inProgress' ? '🚀 In Progress' : col === 'todo' ? '📝 To Do' : '✅ Done'}
              </h2>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                {[...tasks[col]]
                  .filter(task => task.title.toLowerCase().includes(searchTerm.toLowerCase()))
                  .sort((a, b) => (priorityWeight[b.priority] || 0) - (priorityWeight[a.priority] || 0))
                  .map((task) => (
                  <div key={task.id} draggable onDragStart={(e) => onDragStart(e, task.id, col)}
                    style={{ 
                      position: 'relative', 
                      backgroundColor: isDarkMode ? '#1e293b' : 'rgba(255, 255, 255, 0.9)', 
                      padding: '18px', borderRadius: '16px', cursor: 'grab', 
                      border: isDarkMode ? '1px solid rgba(255,255,255,0.03)' : 'none'
                    }}
                  >
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                        <div style={{ width: '8px', height: '8px', borderRadius: '50%', backgroundColor: getDotColor(task.priority) }}></div>
                        <span style={{ fontSize: '9px', fontWeight: '800', color: isDarkMode ? '#94a3b8' : '#9ca3af' }}>{task.priority}</span>
                      </div>
                      
                      <button onClick={() => { setIsEditing({ col, taskId: task.id }); const t = tasks[col].find(x => x.id === task.id); setNewTask({ title: t.title, description: t.description, priority: t.priority }); setShowModal(true); }} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#d1d5db' }}>⋮</button>
                    </div>
                    <h3 style={{ margin: '0 0 4px 0', fontSize: '1rem', fontWeight: '800', color: isDarkMode ? '#f1f5f9' : '#1f2937' }}>{task.title}</h3>
                    <p style={{ margin: 0, fontSize: '0.8rem', color: isDarkMode ? '#94a3b8' : '#6b7280' }}>{task.description}</p>
                    <button onClick={() => deleteTask(col, task.id)} style={{ position: 'absolute', bottom: '10px', right: '10px', background: 'none', border: 'none', color: '#ef4444', fontSize: '0.7rem', cursor: 'pointer' }}>Delete</button>
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
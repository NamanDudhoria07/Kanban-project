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
      // Dynamically switch between your two JPG backgrounds
      backgroundImage: isDarkMode 
        ? 'url("/dark-mode-kanban.jpg")' 
        : 'url("/light-mode-kanban.jpg")',
      backgroundSize: 'cover',
      backgroundPosition: 'center',
      backgroundAttachment: 'fixed',
      minHeight: '100vh',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      padding: '60px 20px',
      fontFamily: '"Inter", sans-serif',
      transition: 'background-image 0.5s ease-in-out'
    }}>
      <div style={{ width: '100%', maxWidth: '1200px', position: 'relative' }}>
        
        <button 
          onClick={() => setIsDarkMode(!isDarkMode)}
          style={{
            position: 'absolute', top: '-40px', right: '0',
            backgroundColor: isDarkMode ? 'rgba(255,255,255,0.1)' : 'white',
            border: 'none', borderRadius: '50%', width: '45px', height: '45px',
            cursor: 'pointer', fontSize: '1.2rem', boxShadow: '0 4px 10px rgba(0,0,0,0.1)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            transition: 'all 0.3s ease', color: isDarkMode ? 'white' : 'black'
          }}
        >
          {isDarkMode ? '🌙' : '☀️'}
        </button>

        <header style={{ textAlign: 'center', marginBottom: '50px' }}>
          <h1 style={{ 
            fontSize: '3.5rem', fontWeight: '900', 
            color: isDarkMode ? '#f8fafc' : '#1f2937', 
            marginBottom: '25px', letterSpacing: '-0.02em' 
          }}>
            Kanban Board
          </h1>
          
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '20px' }}>
            <input 
              type="text"
              placeholder="Search tasks..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              style={{
                width: '100%', maxWidth: '400px', padding: '12px 20px',
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
                backgroundColor: '#2563eb', color: 'white', padding: '14px 32px', 
                borderRadius: '14px', border: 'none', cursor: 'pointer', 
                fontWeight: 'bold', fontSize: '1rem', 
                boxShadow: isDarkMode ? '0 10px 20px -5px rgba(37, 99, 235, 0.2)' : '0 10px 20px -5px rgba(37, 99, 235, 0.4)'
              }}
            >
              + Add New Task
            </button>
          </div>
        </header>

        {showModal && (
          <div style={{ position: 'fixed', top: 0, left: 0, width: '100%', height: '100%', backgroundColor: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(10px)', display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 100 }}>
            <div style={{ backgroundColor: isDarkMode ? '#1e293b' : 'white', padding: '40px', borderRadius: '24px', width: '400px', boxShadow: '0 25px 50px -12px rgba(0,0,0,0.4)' }}>
              <h2 style={{ marginBottom: '24px', fontWeight: '800', color: isDarkMode ? '#f1f5f9' : '#111827' }}>{isEditing ? 'Edit Task' : 'New Task'}</h2>
              <form onSubmit={handleSaveTask}>
                <input 
                  type="text" placeholder="Title" required
                  value={newTask.title}
                  onChange={(e) => setNewTask({...newTask, title: e.target.value})}
                  style={{ width: '100%', padding: '14px', marginBottom: '16px', borderRadius: '12px', border: isDarkMode ? '1px solid #334155' : '1px solid #f3f4f6', backgroundColor: isDarkMode ? '#0f172a' : '#f9fafb', color: isDarkMode ? 'white' : 'black', outline: 'none' }}
                />
                <textarea 
                  placeholder="Description"
                  value={newTask.description}
                  onChange={(e) => setNewTask({...newTask, description: e.target.value})}
                  style={{ width: '100%', padding: '14px', marginBottom: '16px', borderRadius: '12px', border: isDarkMode ? '1px solid #334155' : '1px solid #f3f4f6', backgroundColor: isDarkMode ? '#0f172a' : '#f9fafb', color: isDarkMode ? 'white' : 'black', height: '100px', resize: 'none', outline: 'none' }}
                />
                <select 
                  value={newTask.priority}
                  onChange={(e) => setNewTask({...newTask, priority: e.target.value})}
                  style={{ width: '100%', padding: '14px', marginBottom: '24px', borderRadius: '12px', border: isDarkMode ? '1px solid #334155' : '1px solid #f3f4f6', backgroundColor: isDarkMode ? '#0f172a' : '#f9fafb', color: isDarkMode ? 'white' : 'black', outline: 'none' }}
                >
                  <option value="high">High Priority</option>
                  <option value="medium">Medium Priority</option>
                  <option value="low">Low Priority</option>
                </select>
                <div style={{ display: 'flex', gap: '12px' }}>
                  <button type="submit" style={{ flex: 1, backgroundColor: '#2563eb', color: 'white', padding: '14px', borderRadius: '12px', border: 'none', fontWeight: 'bold' }}>Save</button>
                  <button type="button" onClick={() => setShowModal(false)} style={{ flex: 1, backgroundColor: isDarkMode ? '#334155' : '#f3f4f6', color: isDarkMode ? '#cbd5e1' : '#6b7280', padding: '14px', borderRadius: '12px', border: 'none', fontWeight: 'bold' }}>Cancel</button>
                </div>
              </form>
            </div>
          </div>
        )}

        <div style={{ display: 'flex', gap: '30px', alignItems: 'flex-start' }}>
          {['todo', 'inProgress', 'done'].map((col) => (
            <div 
              key={col} onDragOver={onDragOver} onDrop={(e) => onDrop(e, col)}
              style={{ 
                backgroundColor: isDarkMode ? 'rgba(15, 23, 42, 0.85)' : 'rgba(255, 255, 255, 0.45)', 
                backdropFilter: 'blur(20px)', WebkitBackdropFilter: 'blur(20px)',
                padding: '30px', borderRadius: '32px', width: '33.33%', 
                minHeight: '650px', border: isDarkMode ? '1px solid rgba(255,255,255,0.08)' : 'none', 
                boxShadow: isDarkMode ? '0 20px 40px rgba(0, 0, 0, 0.4)' : '0 10px 40px rgba(0, 0, 0, 0.04)',
                transition: 'all 0.3s ease'
              }}
              onMouseEnter={(e) => e.currentTarget.style.transform = 'translateY(-10px)'}
              onMouseLeave={(e) => e.currentTarget.style.transform = 'translateY(0)'}
            >
              <h2 style={{ textTransform: 'uppercase', fontSize: '0.85rem', fontWeight: '900', color: isDarkMode ? '#cbd5e1' : '#4b5563', marginBottom: '35px', textAlign: 'center', letterSpacing: '0.15em' }}>
                {col === 'inProgress' ? '🚀 In Progress' : col === 'todo' ? '📝 To Do' : '✅ Done'}
              </h2>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                {[...tasks[col]]
                  .filter(task => task.title.toLowerCase().includes(searchTerm.toLowerCase()))
                  .sort((a, b) => (priorityWeight[b.priority] || 0) - (priorityWeight[a.priority] || 0))
                  .map((task) => (
                  <div key={task.id} draggable onDragStart={(e) => onDragStart(e, task.id, col)}
                    style={{ 
                      position: 'relative', 
                      backgroundColor: isDarkMode ? '#1e293b' : 'rgba(255, 255, 255, 0.9)', 
                      padding: '24px', borderRadius: '20px', cursor: 'grab', 
                      border: isDarkMode ? '1px solid rgba(255,255,255,0.03)' : 'none'
                    }}
                  >
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <div style={{ width: '10px', height: '10px', borderRadius: '50%', backgroundColor: getDotColor(task.priority) }}></div>
                        <span style={{ fontSize: '10px', fontWeight: '800', color: isDarkMode ? '#94a3b8' : '#9ca3af', textTransform: 'uppercase' }}>{task.priority}</span>
                      </div>
                      
                      <div style={{ position: 'relative' }} ref={activeMenu === task.id ? menuRef : null}>
                        <button onClick={(e) => { e.stopPropagation(); setActiveMenu(activeMenu === task.id ? null : task.id); }} style={{ background: 'none', border: 'none', cursor: 'pointer', color: isDarkMode ? '#475569' : '#d1d5db', fontSize: '1.2rem' }}>⋮</button>
                        {activeMenu === task.id && (
                          <div style={{ position: 'absolute', right: 0, top: '25px', backgroundColor: isDarkMode ? '#334155' : 'white', borderRadius: '12px', boxShadow: '0 10px 30px rgba(0,0,0,0.4)', zIndex: 10, width: '120px', border: isDarkMode ? '1px solid #475569' : '1px solid #f3f4f6', overflow: 'hidden' }}>
                            <button onClick={() => { const t = tasks[col].find(x => x.id === task.id); setIsEditing({ col, taskId: task.id }); setNewTask({ title: t.title, description: t.description, priority: t.priority }); setShowModal(true); setActiveMenu(null); }} style={{ display: 'block', width: '100%', padding: '12px', border: 'none', background: 'none', textAlign: 'left', cursor: 'pointer', fontSize: '0.85rem', color: isDarkMode ? '#f1f5f9' : '#1f2937' }}>Edit Task</button>
                            <button onClick={() => deleteTask(col, task.id)} style={{ display: 'block', width: '100%', padding: '12px', border: 'none', background: 'none', textAlign: 'left', cursor: 'pointer', fontSize: '0.85rem', color: '#ef4444' }}>Delete</button>
                          </div>
                        )}
                      </div>
                    </div>
                    <h3 style={{ margin: '0 0 6px 0', fontSize: '1.15rem', fontWeight: '800', color: isDarkMode ? '#f1f5f9' : '#1f2937' }}>{task.title}</h3>
                    <p style={{ margin: 0, fontSize: '0.9rem', color: isDarkMode ? '#94a3b8' : '#6b7280', lineHeight: '1.6' }}>{task.description}</p>
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
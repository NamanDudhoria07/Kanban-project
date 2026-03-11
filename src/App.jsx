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

  const totalTasks = tasks.todo.length + tasks.inProgress.length + tasks.done.length;
  const progress = totalTasks > 0 ? Math.round((tasks.done.length / totalTasks) * 100) : 0;

  useEffect(() => {
    localStorage.setItem('kanban-theme', JSON.stringify(isDarkMode));
    localStorage.setItem('kanban-tasks', JSON.stringify(tasks));
  }, [isDarkMode, tasks]);

  // --- CORE MOVE LOGIC (Works for both Drag and Buttons) ---
  const moveTask = (sourceCol, destCol, taskId) => {
    if (sourceCol === destCol) return;
    const taskToMove = tasks[sourceCol].find(t => t.id === taskId);
    setTasks({
      ...tasks,
      [sourceCol]: tasks[sourceCol].filter(t => t.id !== taskId),
      [destCol]: [...tasks[destCol], taskToMove]
    });
  };

  const onDragStart = (e, taskId, sourceCol) => {
    e.dataTransfer.setData("taskId", taskId);
    e.dataTransfer.setData("sourceCol", sourceCol);
  };

  const onDrop = (e, destCol) => {
    const taskId = e.dataTransfer.getData("taskId");
    const sourceCol = e.dataTransfer.getData("sourceCol");
    moveTask(sourceCol, destCol, taskId);
  };

  const deleteTask = (column, taskId) => {
    if (window.confirm("Delete task?")) {
      setTasks({...tasks, [column]: tasks[column].filter(t => t.id !== taskId)});
      setActiveMenu(null);
    }
  };

  const getDotColor = (p) => {
    if (p === 'high') return '#ef4444';
    if (p === 'medium') return '#f59e0b';
    return '#22c55e';
  };

  return (
    <div style={{
      backgroundImage: isDarkMode ? 'url("/dark-mode-kanban.jpg")' : 'url("/light-mode-kanban.jpg")',
      backgroundSize: 'cover', backgroundAttachment: 'fixed', minHeight: '100vh',
      display: 'flex', flexDirection: 'column', alignItems: 'center',
      padding: 'clamp(20px, 5vw, 60px) clamp(10px, 3vw, 20px)',
      fontFamily: '"Inter", sans-serif', boxSizing: 'border-box', overflowX: 'hidden'
    }}>
      <style>{`
        .kanban-column { transition: transform 0.3s ease; }
        .task-card { transition: transform 0.2s ease; touch-action: none; } /* Critical for Mobile */
        .task-card:active { cursor: grabbing; transform: scale(1.05) rotate(2deg); z-index: 100; }
        .progress-bar { transition: width 0.8s ease; }
      `}</style>

      <div style={{ width: '100%', maxWidth: '1400px', position: 'relative' }}>
        
        {/* Progress Tracker */}
        <div style={{
          position: 'absolute', top: '-15px', left: '10px',
          backgroundColor: isDarkMode ? 'rgba(255,255,255,0.08)' : 'rgba(255,255,255,0.4)',
          backdropFilter: 'blur(15px)', padding: '16px 24px', borderRadius: '22px',
          minWidth: '200px', zIndex: 5, boxShadow: '0 10px 25px rgba(0,0,0,0.1)'
        }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
            <span style={{ fontSize: '0.8rem', fontWeight: '900', color: isDarkMode ? '#cbd5e1' : '#475569' }}>BOARD PROGRESS</span>
            <span style={{ fontSize: '1.1rem', fontWeight: '900', color: isDarkMode ? '#f1f5f9' : '#1e293b' }}>{progress}%</span>
          </div>
          <div style={{ width: '100%', height: '10px', backgroundColor: 'rgba(0,0,0,0.1)', borderRadius: '10px', overflow: 'hidden' }}>
            <div className="progress-bar" style={{ width: `${progress}%`, height: '100%', backgroundColor: progress === 100 ? '#22c55e' : '#2563eb' }}></div>
          </div>
        </div>

        <button onClick={() => setIsDarkMode(!isDarkMode)} style={{ position: 'absolute', top: '-10px', right: '10px', border: 'none', borderRadius: '50%', width: '45px', height: '45px', cursor: 'pointer', zIndex: 10 }}>
          {isDarkMode ? '🌙' : '☀️'}
        </button>

        <header style={{ textAlign: 'center', marginBottom: '40px', paddingTop: '60px' }}>
          <h1 style={{ fontSize: 'clamp(2.2rem, 8vw, 3.8rem)', fontWeight: '900', color: isDarkMode ? '#f8fafc' : '#1f2937' }}>Kanban Board</h1>
          <button onClick={() => { setIsEditing(null); setNewTask({ title: '', description: '', priority: 'low' }); setShowModal(true); }} style={{ backgroundColor: '#2563eb', color: 'white', padding: '14px 36px', borderRadius: '16px', border: 'none', fontWeight: 'bold', marginTop: '20px', cursor: 'pointer' }}>+ Add New Task</button>
        </header>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '30px', width: '100%' }}>
          {['todo', 'inProgress', 'done'].map((col) => (
            <div key={col} onDragOver={(e) => e.preventDefault()} onDrop={(e) => onDrop(e, col)}
              className="kanban-column"
              style={{ backgroundColor: isDarkMode ? 'rgba(15, 23, 42, 0.82)' : 'rgba(255, 255, 255, 0.45)', backdropFilter: 'blur(22px)', padding: '25px', borderRadius: '32px', minHeight: '550px' }}
            >
              <h2 style={{ textTransform: 'uppercase', fontSize: '0.85rem', fontWeight: '900', color: isDarkMode ? '#94a3b8' : '#475569', textAlign: 'center', marginBottom: '30px' }}>
                {col === 'todo' ? '📝 To Do' : col === 'inProgress' ? '🚀 In Progress' : '✅ Done'}
              </h2>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
                {tasks[col].map((task) => (
                  <div key={task.id} className="task-card" draggable onDragStart={(e) => onDragStart(e, task.id, col)}
                    style={{ position: 'relative', backgroundColor: isDarkMode ? '#1e293b' : 'white', padding: '20px', borderRadius: '20px', boxShadow: '0 4px 12px rgba(0,0,0,0.05)' }}
                  >
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        {/* ⠿ Six Dots Drag Handle */}
                        <span style={{ fontSize: '1.2rem', color: '#94a3b8', cursor: 'grab' }}>⠿</span>
                        <div style={{ width: '8px', height: '8px', borderRadius: '50%', backgroundColor: getDotColor(task.priority) }}></div>
                        <span style={{ fontSize: '10px', fontWeight: '800', color: '#94a3b8' }}>{task.priority.toUpperCase()}</span>
                      </div>
                      
                      {/* Mobile Arrows for Draggable Alternative */}
                      <div style={{ display: 'flex', gap: '5px' }}>
                        {col !== 'todo' && <button onClick={() => moveTask(col, 'todo', task.id)} style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: '12px' }}>◀</button>}
                        {col !== 'done' && <button onClick={() => moveTask(col, 'done', task.id)} style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: '12px' }}>▶</button>}
                        <button onClick={() => deleteTask(col, task.id)} style={{ color: '#ef4444', border: 'none', background: 'none', cursor: 'pointer' }}>×</button>
                      </div>
                    </div>
                    <h3 style={{ margin: '0 0 5px 0', fontSize: '1.1rem', color: isDarkMode ? 'white' : 'black' }}>{task.title}</h3>
                    <p style={{ margin: 0, fontSize: '0.85rem', color: '#94a3b8' }}>{task.description}</p>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>
      
      {/* Modal code would go here... */}
    </div>
  );
}

export default App;
import React, { useState, useEffect, useMemo } from 'react';
import { 
  Search, 
  ArrowUpRight, 
  ArrowDownRight, 
  TrendingUp, 
  Award, 
  Layers,
  Sun,
  Moon,
  ArrowUpDown,
  PieChart,
  Zap,
  Home,
  Star,
  BarChart2,
  Settings
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import stockData from './data.json';

function App() {
  const [searchTerm, setSearchTerm] = useState('');
  const [theme, setTheme] = useState('dark');
  const [sortConfig, setSortConfig] = useState({ key: 'buyWeeks', direction: 'desc' });
  const [isPriorityMode, setIsPriorityMode] = useState(true);
  const [activeTab, setActiveTab] = useState('home');

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
  }, [theme]);

  const toggleTheme = () => setTheme(prev => prev === 'dark' ? 'light' : 'dark');

  const sortedData = useMemo(() => {
    let items = [...stockData];
    if (searchTerm) {
      items = items.filter(item => 
        item.name.includes(searchTerm) || item.id.includes(searchTerm)
      );
    }
    items.sort((a, b) => {
      if (isPriorityMode) {
        const aPriority = a.buyWeeks >= 3 ? 1 : 0;
        const bPriority = b.buyWeeks >= 3 ? 1 : 0;
        if (aPriority !== bPriority) return bPriority - aPriority; 
      }
      const aVal = a[sortConfig.key];
      const bVal = b[sortConfig.key];
      if (aVal < bVal) return sortConfig.direction === 'asc' ? -1 : 1;
      if (aVal > bVal) return sortConfig.direction === 'asc' ? 1 : -1;
      return 0;
    });
    return items;
  }, [stockData, sortConfig, searchTerm, isPriorityMode]);

  const requestSort = (key) => {
    let direction = 'desc';
    if (sortConfig.key === key && sortConfig.direction === 'desc') {
      direction = 'asc';
    }
    setSortConfig({ key, direction });
  };

  const getSortIcon = (key) => {
    if (sortConfig.key !== key) return <ArrowUpDown size={14} style={{ opacity: 0.3 }} />;
    return sortConfig.direction === 'desc' ? ' ▼' : ' ▲';
  };

  return (
    <div className="app-container">
      {/* 頂部 Fixed Navbar */}
      <header className="dashboard-header">
        <div className="logo-section">
          <motion.h1 initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }}>
            XQ Dashboard
          </motion.h1>
          <div className="hide-mobile" style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginTop: '0.2rem' }}>
            <p style={{ margin: 0, fontSize: '0.8rem' }}>大戶籌碼追蹤</p>
          </div>
        </div>

        <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'center' }}>
          <div style={{ position: 'relative' }}>
            <Search size={16} style={{ position: 'absolute', left: '10px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-secondary)' }} />
            <input 
              type="text" 
              placeholder="搜尋..."
              className="search-input"
              style={{
                background: 'var(--card-bg)',
                border: '1px solid var(--card-border)',
                borderRadius: '0.5rem',
                padding: '0.5rem 0.5rem 0.5rem 2rem',
                color: 'var(--text-primary)',
                width: '120px',
                fontSize: '0.875rem',
                outline: 'none'
              }}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          <button className="theme-toggle" onClick={toggleTheme} style={{ width: '36px', height: '36px' }}>
            {theme === 'dark' ? <Sun size={18} /> : <Moon size={18} />}
          </button>
        </div>
      </header>

      {/* 優先模式開關 (手機版也顯示) */}
      <div style={{ marginBottom: '1.5rem', display: 'flex', justifyContent: 'flex-start' }}>
        <button 
          onClick={() => setIsPriorityMode(!isPriorityMode)}
          style={{
            background: isPriorityMode ? 'var(--success)' : 'var(--card-bg)',
            color: isPriorityMode ? '#fff' : 'var(--text-secondary)',
            border: '1px solid var(--card-border)',
            borderRadius: '20px',
            padding: '6px 14px',
            fontSize: '0.75rem',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            gap: '6px',
            fontWeight: 600
          }}
        >
          <Zap size={12} fill={isPriorityMode ? 'currentColor' : 'none'} />
          連買 3 週置頂: {isPriorityMode ? 'ON' : 'OFF'}
        </button>
      </div>

      <motion.div className="table-container" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
        <table>
          <thead>
            <tr>
              <th onClick={() => requestSort('id')}>股票 {getSortIcon('id')}</th>
              <th onClick={() => requestSort('price')}>現價 {getSortIcon('price')}</th>
              <th onClick={() => requestSort('premium')}>溢價 {getSortIcon('premium')}</th>
              <th onClick={() => requestSort('buyWeeks')}>連買 {getSortIcon('buyWeeks')}</th>
              <th onClick={() => requestSort('foreign_hold')}>外資 {getSortIcon('foreign_hold')}</th>
              <th>產業地位</th>
            </tr>
          </thead>
          <tbody>
            <AnimatePresence>
              {sortedData.map((item) => (
                <motion.tr 
                  key={item.id} 
                  layout 
                  initial={{ opacity: 0 }} 
                  animate={{ opacity: 1 }} 
                  exit={{ opacity: 0 }}
                  style={{
                    background: isPriorityMode && item.buyWeeks >= 3 ? 'rgba(16, 185, 129, 0.08)' : 'transparent'
                  }}
                >
                  <td data-label="股票">
                    <div className="stock-name">
                      <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                        <span style={{ fontWeight: 600 }}>{item.name}</span>
                        {item.buyWeeks >= 3 && <Zap size={12} color="var(--success)" fill="var(--success)" />}
                      </div>
                      <span className="stock-id" style={{ color: 'var(--accent-color)' }}>{item.id}</span>
                    </div>
                  </td>
                  <td data-label="現價" style={{ fontWeight: 800 }}>{item.price}</td>
                  <td data-label="溢價" style={{ color: item.premium > 5 ? 'var(--danger)' : 'var(--text-primary)', fontWeight: 600 }}>
                    {item.premium}%
                  </td>
                  <td data-label="連買">
                    <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                      <TrendingUp size={14} color={item.buyWeeks >= 3 ? 'var(--success)' : 'var(--text-secondary)'} />
                      <span style={{ color: item.buyWeeks >= 3 ? 'var(--success)' : 'inherit', fontWeight: 700 }}>
                        {item.buyWeeks}W
                      </span>
                    </div>
                  </td>
                  <td data-label="外資">
                    <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                      <PieChart size={12} color="var(--accent-color)" />
                      {item.foreign_hold}%
                    </div>
                  </td>
                  <td data-label="產業地位">
                    <div className="tag tag-blue" style={{ fontSize: '0.75rem', lineHeight: '1.2' }}>
                      {item.status}
                    </div>
                  </td>
                </motion.tr>
              ))}
            </AnimatePresence>
          </tbody>
        </table>
      </motion.div>

      {/* 底部 Tab Navbar (僅手機版可見) */}
      <nav className="bottom-nav">
        <div className={`nav-item ${activeTab === 'home' ? 'active' : ''}`} onClick={() => setActiveTab('home')}>
          <Home size={22} />
          <span>儀表板</span>
        </div>
        <div className={`nav-item ${activeTab === 'star' ? 'active' : ''}`} onClick={() => setActiveTab('star')}>
          <Star size={22} />
          <span>自選股</span>
        </div>
        <div className={`nav-item ${activeTab === 'chart' ? 'active' : ''}`} onClick={() => setActiveTab('chart')}>
          <BarChart2 size={22} />
          <span>分析</span>
        </div>
        <div className={`nav-item ${activeTab === 'settings' ? 'active' : ''}`} onClick={() => setActiveTab('settings')}>
          <Settings size={22} />
          <span>設定</span>
        </div>
      </nav>
    </div>
  );
}

export default App;

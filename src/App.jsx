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
  Zap
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import stockData from './data.json';

function App() {
  const [searchTerm, setSearchTerm] = useState('');
  const [theme, setTheme] = useState('dark');
  const [sortConfig, setSortConfig] = useState({ key: 'premium', direction: 'asc' });
  const [isPriorityMode, setIsPriorityMode] = useState(true); // 預設開啟優先置頂模式

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
  }, [theme]);

  const toggleTheme = () => setTheme(prev => prev === 'dark' ? 'light' : 'dark');

  // 排序與過濾邏輯
  const sortedData = useMemo(() => {
    let items = [...stockData];
    
    // 過濾搜尋
    if (searchTerm) {
      items = items.filter(item => 
        item.name.includes(searchTerm) || item.id.includes(searchTerm)
      );
    }

    // 執行多層次排序
    items.sort((a, b) => {
      // 第一層：連買 3 週優先置頂
      if (isPriorityMode) {
        const aPriority = a.buyWeeks >= 3 ? 1 : 0;
        const bPriority = b.buyWeeks >= 3 ? 1 : 0;
        if (aPriority !== bPriority) return bPriority - aPriority; 
      }

      // 第二層：使用者選擇的排序欄位
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
      <header className="dashboard-header">
        <div className="logo-section">
          <motion.h1 initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }}>
            XQ 智慧監控儀表板
          </motion.h1>
          <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginTop: '0.5rem' }}>
            <p style={{ margin: 0 }}>大戶籌碼、外資持股與產業追蹤</p>
            <button 
              onClick={() => setIsPriorityMode(!isPriorityMode)}
              style={{
                background: isPriorityMode ? 'var(--success)' : 'var(--card-bg)',
                color: isPriorityMode ? '#fff' : 'var(--text-secondary)',
                border: '1px solid var(--card-border)',
                borderRadius: '20px',
                padding: '4px 12px',
                fontSize: '0.75rem',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '4px',
                fontWeight: 600,
                transition: 'all 0.2s ease'
              }}
            >
              <Zap size={12} fill={isPriorityMode ? 'currentColor' : 'none'} />
              連買 3 週優先置頂: {isPriorityMode ? '開啟' : '關閉'}
            </button>
          </div>
        </div>

        <div style={{ display: 'flex', gap: '1.25rem', alignItems: 'center' }}>
          <div style={{ position: 'relative' }}>
            <Search size={18} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-secondary)' }} />
            <input 
              type="text" 
              placeholder="搜尋代號或名稱..."
              style={{
                background: 'var(--card-bg)',
                border: '1px solid var(--card-border)',
                borderRadius: '0.75rem',
                padding: '0.625rem 1rem 0.625rem 2.5rem',
                color: 'var(--text-primary)',
                width: '240px',
                outline: 'none'
              }}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          <button className="theme-toggle" onClick={toggleTheme}>
            {theme === 'dark' ? <Sun size={20} /> : <Moon size={20} />}
          </button>
        </div>
      </header>

      <motion.div className="table-container" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
        <table>
          <thead>
            <tr>
              <th onClick={() => requestSort('id')} style={{ cursor: 'pointer' }}>股票名稱/代號 {getSortIcon('id')}</th>
              <th onClick={() => requestSort('price')} style={{ cursor: 'pointer' }}>現價 {getSortIcon('price')}</th>
              <th onClick={() => requestSort('premium')} style={{ cursor: 'pointer' }}>溢價 (%) {getSortIcon('premium')}</th>
              <th onClick={() => requestSort('buyWeeks')} style={{ cursor: 'pointer' }}>連買週 (大戶) {getSortIcon('buyWeeks')}</th>
              <th onClick={() => requestSort('foreign_hold')} style={{ cursor: 'pointer' }}>外資持股 {getSortIcon('foreign_hold')}</th>
              <th onClick={() => requestSort('industry')} style={{ cursor: 'pointer' }}>產業 {getSortIcon('industry')}</th>
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
                    background: isPriorityMode && item.buyWeeks >= 3 ? 'rgba(16, 185, 129, 0.05)' : 'transparent'
                  }}
                >
                  <td>
                    <div className="stock-name">
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <span style={{ fontSize: '1.05rem', fontWeight: 600 }}>{item.name}</span>
                        {item.buyWeeks >= 3 && <Zap size={14} color="var(--success)" fill="var(--success)" />}
                      </div>
                      <span className="stock-id" style={{ color: 'var(--accent-color)', fontWeight: 700 }}>{item.id}</span>
                    </div>
                  </td>
                  <td style={{ fontWeight: 800, fontSize: '1.1rem' }}>{item.price}</td>
                  <td style={{ color: item.premium > 5 ? 'var(--danger)' : 'var(--text-primary)', fontWeight: item.premium > 5 ? 700 : 400 }}>
                    {item.premium}%
                  </td>
                  <td>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <TrendingUp size={16} color={item.buyWeeks >= 3 ? 'var(--success)' : 'var(--text-secondary)'} />
                      <span style={{ color: item.buyWeeks >= 3 ? 'var(--success)' : 'var(--text-primary)', fontWeight: item.buyWeeks >= 3 ? 800 : 400 }}>
                        {item.buyWeeks} 週
                      </span>
                    </div>
                  </td>
                  <td style={{ fontWeight: 600 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                      <PieChart size={14} color="var(--accent-color)" />
                      {item.foreign_hold}%
                    </div>
                  </td>
                  <td>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.85rem' }}>
                      <Layers size={14} color="var(--text-secondary)" />
                      {item.industry}
                    </div>
                  </td>
                  <td>
                    <div className="tag tag-blue" style={{ display: 'flex', alignItems: 'center', gap: '4px', width: 'fit-content', lineHeight: '1.4' }}>
                      <Award size={14} style={{ flexShrink: 0 }} />
                      <span style={{ fontSize: '0.8rem' }}>{item.status}</span>
                    </div>
                  </td>
                </motion.tr>
              ))}
            </AnimatePresence>
          </tbody>
        </table>
      </motion.div>
    </div>
  );
}

export default App;

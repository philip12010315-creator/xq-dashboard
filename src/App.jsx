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
      <header className="dashboard-header">
        <div className="logo-section">
          <motion.h1 initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }}>
            XQ 智慧監控儀表板
          </motion.h1>
          <div className="hide-mobile">
            <p>大戶籌碼、外資持股與產業追蹤系統</p>
          </div>
        </div>

        <div className="header-actions">
          <div className="search-container">
            <Search className="search-icon" size={18} />
            <input 
              type="text" 
              placeholder="搜尋代號或名稱..."
              className="search-input"
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          <button className="theme-toggle" onClick={toggleTheme}>
            {theme === 'dark' ? <Sun size={20} /> : <Moon size={20} />}
          </button>
        </div>
      </header>

      <div className="controls-bar">
        <button 
          onClick={() => setIsPriorityMode(!isPriorityMode)}
          className={`priority-btn ${isPriorityMode ? 'active' : ''}`}
        >
          <Zap size={14} fill={isPriorityMode ? 'currentColor' : 'none'} />
          連買 3 週優先置頂: {isPriorityMode ? '開啟' : '關閉'}
        </button>
      </div>

      <motion.div className="table-container" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
        <table>
          <thead>
            <tr>
              <th onClick={() => requestSort('id')}>股票名稱/代號 {getSortIcon('id')}</th>
              <th onClick={() => requestSort('price')}>現價 {getSortIcon('price')}</th>
              <th onClick={() => requestSort('premium')}>溢價 (%) {getSortIcon('premium')}</th>
              <th onClick={() => requestSort('buyWeeks')}>連買週 {getSortIcon('buyWeeks')}</th>
              <th onClick={() => requestSort('foreign_hold')}>外資持股 {getSortIcon('foreign_hold')}</th>
              <th className="hide-mobile" onClick={() => requestSort('industry')}>產業 {getSortIcon('industry')}</th>
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
                  className={isPriorityMode && item.buyWeeks >= 3 ? 'priority-row' : ''}
                >
                  <td data-label="股票名稱/代號">
                    <div className="stock-name">
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <span className="name-text">{item.name}</span>
                        {item.buyWeeks >= 3 && <Zap size={14} color="var(--success)" fill="var(--success)" />}
                      </div>
                      <span className="stock-id">{item.id}</span>
                    </div>
                  </td>
                  <td data-label="現價" className="price-cell">{item.price}</td>
                  <td data-label="溢價 (%)" className={item.premium > 5 ? 'premium-high' : ''}>
                    {item.premium}%
                  </td>
                  <td data-label="連買週">
                    <div className="buy-weeks">
                      <TrendingUp size={16} color={item.buyWeeks >= 3 ? 'var(--success)' : 'var(--text-secondary)'} />
                      <span className={item.buyWeeks >= 3 ? 'success-text' : ''}>{item.buyWeeks} 週</span>
                    </div>
                  </td>
                  <td data-label="外資持股">
                    <div className="foreign-hold">
                      <PieChart size={14} color="var(--accent-color)" />
                      {item.foreign_hold}%
                    </div>
                  </td>
                  <td data-label="產業" className="hide-mobile">
                    <div className="industry-cell">
                      <Layers size={14} color="var(--text-secondary)" />
                      {item.industry}
                    </div>
                  </td>
                  <td data-label="產業地位">
                    <div className="status-tag">
                      <Award size={14} />
                      <span>{item.status}</span>
                    </div>
                  </td>
                </motion.tr>
              ))}
            </AnimatePresence>
          </tbody>
        </table>
      </motion.div>

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

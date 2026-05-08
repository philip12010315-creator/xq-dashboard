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
  Heart 
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import stockData from './data.json';

function App() {
  const [searchTerm, setSearchTerm] = useState('');
  const [theme, setTheme] = useState('dark');
  const [sortConfig, setSortConfig] = useState({ key: 'buyWeeks', direction: 'desc' });
  const [isPriorityMode, setIsPriorityMode] = useState(true);
  const [activeTab, setActiveTab] = useState('home');
  const [favorites, setFavorites] = useState(() => {
    const saved = localStorage.getItem('xq_favorites');
    return saved ? JSON.parse(saved) : [];
  });

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
  }, [theme]);

  useEffect(() => {
    localStorage.setItem('xq_favorites', JSON.stringify(favorites));
  }, [favorites]);

  const toggleTheme = () => setTheme(prev => prev === 'dark' ? 'light' : 'dark');

  const toggleFavorite = (e, id) => {
    e.stopPropagation();
    setFavorites(prev => 
      prev.includes(id) ? prev.filter(f => f !== id) : [...prev, id]
    );
  };

  const sortedData = useMemo(() => {
    let items = [...stockData];
    if (activeTab === 'favorites') {
      items = items.filter(item => favorites.includes(item.id));
    }
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
  }, [stockData, sortConfig, searchTerm, isPriorityMode, activeTab, favorites]);

  const requestSort = (key) => {
    let direction = 'desc';
    if (sortConfig.key === key && sortConfig.direction === 'desc') direction = 'asc';
    setSortConfig({ key, direction });
  };

  const getSortIcon = (key) => {
    if (sortConfig.key !== key) return <ArrowUpDown size={14} style={{ opacity: 0.3 }} />;
    return sortConfig.direction === 'desc' ? ' ▼' : ' ▲';
  };

  const isFavoritesView = activeTab === 'favorites';

  return (
    <div className="app-container">
      <header className="dashboard-header">
        <div className="logo-section">
          <div style={{ display: 'flex', alignItems: 'center', gap: '1.5rem' }}>
            <motion.h1 initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }}>
              XQ 智慧監控清單
            </motion.h1>
            
            <button 
              className={`nav-btn-desktop ${isFavoritesView ? 'active' : ''}`}
              onClick={() => setActiveTab(activeTab === 'home' ? 'favorites' : 'home')}
              style={{ padding: '0.4rem 1rem' }}
            >
              <Heart size={16} fill={isFavoritesView ? '#ff4b2b' : 'none'} color={isFavoritesView ? '#ff4b2b' : 'currentColor'} />
              <span>{isFavoritesView ? '顯示全部' : '我的自選'}</span>
              {favorites.length > 0 && <span className="count-badge">{favorites.length}</span>}
            </button>
          </div>
          
          <div className="hide-mobile">
            <p>大戶籌碼、外資持股與產業追蹤系統</p>
          </div>
        </div>

        <div className="header-actions">
          <button className="theme-toggle" onClick={toggleTheme}>
            {theme === 'dark' ? <Sun size={20} /> : <Moon size={20} />}
          </button>
          
          <div className="search-container">
            <Search className="search-icon" size={18} />
            <input 
              type="text" 
              placeholder="搜尋代號或名稱..."
              className="search-input"
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
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

      <motion.div 
        className={`table-container ${isFavoritesView ? 'favorites-mode-active' : ''}`}
        initial={{ opacity: 0, y: 20 }} 
        animate={{ opacity: 1, y: 0 }}
      >
        {sortedData.length === 0 ? (
          <div style={{ padding: '6rem 2rem', textAlign: 'center' }}>
            <motion.div initial={{ scale: 0.8 }} animate={{ scale: 1 }}>
              <Heart size={48} color="var(--text-secondary)" style={{ marginBottom: '1rem', opacity: 0.2 }} />
              <p style={{ color: 'var(--text-secondary)', fontSize: '1.1rem' }}>
                {isFavoritesView ? '您的自選清單空空如也' : '找不到相關股票'}
              </p>
            </motion.div>
          </div>
        ) : (
          <table>
            <thead>
              <tr>
                <th onClick={() => requestSort('id')}>股票名稱/代號 {getSortIcon('id')}</th>
                {!isFavoritesView && (
                  <>
                    <th onClick={() => requestSort('price')}>現價 {getSortIcon('price')}</th>
                    <th onClick={() => requestSort('premium')}>溢價 (%) {getSortIcon('premium')}</th>
                    <th onClick={() => requestSort('buyWeeks')}>連買週 {getSortIcon('buyWeeks')}</th>
                    <th onClick={() => requestSort('foreign_hold')}>外資持股 {getSortIcon('foreign_hold')}</th>
                    <th className="hide-mobile" onClick={() => requestSort('industry')}>產業 {getSortIcon('industry')}</th>
                  </>
                )}
                <th>產業地位</th>
              </tr>
            </thead>
            <tbody>
              <AnimatePresence>
                {sortedData.map((item) => (
                  <motion.tr 
                    key={item.id} layout initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                    className={isPriorityMode && item.buyWeeks >= 3 ? 'priority-row' : ''}
                  >
                    <td data-label="股票名稱/代號">
                      <div className="stock-name">
                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                            <span className="name-text">{item.name}</span>
                            {item.buyWeeks >= 3 && <Zap size={14} color="var(--success)" fill="var(--success)" />}
                          </div>
                          <motion.button 
                            whileTap={{ scale: 1.5 }}
                            onClick={(e) => toggleFavorite(e, item.id)}
                            style={{ 
                              background: 'none', border: 'none', cursor: 'pointer',
                              color: favorites.includes(item.id) ? '#ff4b2b' : 'var(--text-secondary)',
                              padding: '4px'
                            }}
                          >
                            <Heart size={22} fill={favorites.includes(item.id) ? '#ff4b2b' : 'none'} />
                          </motion.button>
                        </div>
                        <span className="stock-id">{item.id}</span>
                      </div>
                    </td>
                    
                    {!isFavoritesView && (
                      <>
                        <td data-label="現價" className="price-cell">{item.price}</td>
                        <td data-label="溢價 (%)" className={item.premium > 5 ? 'premium-high' : ''}>{item.premium}%</td>
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
                      </>
                    )}

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
        )}
      </motion.div>

      <nav className="bottom-nav">
        <div className={`nav-item ${activeTab === 'home' ? 'active' : ''}`} onClick={() => setActiveTab('home')}>
          <Home size={26} />
          <span>儀表板</span>
        </div>
        <div className={`nav-item ${isFavoritesView ? 'active' : ''}`} onClick={() => setActiveTab('favorites')}>
          <div style={{ position: 'relative' }}>
            <Heart size={26} fill={isFavoritesView ? '#ff4b2b' : 'none'} color={isFavoritesView ? '#ff4b2b' : 'currentColor'} />
            {favorites.length > 0 && <span className="mobile-badge">{favorites.length}</span>}
          </div>
          <span>自選股</span>
        </div>
      </nav>
    </div>
  );
}

export default App;

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
  Heart,
  ChevronDown,
  ChevronUp,
  Calendar,
  Users,
  ListFilter
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
// 移除靜態 import，改用動態 fetch 以避免手機版快取問題


// 資料初始化移至組件內部


function App() {
  const [searchTerm, setSearchTerm] = useState('');
  const [theme, setTheme] = useState('dark');
  const [sortConfig, setSortConfig] = useState({ key: 'buyWeeks', direction: 'desc' });
  const [isPriorityMode, setIsPriorityMode] = useState(true);
  const [activeTab, setActiveTab] = useState('home');
  const [isMobile, setIsMobile] = useState(window.innerWidth <= 600);
  const [expandedRows, setExpandedRows] = useState([]);
  const [favorites, setFavorites] = useState(() => {
    const saved = localStorage.getItem('xq_favorites');
    return saved ? JSON.parse(saved) : [];
  });

  // --- 新增資料讀取邏輯 ---
  const [data, setData] = useState({ stocks: [], updateDate: '' });
  const [loading, setLoading] = useState(true);

  const stockData = data.stocks || [];
  const displayDate = data.updateDate || new Date().toLocaleDateString('zh-TW', { year: 'numeric', month: '2-digit', day: '2-digit' });

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        // 使用時間戳記強迫繞過瀏覽器快取 (Cache Busting)
        const timestamp = new Date().getTime();
        const response = await fetch(`./data.json?t=${timestamp}`);
        const jsonData = await response.json();
        setData(jsonData);
      } catch (error) {
        console.error("無法讀取最新資料:", error);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);
  // -----------------------


  useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth <= 600);
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

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

  const toggleRow = (id) => {
    if (!isMobile) return;
    setExpandedRows(prev => 
      prev.includes(id) ? prev.filter(rowId => rowId !== id) : [...prev, id]
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
      if (isMobile) {
        const aPriority = a.buyWeeks >= 3 ? 1 : 0;
        const bPriority = b.buyWeeks >= 3 ? 1 : 0;
        if (aPriority !== bPriority) return bPriority - aPriority;
        return a.premium - b.premium;
      }
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
  }, [stockData, sortConfig, searchTerm, isPriorityMode, activeTab, favorites, isMobile]);

  const requestSort = (key) => {
    if (isMobile) return;
    let direction = 'desc';
    if (sortConfig.key === key && sortConfig.direction === 'desc') direction = 'asc';
    setSortConfig({ key, direction });
  };

  const getSortIcon = (key) => {
    if (isMobile) return null;
    if (sortConfig.key !== key) return <ArrowUpDown size={14} style={{ opacity: 0.3 }} />;
    return sortConfig.direction === 'desc' ? ' ▼' : ' ▲';
  };

  const isFavoritesView = activeTab === 'favorites';

  return (
    <div className="app-container">
      <header className="dashboard-header">
        <div className="logo-section">
          <div style={{ display: 'flex', alignItems: 'center', gap: '1.2rem' }}>
            <motion.h1 initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }}>
              XQ 智慧監控清單
            </motion.h1>
            
            <button 
              className={`nav-btn-desktop premium-btn ${isFavoritesView ? 'active' : ''}`}
              onClick={() => setActiveTab(activeTab === 'home' ? 'favorites' : 'home')}
            >
              <Heart size={16} fill={isFavoritesView ? '#ff4b2b' : 'none'} color={isFavoritesView ? '#ff4b2b' : 'currentColor'} />
              <span>{isFavoritesView ? '顯示全部' : '我的自選'}</span>
              {favorites.length > 0 && <span className="count-badge">{favorites.length}</span>}
            </button>
          </div>
          
          <div className="hide-mobile" style={{ marginTop: '0.4rem' }}>
            <p style={{ fontSize: '0.9rem', opacity: 0.7 }}>大戶籌碼、外資持股與產業追蹤系統</p>
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

      {/* 功能列 */}
      <div className="controls-bar" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <button 
          onClick={() => setIsPriorityMode(!isPriorityMode)}
          className={`priority-btn ${isPriorityMode ? 'active' : ''} ${isMobile ? 'hide-mobile' : ''}`}
        >
          <Zap size={14} fill={isPriorityMode ? 'currentColor' : 'none'} />
          大戶連增優先: {isPriorityMode ? '開啟' : '關閉'}
        </button>

        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
          {/* 符合檔數移至此處 */}
          <div className="date-badge count-indicator">
            <ListFilter size={14} />
            <span>符合檔數：{stockData.length} 檔</span>
          </div>

          <div className="date-badge">
            <Calendar size={14} />
            <span>數據更新呈現：{displayDate}</span>
          </div>
        </div>
      </div>

      <motion.div 
        className={`table-container ${isFavoritesView ? 'favorites-mode-active' : ''}`}
        initial={{ opacity: 0, y: 20 }} 
        animate={{ opacity: 1, y: 0 }}
      >
        {loading ? (
          <div style={{ padding: '8rem 2rem', textAlign: 'center' }}>
            <motion.div 
              animate={{ rotate: 360 }}
              transition={{ repeat: Infinity, duration: 1, ease: "linear" }}
              style={{ display: 'inline-block', marginBottom: '1rem' }}
            >
              <Zap size={32} color="var(--accent-color)" />
            </motion.div>
            <p style={{ color: 'var(--text-secondary)' }}>正在獲取最新數據...</p>
          </div>
        ) : sortedData.length === 0 ? (
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
            {!isMobile && (
              <thead>
                <tr>
                  <th onClick={() => requestSort('id')}>股票名稱/代號 {getSortIcon('id')}</th>
                  {!isFavoritesView && (
                    <>
                      <th onClick={() => requestSort('price')}>現價 {getSortIcon('price')}</th>
                      <th onClick={() => requestSort('premium')}>溢價 (%) {getSortIcon('premium')}</th>
                      <th onClick={() => requestSort('buyWeeks')}>大戶連增 {getSortIcon('buyWeeks')}</th>
                      <th onClick={() => requestSort('major_hold')}>大戶持股% {getSortIcon('major_hold')}</th>
                      <th onClick={() => requestSort('foreign_hold')}>外資持股% {getSortIcon('foreign_hold')}</th>
                      <th className="hide-mobile" onClick={() => requestSort('industry')}>產業 {getSortIcon('industry')}</th>
                    </>
                  )}
                  <th>產業地位</th>
                </tr>
              </thead>
            )}
            <tbody>
              <AnimatePresence initial={false}>
                {sortedData.map((item) => (
                  <motion.tr 
                    key={item.id} layout initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                    className={`${isPriorityMode && item.buyWeeks >= 3 ? 'priority-row' : ''} ${isMobile ? 'mobile-card-row' : ''}`}
                    onClick={() => toggleRow(item.id)}
                  >
                    <td data-label="股票名稱/代號">
                      <div className="stock-name">
                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                            <span className="name-text">{item.name}</span>
                            {item.buyWeeks >= 3 && <Zap size={14} color="var(--success)" fill="var(--success)" />}
                          </div>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
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
                            {isMobile && (
                              <motion.div animate={{ rotate: expandedRows.includes(item.id) ? 180 : 0 }}>
                                <ChevronDown size={20} color="var(--text-secondary)" />
                              </motion.div>
                            )}
                          </div>
                        </div>
                        <span className="stock-id">{item.id}</span>
                      </div>
                    </td>
                    
                    {isMobile && expandedRows.includes(item.id) && !isFavoritesView && (
                      <>
                        <td data-label="現價" className="detail-td"><span className="price-cell">{item.price}</span></td>
                        <td data-label="溢價 (%)" className="detail-td"><span className={item.premium > 5 ? 'premium-high' : ''}>{item.premium}%</span></td>
                        <td data-label="大戶連增" className="detail-td">
                          <div className="buy-weeks">
                            <TrendingUp size={16} color={item.buyWeeks >= 3 ? 'var(--success)' : 'var(--text-secondary)'} />
                            <span>{item.buyWeeks} 週</span>
                          </div>
                        </td>
                        <td data-label="大戶持股%" className="detail-td">
                          <div className="foreign-hold">
                            <Users size={14} color="var(--accent-color)" />
                            {item.major_hold}%
                          </div>
                        </td>
                        <td data-label="外資持股%" className="detail-td">
                          <div className="foreign-hold">
                            <PieChart size={14} color="#00d2ff" />
                            {item.foreign_hold}%
                          </div>
                        </td>
                      </>
                    )}

                    {!isMobile && !isFavoritesView && (
                      <>
                        <td data-label="現價" className="price-cell">{item.price}</td>
                        <td data-label="溢價 (%)" className={item.premium > 5 ? 'premium-high' : ''}>{item.premium}%</td>
                        <td data-label="大戶連增">
                          <div className="buy-weeks">
                            <TrendingUp size={16} color={item.buyWeeks >= 3 ? 'var(--success)' : 'var(--text-secondary)'} />
                            <span className={item.buyWeeks >= 3 ? 'success-text' : ''}>{item.buyWeeks} 週</span>
                          </div>
                        </td>
                        <td data-label="大戶持股%">
                          <div className="foreign-hold">
                            <Users size={14} color="var(--accent-color)" />
                            {item.major_hold}%
                          </div>
                        </td>
                        <td data-label="外資持股%">
                          <div className="foreign-hold">
                            <PieChart size={14} color="#00d2ff" />
                            {item.foreign_hold}%
                          </div>
                        </td>
                        {!isMobile && (
                          <td data-label="產業" className="hide-mobile">
                            <div className="industry-cell">
                              <Layers size={14} color="var(--text-secondary)" />
                              {item.industry}
                            </div>
                          </td>
                        )}
                      </>
                    )}

                    {(!isMobile || expandedRows.includes(item.id) || isFavoritesView) && (
                      <td data-label="產業地位">
                        <div className="status-tag">
                          <Award size={14} />
                          <span>{item.status}</span>
                        </div>
                      </td>
                    )}
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
          <span>首頁</span>
        </div>
        <div className={`nav-item ${isFavoritesView ? 'active' : ''}`} onClick={() => setActiveTab('favorites')}>
          <div style={{ position: 'relative' }}>
            <Heart size={26} fill={isFavoritesView ? '#ff4b2b' : 'none'} color={isFavoritesView ? '#ff4b2b' : 'currentColor'} />
            {favorites.length > 0 && <span className="mobile-badge">{favorites.length}</span>}
          </div>
          <span>收藏</span>
        </div>
      </nav>
    </div>
  );
}

export default App;

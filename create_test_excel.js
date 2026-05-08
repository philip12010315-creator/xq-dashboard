const XLSX = require('xlsx');

// 建立測試資料
const data = [
    { '代碼': '2330', '名稱': '台積電', '收盤價': 810, '漲跌': 10, '漲跌幅': 1.25, '外資買超': 5000, '成交量': 30000 },
    { '代碼': '2317', '名稱': '鴻海', '收盤價': 160, '漲跌': 5, '漲跌幅': 3.22, '外資買超': 12000, '成交量': 80000 },
    { '代碼': '2454', '名稱': '聯發科', '收盤價': 1100, '漲跌': -10, '漲跌幅': -0.9, '外資買超': -500, '成交量': 5000 }
];

const ws = XLSX.utils.json_to_sheet(data);
const wb = XLSX.utils.book_new();
XLSX.utils.book_append_sheet(wb, ws, 'Sheet1');

XLSX.writeFile(wb, 'export.xlsx');
console.log('✅ 測試用 export.xlsx 已產生');

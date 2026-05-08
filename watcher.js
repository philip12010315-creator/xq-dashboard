const fs = require('fs');
const { execSync } = require('child_process');
const path = require('path');

console.log('🚀 全自動監控模式已啟動...');
console.log('正在監控 Excel/CSV 檔案變更...');

// 執行更新與推送的函式
function runSync() {
    try {
        console.log(`\n[${new Date().toLocaleTimeString()}] 偵測到變更，開始同步...`);
        
        // 1. 執行處理程式
        console.log('-> 正在轉換資料...');
        execSync('node excel-processor.js', { stdio: 'inherit' });
        
        // 2. 執行 Git 推送
        console.log('-> 正在同步至雲端...');
        execSync('git add .', { stdio: 'inherit' });
        execSync('git commit -m "Auto-sync data"', { stdio: 'inherit' });
        execSync('git push', { stdio: 'inherit' });
        
        console.log('✅ 同步完成！網頁已更新。');
    } catch (error) {
        console.error('❌ 同步失敗:', error.message);
    }
}

// 監控當前資料夾
let timer = null;
fs.watch('.', (eventType, filename) => {
    if (filename && (filename.endsWith('.csv') || filename.endsWith('.xlsx'))) {
        // 防抖動處理：避免檔案儲存中連續觸發
        clearTimeout(timer);
        timer = setTimeout(() => {
            runSync();
        }, 1000); 
    }
});

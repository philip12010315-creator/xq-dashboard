const fs = require('fs');
const { execSync } = require('child_process');
const path = require('path');

console.log('🚀 全自動監控模式已啟動...');
console.log('正在監控 Excel/CSV 檔案變更...');

function runSync() {
    try {
        console.log(`\n[${new Date().toLocaleTimeString()}] 偵測到變更，開始同步...`);
        
        // 修正：這裡要呼叫 .cjs 版本
        execSync('node excel-processor.cjs', { stdio: 'inherit' });
        
        execSync('git add .', { stdio: 'inherit' });
        execSync('git commit -m "Auto-sync data"', { stdio: 'inherit' });
        execSync('git push', { stdio: 'inherit' });
        console.log('✅ 同步完成！網頁已更新。');
    } catch (error) {
        console.error('❌ 同步失敗:', error.message);
    }
}

let timer = null;
fs.watch('.', (eventType, filename) => {
    if (filename && (filename.endsWith('.csv') || filename.endsWith('.xlsx'))) {
        clearTimeout(timer);
        timer = setTimeout(() => {
            runSync();
        }, 1000); 
    }
});

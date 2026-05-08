const fs = require('fs');
const { execSync } = require('child_process');
const path = require('path');

console.log('🚀 全域自動監控模式已啟動...');
console.log('正在監控 數據檔案、程式碼 及 紀錄文件 變更...');

function runSync() {
    try {
        console.log(`\n[${new Date().toLocaleTimeString()}] 偵測到變動，開始處理...`);
        
        // 1. 執行轉換 (不論變動的是什麼，跑一下轉換確保 data.json 是最新的)
        execSync('node excel-processor.cjs', { stdio: 'inherit' });
        
        // 2. 智慧判斷：檢查 git 是否有任何東西要更新 (包括代碼、報告、數據)
        const status = execSync('git status --porcelain').toString().trim();
        
        if (status) {
            console.log('-> 發現變更（數據/代碼/報告），正在同步至 GitHub...');
            execSync('git add .', { stdio: 'inherit' });
            execSync('git commit -m "Auto-sync update"', { stdio: 'inherit' });
            execSync('git push', { stdio: 'inherit' });
            console.log('✅ 同步完成！雲端已全面更新。');
        } else {
            console.log('ℹ️ 內容無實質變動，已跳過同步。');
        }
    } catch (error) {
        if (!error.message.includes('nothing to commit')) {
            console.error('❌ 發生錯誤:', error.message);
        }
    }
}

let timer = null;
fs.watch('.', { recursive: true }, (eventType, filename) => {
    // 排除掉不需監控的資料夾
    if (filename && (filename.includes('node_modules') || filename.includes('.git') || filename.includes('dist'))) return;

    // 監控 數據檔、程式檔 (.jsx, .css, .cjs, .js)、文件檔 (.md)
    const ext = path.extname(filename);
    if (['.csv', '.xlsx', '.jsx', '.css', '.cjs', '.js', '.md', '.json', '.bat'].includes(ext)) {
        clearTimeout(timer);
        timer = setTimeout(() => {
            runSync();
        }, 1500); // 稍微加長防抖時間，避免連續存檔觸發多次
    }
});

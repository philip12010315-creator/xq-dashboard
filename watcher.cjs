const fs = require('fs');
const { execSync } = require('child_process');
const path = require('path');

console.log('🚀 專業級全域監控模式已啟動...');
console.log('正在監控 數據、代碼 及 紀錄，並已開啟自動防干擾機制...');

let isRunning = false;
let lastRunTime = 0;
const COOLDOWN_MS = 10000; // 執行完後強制冷卻 10 秒，避免被雲端硬碟同步干擾

function runSync() {
    const now = Date.now();
    if (isRunning || (now - lastRunTime < COOLDOWN_MS)) return;

    isRunning = true;
    try {
        console.log(`\n[${new Date().toLocaleTimeString()}] 偵測到有效變動，開始檢查...`);
        
        // 1. 執行轉換
        execSync('node excel-processor.cjs', { stdio: 'inherit' });
        
        // 2. 智慧判斷：檢查 git 是否有實質變更
        const status = execSync('git status --porcelain').toString().trim();
        
        if (status) {
            console.log('-> 發現數據/代碼更新，同步至 GitHub...');
            execSync('git add .', { stdio: 'inherit' });
            execSync('git commit -m "Auto-sync update"', { stdio: 'inherit' });
            execSync('git push', { stdio: 'inherit' });
            console.log('✅ 同步完成！雲端已更新。');
        } else {
            console.log('ℹ️ 內容相同，已跳過。');
        }
    } catch (error) {
        if (!error.message.includes('nothing to commit')) {
            console.error('❌ 同步失敗:', error.message);
        }
    } finally {
        isRunning = false;
        lastRunTime = Date.now();
        console.log(`⏱ 進入 10 秒冷卻期，保護磁碟中...`);
    }
}

let timer = null;
fs.watch('.', { recursive: true }, (eventType, filename) => {
    if (!filename) return;

    // 1. 絕對不監控的項目：
    if (filename.includes('node_modules') || 
        filename.includes('.git') || 
        filename.includes('dist') ||
        filename.includes('src/data.json') || // 最重要的排除：不要監控產出的結果
        filename.includes('package-lock.json')) return;

    // 2. 只監控特定副檔名
    const ext = path.extname(filename);
    if (['.csv', '.xlsx', '.jsx', '.css', '.cjs', '.js', '.md'].includes(ext)) {
        clearTimeout(timer);
        timer = setTimeout(() => {
            runSync();
        }, 3000); // 增加防抖時間到 3 秒
    }
});

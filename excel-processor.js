const fs = require('fs');
const path = require('path');
const xlsx = require('xlsx');

// 尋找目錄下最新的 .csv 或 .xlsx 檔案
const files = fs.readdirSync('.').filter(f => f.endsWith('.csv') || f.endsWith('.xlsx'));
if (files.length === 0) {
    console.error('找不到 Excel 或 CSV 檔案！');
    process.exit(1);
}

// 取得最新的檔案
const latestFile = files.sort((a, b) => fs.statSync(b).mtime - fs.statSync(a).mtime)[0];
console.log(`正在讀取檔案: ${latestFile}`);

const workbook = xlsx.readFile(latestFile, { codepage: 950 }); // 支援 Big5
const sheetName = workbook.SheetNames[0];
const sheet = workbook.Sheets[sheetName];
const data = xlsx.utils.sheet_to_json(sheet, { header: 1 });

const result = [];
let updateDate = "";

// 精確抓取中文日期格式: 2026年 5月 8日
for (let row of data) {
    for (let cell of row) {
        if (typeof cell === 'string') {
            // 匹配 "2026年 5月 8日" 或 "2026/05/08" 等格式
            const cnMatch = cell.match(/(\d{4})\s*年\s*(\d{1,2})\s*月\s*(\d{1,2})\s*日/);
            const standardMatch = cell.match(/(\d{4})[\/\-\.](\d{1,2})[\/\-\.](\d{1,2})/);
            
            if (cnMatch) {
                updateDate = `${cnMatch[1]}/${cnMatch[2].padStart(2,'0')}/${cnMatch[3].padStart(2,'0')}`;
                break;
            } else if (standardMatch) {
                updateDate = `${standardMatch[1]}/${standardMatch[2].padStart(2,'0')}/${standardMatch[3].padStart(2,'0')}`;
                break;
            }
        }
    }
    if (updateDate) break;
}

// 備援方案：如果內容真的抓不到，才用檔案時間
if (!updateDate) {
    const stats = fs.statSync(latestFile);
    const d = stats.mtime;
    updateDate = `${d.getFullYear()}/${(d.getMonth()+1).toString().padStart(2,'0')}/${d.getDate().toString().padStart(2,'0')}`;
}

// 從第 5 行開始讀取資料 (跳過標題區域)
for (let i = 4; i < data.length; i++) {
    const row = data[i];
    if (!row || !row[1]) continue; // 確保有代碼

    result.push({
        id: row[1],           // 代碼
        name: row[2],         // 商品 (名稱)
        price: row[3],        // 成交
        premium: row[8] || 0, // 溢價
        buyWeeks: row[9] || 0, // 連買週數
        foreign_hold: row[10] || 0, // 外資持股
        industry: row[11] || "未分類",
        status: row[12] || "觀察中"
    });
}

const output = {
    updateDate: updateDate,
    stocks: result
};

fs.writeFileSync('src/data.json', JSON.stringify(output, null, 2));
console.log(`處理完成！偵測到日期: ${updateDate}`);

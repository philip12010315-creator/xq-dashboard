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
let updateDate = "未知";

// 嘗試抓取日期 (通常 XQ 匯出的第一行或檔名會有日期)
// 這裡假設從資料內容中尋找日期格式
for (let row of data) {
    for (let cell of row) {
        if (typeof cell === 'string' && cell.match(/\d{4}\/\d{2}\/\d{2}/)) {
            updateDate = cell.match(/\d{4}\/\d{2}\/\d{2}/)[0];
            break;
        }
    }
    if (updateDate !== "未知") break;
}

// 如果內容沒抓到，就用檔案最後修改日期
if (updateDate === "未知") {
    const stats = fs.statSync(latestFile);
    updateDate = stats.mtime.toLocaleDateString('zh-TW');
}

// 從第 4 行開始讀取資料 (跳過標題)
for (let i = 3; i < data.length; i++) {
    const row = data[i];
    if (!row || !row[0]) continue;

    result.push({
        id: row[0],           // 股票代號
        name: row[1],         // 股票名稱
        price: row[2],        // 現價
        premium: row[8] || 0, // 溢價 (根據之前腳本的索引)
        buyWeeks: row[9] || 0, // 連買週數
        foreign_hold: row[10] || 0, // 外資持股
        industry: row[11] || "未分類",
        status: row[12] || "觀察中"
    });
}

// 儲存包含日期的 JSON
const output = {
    updateDate: updateDate,
    stocks: result
};

fs.writeFileSync('src/data.json', JSON.stringify(output, null, 2));
console.log(`處理完成！共 ${result.length} 支股票。更新日期: ${updateDate}`);

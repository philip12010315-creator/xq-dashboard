const fs = require('fs');
const path = require('path');
const xlsx = require('xlsx');

// 尋找目錄下最新的 .csv 或 .xlsx 檔案
const files = fs.readdirSync('.').filter(f => f.endsWith('.csv') || f.endsWith('.xlsx'));
if (files.length === 0) {
    console.error('找不到 Excel 或 CSV 檔案！');
    process.exit(1);
}

const latestFile = files.sort((a, b) => fs.statSync(b).mtime - fs.statSync(a).mtime)[0];
console.log(`正在讀取檔案: ${latestFile}`);

const workbook = xlsx.readFile(latestFile, { codepage: 950 });
const sheetName = workbook.SheetNames[0];
const sheet = workbook.Sheets[sheetName];
const data = xlsx.utils.sheet_to_json(sheet, { header: 1 });

let result = [];
let updateDate = "";
let headerIndex = -1;
let colMap = {};

// 1. 抓取日期 & 定位標題行
for (let i = 0; i < data.length; i++) {
    const row = data[i];
    for (let j = 0; j < row.length; j++) {
        const cell = String(row[j] || "");
        
        // 抓日期
        if (!updateDate) {
            const cnMatch = cell.match(/(\d{4})\s*年\s*(\d{1,2})\s*月\s*(\d{1,2})\s*日/);
            const standardMatch = cell.match(/(\d{4})[\/\-\.](\d{1,2})[\/\-\.](\d{1,2})/);
            if (cnMatch) updateDate = `${cnMatch[1]}/${cnMatch[2].padStart(2,'0')}/${cnMatch[3].padStart(2,'0')}`;
            else if (standardMatch) updateDate = `${standardMatch[1]}/${standardMatch[2].padStart(2,'0')}/${standardMatch[3].padStart(2,'0')}`;
        }

        // 定位標題行 (尋找關鍵字)
        if (cell.includes("代碼") || cell.includes("商品")) {
            headerIndex = i;
        }
    }
}

// 2. 建立標題對應地圖
if (headerIndex !== -1) {
    const headers = data[headerIndex];
    headers.forEach((h, idx) => {
        const title = String(h || "");
        if (title.includes("代碼")) colMap.id = idx;
        if (title.includes("商品")) colMap.name = idx;
        if (title.includes("目前股價") || title.includes("收盤價")) colMap.price = idx;
        if (title.includes("溢價%")) colMap.premium = idx;
        if (title.includes("大戶連增週")) colMap.buyWeeks = idx;
        if (title.includes("大戶持股%")) colMap.major_hold = idx;
        if (title.includes("外資持股%")) colMap.foreign_hold = idx;
        if (title.includes("產業地位")) colMap.status = idx;
        if (title.includes("產業") && !title.includes("地位")) colMap.industry = idx;
    });
}

console.log("偵測到的欄位位置:", colMap);

// 3. 抓取資料
if (headerIndex !== -1) {
    for (let i = headerIndex + 1; i < data.length; i++) {
        const row = data[i];
        if (!row || !row[colMap.id]) continue;

        result.push({
            id: String(row[colMap.id] || ""),
            name: String(row[colMap.name] || ""),
            price: row[colMap.price] || 0,
            premium: row[colMap.premium] || 0,
            buyWeeks: parseInt(String(row[colMap.buyWeeks] || "0").replace(/[^0-9]/g, "")) || 0,
            major_hold: row[colMap.major_hold] || 0,
            foreign_hold: row[colMap.foreign_hold] || 0,
            industry: row[colMap.industry] || "未分類",
            status: row[colMap.status] || "觀察中"
        });
    }
}

// 備援日期
if (!updateDate) {
    const d = fs.statSync(latestFile).mtime;
    updateDate = `${d.getFullYear()}/${(d.getMonth()+1).toString().padStart(2,'0')}/${d.getDate().toString().padStart(2,'0')}`;
}

const output = { updateDate, stocks: result };
fs.writeFileSync('src/data.json', JSON.stringify(output, null, 2));
console.log(`處理完成！共 ${result.length} 檔標的，日期: ${updateDate}`);

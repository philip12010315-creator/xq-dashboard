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

// 強化日期偵測 (支援 / , - , 或純數字)
for (let row of data) {
    for (let cell of row) {
        if (typeof cell === 'string') {
            const match = cell.match(/(\d{4}[\/\-\.]\d{1,2}[\/\-\.]\d{1,2})|(\d{8})/);
            if (match) {
                updateDate = match[0];
                break;
            }
        }
    }
    if (updateDate) break;
}

// 如果內容沒抓到，就用檔案最後修改日期
if (!updateDate) {
    const stats = fs.statSync(latestFile);
    const d = stats.mtime;
    updateDate = `${d.getFullYear()}/${(d.getMonth()+1).toString().padStart(2,'0')}/${d.getDate().toString().padStart(2,'0')}`;
}

// 標準化日期格式為 YYYY/MM/DD
if (updateDate.length === 8 && !updateDate.includes('/')) {
    updateDate = `${updateDate.substring(0,4)}/${updateDate.substring(4,6)}/${updateDate.substring(6,8)}`;
}
updateDate = updateDate.replace(/[\-\.]/g, '/');

// 從第 4 行開始讀取資料 (跳過標題)
for (let i = 3; i < data.length; i++) {
    const row = data[i];
    if (!row || !row[0]) continue;

    result.push({
        id: row[0],
        name: row[1],
        price: row[2],
        premium: row[8] || 0,
        buyWeeks: row[9] || 0,
        foreign_hold: row[10] || 0,
        industry: row[11] || "未分類",
        status: row[12] || "觀察中"
    });
}

const output = {
    updateDate: updateDate,
    stocks: result
};

fs.writeFileSync('src/data.json', JSON.stringify(output, null, 2));
console.log(`處理完成！更新日期: ${updateDate}`);

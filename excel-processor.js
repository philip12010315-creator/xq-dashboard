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

const workbook = xlsx.readFile(latestFile, { codepage: 950 });
const sheetName = workbook.SheetNames[0];
const sheet = workbook.Sheets[sheetName];
const data = xlsx.utils.sheet_to_json(sheet, { header: 1 });

const result = [];
let updateDate = "";

// 抓取日期
for (let row of data) {
    for (let cell of row) {
        if (typeof cell === 'string') {
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

if (!updateDate) {
    const stats = fs.statSync(latestFile);
    const d = stats.mtime;
    updateDate = `${d.getFullYear()}/${(d.getMonth()+1).toString().padStart(2,'0')}/${d.getDate().toString().padStart(2,'0')}`;
}

// 讀取資料 (適配新增的大戶持股欄位)
for (let i = 4; i < data.length; i++) {
    const row = data[i];
    if (!row || !row[1]) continue;

    result.push({
        id: row[1],
        name: row[2],
        price: row[3],
        premium: row[9] || 0,        // 溢價% (欄位往後移)
        major_hold: row[13] || 0,    // 大戶持股% (新增輸出欄位 7，對應索引 13)
        buyWeeks: row[10] || 0,      // 大戶連增週 (連買週)
        foreign_hold: row[14] || 0,  // 外資持股%
        industry: row[17] || "未分類", // 產業
        status: row[18] || "觀察中"    // 產業地位
    });
}

const output = {
    updateDate: updateDate,
    stocks: result
};

fs.writeFileSync('src/data.json', JSON.stringify(output, null, 2));
console.log(`處理完成！偵測到日期: ${updateDate}`);

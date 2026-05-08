const fs = require('fs');
const path = require('path');
const xlsx = require('xlsx');

const FIXED_FILENAME_CSV = '成本+大小+人數.csv';
const FIXED_FILENAME_XLSX = '成本+大小+人數.xlsx';

let targetFile = "";

if (fs.existsSync(FIXED_FILENAME_XLSX)) {
    targetFile = FIXED_FILENAME_XLSX;
} else if (fs.existsSync(FIXED_FILENAME_CSV)) {
    targetFile = FIXED_FILENAME_CSV;
} else {
    const files = fs.readdirSync('.').filter(f => f.endsWith('.csv') || f.endsWith('.xlsx'));
    if (files.length > 0) {
        targetFile = files.sort((a, b) => fs.statSync(b).mtime - fs.statSync(a).mtime)[0];
    }
}

if (!targetFile) {
    console.error('找不到任何 Excel 或 CSV 檔案！');
    process.exit(1);
}

console.log(`🚀 正在處理核心檔案: ${targetFile}`);

const workbook = xlsx.readFile(targetFile, { codepage: 950 });
const sheetName = workbook.SheetNames[0];
const sheet = workbook.Sheets[sheetName];
const data = xlsx.utils.sheet_to_json(sheet, { header: 1 });

let result = [];
let updateDate = "";
let headerIndex = -1;
let colMap = {};

for (let i = 0; i < data.length; i++) {
    const row = data[i];
    for (let j = 0; j < row.length; j++) {
        const cell = String(row[j] || "").trim();
        if (!updateDate) {
            const cnMatch = cell.match(/(\d{4})\s*年\s*(\d{1,2})\s*月\s*(\d{1,2})\s*日/);
            const standardMatch = cell.match(/(\d{4})[\/\-\.](\d{1,2})[\/\-\.](\d{1,2})/);
            if (cnMatch) updateDate = `${cnMatch[1]}/${cnMatch[2].padStart(2,'0')}/${cnMatch[3].padStart(2,'0')}`;
            else if (standardMatch) updateDate = `${standardMatch[1]}/${standardMatch[2].padStart(2,'0')}/${standardMatch[3].padStart(2,'0')}`;
        }
        if (cell.includes("代碼") || cell.includes("商品")) {
            headerIndex = i;
        }
    }
}

if (headerIndex !== -1) {
    const headers = data[headerIndex];
    headers.forEach((h, idx) => {
        const title = String(h || "").trim();
        if (title.includes("代碼") && colMap.id === undefined) colMap.id = idx;
        if (title.includes("商品") && colMap.name === undefined) colMap.name = idx;
        if ((title.includes("成交") || title.includes("收盤") || title.includes("目前股價")) && colMap.price === undefined) colMap.price = idx;
        if (title.includes("溢價") && colMap.premium === undefined) colMap.premium = idx;
        if (title.includes("大戶連增") && colMap.buyWeeks === undefined) colMap.buyWeeks = idx;
        if (title.includes("大戶持股") && colMap.major_hold === undefined) colMap.major_hold = idx;
        if (title.includes("外資") && (title.includes("持股") || title.includes("比例")) && colMap.foreign_hold === undefined) colMap.foreign_hold = idx;
        if (title.includes("產業地位") && colMap.status === undefined) colMap.status = idx;
        if (title.includes("產業") && !title.includes("地位") && colMap.industry === undefined) colMap.industry = idx;
    });
}

function superClean(val) {
    if (val === undefined || val === null || val === "") return 0;
    if (typeof val === 'number') return val;
    const cleaned = String(val).replace(/[^0-9.\-]/g, "");
    const num = parseFloat(cleaned);
    return isNaN(num) ? 0 : num;
}

if (headerIndex !== -1) {
    for (let i = headerIndex + 1; i < data.length; i++) {
        const row = data[i];
        if (!row || !row[colMap.id]) continue;
        result.push({
            id: String(row[colMap.id] || "").trim(),
            name: String(row[colMap.name] || "").trim(),
            price: superClean(row[colMap.price]),
            premium: superClean(row[colMap.premium]),
            buyWeeks: Math.floor(superClean(row[colMap.buyWeeks])),
            major_hold: superClean(row[colMap.major_hold]),
            foreign_hold: superClean(row[colMap.foreign_hold]),
            industry: String(row[colMap.industry] || "未分類").trim(),
            status: String(row[colMap.status] || "觀察中").trim()
        });
    }
}

if (!updateDate) {
    const d = fs.statSync(targetFile).mtime;
    updateDate = `${d.getFullYear()}/${(d.getMonth()+1).toString().padStart(2,'0')}/${d.getDate().toString().padStart(2,'0')}`;
}

const output = { updateDate, stocks: result };
fs.writeFileSync('src/data.json', JSON.stringify(output, null, 2));
console.log(`✅ 同步成功！檔案：${targetFile}，共 ${result.length} 檔。`);

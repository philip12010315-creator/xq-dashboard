const fs = require('fs');
const path = require('path');
const xlsx = require('xlsx');

/**
 * 【配置區】欄位關鍵字定義
 * 如果未來 XQ 輸出的欄位名稱有變，只需修改這裡的 keywords 即可。
 */
const COLUMN_CONFIG = {
    id:             { keywords: ["代碼"], required: true },
    name:           { keywords: ["商品", "名稱"], required: true },
    price:          { keywords: ["目前股價", "收盤", "成交"], required: true },
    foreign_cost:   { keywords: ["外資成本"], required: false },
    premium:        { keywords: ["溢價%"], required: false },
    buyWeeks:       { keywords: ["大戶連增週"], required: false },
    retail_streak:  { keywords: ["散戶連減週"], required: false },
    holders_streak: { keywords: ["人數連減週"], required: false },
    major_hold:     { keywords: ["大戶持股%"], required: false },
    foreign_hold:   { keywords: ["外資持股%"], required: false },
    change_percent: { keywords: ["今日漲跌%"], required: false },
    launch_price:   { keywords: ["發動價(1.04)"], required: false },
    target1:        { keywords: ["目標1(1.2)"], required: false },
    target2:        { keywords: ["目標2(1.4)"], required: false },
    target3:        { keywords: ["目標3(1.7)"], required: false },
    industry:       { keywords: ["產業"], required: false },
    status:         { keywords: ["產業地位"], required: false }
};

// 設定固定檔名
const FIXED_FILENAME_CSV = '成本+大小+人數.csv';
const FIXED_FILENAME_XLSX = '成本+大小+人數.xlsx';

let targetFile = "";

// 1. 尋找目標檔案
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
    console.error('❌ 找不到任何 Excel 或 CSV 檔案！');
    process.exit(1);
}

console.log(`🚀 正在處理核心檔案: ${targetFile}`);

// 2. 讀取資料 (支援 Big5 編碼)
const workbook = xlsx.readFile(targetFile, { codepage: 950 });
const sheet = workbook.Sheets[workbook.SheetNames[0]];
const rawData = xlsx.utils.sheet_to_json(sheet, { header: 1 });

let result = [];
let updateDate = "";
let headerIndex = -1;
let colMap = {};

// 3. 定位標題行與更新日期
for (let i = 0; i < rawData.length; i++) {
    const row = rawData[i];
    for (let j = 0; j < row.length; j++) {
        const cell = String(row[j] || "").trim();
        
        // 抓取日期
        if (!updateDate) {
            const dateMatch = cell.match(/(\d{4})[\/\-年\.]\s*(\d{1,2})[\/\-月\.]\s*(\d{1,2})/);
            if (dateMatch) {
                updateDate = `${dateMatch[1]}/${dateMatch[2].padStart(2,'0')}/${dateMatch[3].padStart(2,'0')}`;
            }
        }

        // 偵測標題行
        if (cell === "代碼" || cell === "商品") {
            headerIndex = i;
        }
    }
    if (headerIndex !== -1 && updateDate) break;
}

// 4. 建立欄位映射
if (headerIndex !== -1) {
    const headers = rawData[headerIndex];
    Object.keys(COLUMN_CONFIG).forEach(key => {
        const config = COLUMN_CONFIG[key];
        const foundIdx = headers.findIndex(h => 
            config.keywords.some(k => String(h || "").includes(k))
        );
        if (foundIdx !== -1) {
            colMap[key] = foundIdx;
        } else if (config.required) {
            console.warn(`⚠️ 警告：找不到必要欄位「${config.keywords[0]}」`);
        }
    });
}

// 數據清洗工具
function superClean(val) {
    if (val === undefined || val === null || val === "") return 0;
    if (typeof val === 'number') return val;
    const cleaned = String(val).replace(/[^0-9.\-]/g, "");
    const num = parseFloat(cleaned);
    return isNaN(num) ? 0 : num;
}

// 5. 抓取資料並組建物件
if (headerIndex !== -1) {
    for (let i = headerIndex + 1; i < rawData.length; i++) {
        const row = rawData[i];
        if (!row || !row[colMap.id]) continue;

        const stock = {};
        Object.keys(colMap).forEach(key => {
            const val = row[colMap[key]];
            // 根據類型決定處理方式
            if (["name", "industry", "status", "id"].includes(key)) {
                stock[key] = String(val || "").trim();
            } else {
                stock[key] = superClean(val);
            }
        });

        // 補足預設值
        if (!stock.industry) stock.industry = "未分類";
        if (!stock.status) stock.status = "觀察中";

        result.push(stock);
    }
}

// 備援日期
if (!updateDate) {
    const d = fs.statSync(targetFile).mtime;
    updateDate = `${d.getFullYear()}/${(d.getMonth()+1).toString().padStart(2,'0')}/${d.getDate().toString().padStart(2,'0')}`;
}

// 6. 輸出 JSON
const output = { updateDate, stocks: result };
const outputPath = path.join('public', 'data.json');

// 確保 public 目錄存在
if (!fs.existsSync('public')) fs.mkdirSync('public');

fs.writeFileSync(outputPath, JSON.stringify(output, null, 2));
console.log(`✅ 同步成功！檔案：${targetFile}`);
console.log(`📊 擷取欄位：${Object.keys(colMap).join(', ')}`);
console.log(`📈 共 ${result.length} 檔股票資料。`);

import XLSX from 'xlsx';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const OUTPUT_FILE = path.join(__dirname, 'src', 'data.json');

function findLatestExcel() {
    const files = fs.readdirSync(__dirname);
    const targetFiles = files.filter(f => f.includes('成本+大小+人數') && (f.endsWith('.xlsx') || f.endsWith('.csv')));
    if (targetFiles.length === 0) return null;
    return targetFiles.map(f => ({
        name: f,
        time: fs.statSync(path.join(__dirname, f)).mtime.getTime()
    })).sort((a, b) => b.time - a.time)[0].name;
}

function processExcel() {
    const excelFile = findLatestExcel();
    if (!excelFile) return;

    try {
        const fileBuffer = fs.readFileSync(path.join(__dirname, excelFile));
        const workbook = XLSX.read(fileBuffer, { type: 'buffer', codepage: 950 });
        const sheetName = workbook.SheetNames[0];
        const worksheet = workbook.Sheets[sheetName];
        const rows = XLSX.utils.sheet_to_json(worksheet, { header: 1 });

        // 根據圖片，標題在第 4 行 (index 3)，資料從第 5 行 (index 4)
        const dataRows = rows.slice(4); 

        const formattedData = dataRows.map(row => {
            if (!row || row.length < 5) return null;

            // 欄位對應 (根據圖片索引)：
            // B(1):代碼, C(2):名稱, D(3):成交(現價), E(4):漲幅%
            // I(8):溢價%, J(9):大戶連增(連買週)
            // T(19):產業, V(21):所有選股產業地位
            
            const id = (row[1] || '').toString();
            const name = (row[2] || '').toString();
            if (!id || id === '代碼') return null;

            return {
                id: id,
                name: name,
                price: parseFloat(row[3] || 0),
                percent: parseFloat(row[4] || 0),
                premium: parseFloat(row[8] || 0),         // 溢價%
                buyWeeks: parseInt(row[9] || 0),         // 連買週 (大戶連增)
                foreign_hold: parseFloat(row[12] || 0),  // 外資持股% (M 欄)
                industry: row[19] || '未知',             // 產業
                status: row[21] || '無'                  // 產業地位
            };
        }).filter(item => item !== null);

        fs.writeFileSync(OUTPUT_FILE, JSON.stringify(formattedData, null, 2));
        console.log(`✅ 成功處理 ${formattedData.length} 筆資料！`);
    } catch (error) {
        console.error('❌ 處理失敗:', error.message);
    }
}

processExcel();

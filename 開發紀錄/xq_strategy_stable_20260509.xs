// === 外資初升段精選：籌碼三重鎖定 + 排除金融股 (終極完整版) ===
// 備份日期：2026-05-09

variable: fCost(0), fHoldingRatio(0), Premium(0);
variable: LaunchPrice(0), Target1(0), Target2(0), Target3(0);
variable: MajorStreak(0), RetailStreak(0), HoldersStreak(0);

// 1. 讀取基礎數據 (日數據)
fCost = GetField("外資成本", "D");
fHoldingRatio = GetField("外資持股比例", "D");

// 2. 籌碼三重鎖信標計算 (使用 xf_GetValue 確保跨週對比精確)

// (1) 大戶 400張以上
variable: m_series(0), m0(0), m1(0), m2(0), m3(0);
m_series = GetField("大戶持股比例", "W", param:=400); 
m0 = xf_GetValue("W", m_series, 0); 
m1 = xf_GetValue("W", m_series, 1); 
m2 = xf_GetValue("W", m_series, 2); 
m3 = xf_GetValue("W", m_series, 3); 

MajorStreak = 0;
if m0 >= m1 then MajorStreak = 1;
if m0 >= m1 and m1 >= m2 then MajorStreak = 2;
if m0 >= m1 and m1 >= m2 and m2 >= m3 then MajorStreak = 3;

// (2) 散戶 50張以下
variable: r_series(0), r0(0), r1(0), r2(0), r3(0);
r_series = GetField("散戶持股比例", "W", param:=50);
r0 = xf_GetValue("W", r_series, 0);
r1 = xf_GetValue("W", r_series, 1);
r2 = xf_GetValue("W", r_series, 2);
r3 = xf_GetValue("W", r_series, 3);

RetailStreak = 0;
if r0 <= r1 then RetailStreak = 1;
if r0 <= r1 and r1 <= r2 then RetailStreak = 2;
if r0 <= r1 and r1 <= r2 and r2 <= r3 then RetailStreak = 3;

// (3) 總股東人數
variable: h_series(0), h0(0), h1(0), h2(0), h3(0);
h_series = GetField("總股東人數", "W");
h0 = xf_GetValue("W", h_series, 0);
h1 = xf_GetValue("W", h_series, 1);
h2 = xf_GetValue("W", h_series, 2);
h3 = xf_GetValue("W", h_series, 3);

HoldersStreak = 0;
if h0 <= h1 then HoldersStreak = 1;
if h0 <= h1 and h1 <= h2 then HoldersStreak = 2;
if h0 <= h1 and h1 <= h2 and h2 <= h3 then HoldersStreak = 3;

// 3. 計算價格進場區間 (基於外資成本)
LaunchPrice = fCost * 1.04; 
Target1 = fCost * 1.2;      
Target2 = fCost * 1.4;      
Target3 = fCost * 1.7;      

// 4. 核心篩選條件
// 條件一：排除金融股 (28, 58, 60 開頭)
condition1 = (LeftStr(Symbol, 2) <> "28" and LeftStr(Symbol, 2) <> "58" and LeftStr(Symbol, 2) <> "60");

// 條件二：價格位於外資成本發動區 (1.04 ~ 1.2 倍)
condition2 = (close >= LaunchPrice and close <= Target1);

// 條件三：基本門檻 (成交量 > 500, 外資持股 > 10%, 有外資成本數據)
condition3 = (volume > 500 and fHoldingRatio >= 10 and fCost > 0);

// 條件四：籌碼三重鎖 (大戶、散戶、總人數 均達成最新連續兩週優化趨勢)
condition4 = (MajorStreak >= 2 and RetailStreak >= 2 and HoldersStreak >= 2);

// 5. 執行篩選
if condition1 and condition2 and condition3 and condition4 then
begin
    ret = 1;
end;

// 6. 輸出清單欄位
Premium = iff(fCost > 0, (close/fCost - 1) * 100, 0);

outputfield(1, fCost, 2, "外資成本");
outputfield(2, close, 2, "目前股價");
outputfield(3, Premium, 1, "溢價%");
outputfield(4, MajorStreak, 0, "大戶連增週");
outputfield(5, RetailStreak, 0, "散戶連減週");
outputfield(6, HoldersStreak, 0, "人數連減週");
outputfield(7, m0, 2, "大戶持股%");
outputfield(8, fHoldingRatio, 1, "外資持股%");
outputfield(9, GetField("漲跌幅", "D"), 1, "今日漲跌%");
outputfield(10, LaunchPrice, 2, "發動價(1.04)");
outputfield(11, Target1, 2, "目標1(1.2)");
outputfield(12, Target2, 2, "目標2(1.4)");
outputfield(13, Target3, 2, "目標3(1.7)");

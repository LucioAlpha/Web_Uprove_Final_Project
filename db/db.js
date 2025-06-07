const sqlite3 = require('sqlite3').verbose();
const path = require('path');
const fs = require('fs');
const csv = require('csv-parser');

// 資料庫檔案路徑
const dbPath = path.join(__dirname, 'sqlite.db');

// 開啟資料庫（若不存在則自動建立）
const db = new sqlite3.Database(dbPath, (err) => {
  if (err) {
    console.error('無法開啟資料庫:', err.message);
  } else {
    console.log('成功開啟資料庫:', dbPath);

    const importCsvToTable = (csvPath, tableName, columns) => {
      if (!fs.existsSync(csvPath)) return;
      const rows = [];
      fs.createReadStream(csvPath)
        .pipe(csv())
        .on('data', (data) => {
          // 依照 columns 順序組成 values 陣列
          const values = columns.map(col => data[col]);
          rows.push(values);
        })
        .on('end', () => {
          if (rows.length === 0) return;
          const placeholders = columns.map(() => '?').join(',');
          const sql = `INSERT INTO "${tableName}" (${columns.map(c => `\"${c}\"`).join(',')}) VALUES (${placeholders})`;
          db.serialize(() => {
            const stmt = db.prepare(sql);
            rows.forEach(row => stmt.run(row));
            stmt.finalize();
            console.log(`已匯入 ${rows.length} 筆資料到 ${tableName}`);
          });
        });
    };

    // 建立 table（若不存在）
    db.serialize(() => {
      db.run(`CREATE TABLE IF NOT EXISTS "中油液化石油氣歷史牌價" (
        '調價日期' INTEGER,
        '家用液化石油氣_經銷商_每公斤元' REAL,
        '工業用丙烷_每公斤元' REAL,
        '工業用丙丁烷_每公斤元' REAL,
        '工業用丁烷_每公斤元' REAL,
        '民營加氣站_每公斤元' REAL,
        '一般民眾_每公斤元' REAL
      )`);
      db.run(`CREATE TABLE IF NOT EXISTS "全國家用桶裝瓦斯均價" (
        '年份' INTEGER,
        '價格' INTEGER
      )`);
      db.run(`CREATE TABLE IF NOT EXISTS "各縣市家用桶裝瓦斯月均價" (
        '縣市名稱' TEXT,
        '查報均價(元/20公斤(桶))' INTEGER,
        '查報日期(年/月)' INTEGER
      )`);
      // 匯入 CSV 資料
      importCsvToTable(
        path.join(__dirname, '中油液化石油氣歷史牌價.csv'),
        '中油液化石油氣歷史牌價',
        ['調價日期','家用液化石油氣_經銷商_每公斤元','工業用丙烷_每公斤元','工業用丙丁烷_每公斤元','工業用丁烷_每公斤元','民營加氣站_每公斤元','一般民眾_每公斤元']
      );
      importCsvToTable(
        path.join(__dirname, '全國家用桶裝瓦斯均價.csv'),
        '全國家用桶裝瓦斯均價',
        ['年份','價格']
      );
      importCsvToTable(
        path.join(__dirname, '各縣市家用桶裝瓦斯月均價.csv'),
        '各縣市家用桶裝瓦斯月均價',
        ['縣市名稱','查報均價(元/20公斤(桶))','查報日期(年/月)']
      );
    });
  }
});

module.exports = db;


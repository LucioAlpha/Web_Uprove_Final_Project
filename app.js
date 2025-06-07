var express = require('express');
var path = require('path');
var cookieParser = require('cookie-parser');
var logger = require('morgan');

const sqlite3 = require('sqlite3').verbose();
const dbPath = path.join(__dirname, 'db', 'sqlite.db');
const db = new sqlite3.Database(dbPath, (err) => {
  if (err) {
    console.error('無法開啟資料庫:', err.message);
  } else {
    console.log('成功連接到資料庫:', dbPath);
  }
});

const cors = require("cors");

var indexRouter = require('./routes/index');
var usersRouter = require('./routes/users');

var app = express();

app.use(logger('dev'));
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(cookieParser());
app.use(express.static(path.join(__dirname, 'public')));
app.use(cors());

app.use('/', indexRouter);
app.use('/users', usersRouter);

// ========== API: 顯示資料 ==========
app.post('/api/history', (req, res) => {
  db.all('SELECT * FROM 中油液化石油氣歷史牌價', (err, rows) => {
    if (err) return res.status(500).json({ error: '資料查詢失敗' });
    res.json(rows);
  });
});
app.post('/api/national', (req, res) => {
  db.all('SELECT * FROM 全國家用桶裝瓦斯均價', (err, rows) => {
    if (err) return res.status(500).json({ error: '資料查詢失敗' });
    res.json(rows);
  });
});
app.post('/api/local', (req, res) => {
  db.all('SELECT * FROM 各縣市家用桶裝瓦斯月均價', (err, rows) => {
    if (err) return res.status(500).json({ error: '資料查詢失敗' });
    res.json(rows);
  });
});
// ========== API: 新增資料 ==========
app.post('/api/insert/History', (req, res) => {
  const { date, dealer, propane, propylene, butane, station, public: publicPrice } = req.body;
  if (!date || !dealer || !propane || !propylene || !butane || !station || !publicPrice) {
    return res.status(400).send('缺少必要參數');
  }
  const checkSql = 'SELECT COUNT(*) as count FROM 中油液化石油氣歷史牌價 WHERE 調價日期 = ?';
  db.get(checkSql, [date], (err, row) => {
    if (err) return res.status(500).send('Internal Server Error');
    if (row.count > 0) {
      return res.status(409).send('資料已存在，請勿重複新增');
    }
    const sql = `INSERT INTO 中油液化石油氣歷史牌價 (
      調價日期, 家用液化石油氣_經銷商_每公斤元, 工業用丙烷_每公斤元, 工業用丙丁烷_每公斤元, 工業用丁烷_每公斤元, 民營加氣站_每公斤元, 一般民眾_每公斤元
    ) VALUES (?, ?, ?, ?, ?, ?, ?)`;
    db.run(sql, [date, dealer, propane, propylene, butane, station, publicPrice], (err) => {
      if (err) return res.status(500).send('Internal Server Error');
      res.send('Insert success');
    });
  });
});
app.post('/api/insert/National', (req, res) => {
  const { year, price } = req.body;
  if (!year || !price) return res.status(400).send('缺少必要參數');
  const checkSql = 'SELECT COUNT(*) as count FROM 全國家用桶裝瓦斯均價 WHERE 年份 = ?';
  db.get(checkSql, [year], (err, row) => {
    if (err) return res.status(500).send('Internal Server Error');
    if (row.count > 0) return res.status(409).send('資料已存在，請勿重複新增');
    const sql = 'INSERT INTO 全國家用桶裝瓦斯均價 (年份, 價格) VALUES (?, ?)';
    db.run(sql, [year, price], (err) => {
      if (err) return res.status(500).send('Internal Server Error');
      res.send('Insert success');
    });
  });
});
app.post('/api/insert/Local', (req, res) => {
  const { city, price, date } = req.body;
  if (!city || !price || !date) return res.status(400).send('缺少必要參數');
  const sql = 'INSERT INTO 各縣市家用桶裝瓦斯月均價 (縣市名稱, 查報均價(元/20公斤(桶)), 查報日期(年/月)) VALUES (?, ?, ?)';
  db.run(sql, [city, price, date], (err) => {
    if (err) return res.status(500).send('Internal Server Error');
    res.send('Insert success');
  });
});
// ========== API: 查詢資料 ==========
// 中油液化石油氣歷史牌價: 年分、年分區間
app.post('/api/query/History', (req, res) => {
  const { year, start, end } = req.body;
  let sql = 'SELECT * FROM 中油液化石油氣歷史牌價';
  let params = [];
  if (year) {
    sql += ' WHERE substr(調價日期, 1, 4) = ?';
    params.push(year);
  } else if (start && end) {
    sql += ' WHERE substr(調價日期, 1, 4) BETWEEN ? AND ?';
    params.push(start, end);
  }
  db.all(sql, params, (err, rows) => {
    if (err) return res.status(500).json({ error: '查詢失敗' });
    res.json(rows);
  });
});
// 全國家用桶裝瓦斯均價: 年分、年份區間
app.post('/api/query/National', (req, res) => {
  const { year, start, end } = req.body;
  let sql = 'SELECT * FROM 全國家用桶裝瓦斯均價';
  let params = [];
  if (year) {
    sql += ' WHERE 年份 = ?';
    params.push(year);
  } else if (start && end) {
    sql += ' WHERE 年份 BETWEEN ? AND ?';
    params.push(start, end);
  }
  db.all(sql, params, (err, rows) => {
    if (err) return res.status(500).json({ error: '查詢失敗' });
    res.json(rows);
  });
});
// 各縣市家用桶裝瓦斯月均價: 年分、年分區間、縣市名稱、區域
app.post('/api/query/Local', (req, res) => {
  const { year, start, end, city, region } = req.body;
  let sql = 'SELECT * FROM 各縣市家用桶裝瓦斯月均價 WHERE 1=1';
  let params = [];
  if (year) {
    sql += ' AND substr(查報日期(年/月), 1, 4) = ?';
    params.push(year);
  } else if (start && end) {
    sql += ' AND substr(查報日期(年/月), 1, 4) BETWEEN ? AND ?';
    params.push(start, end);
  }
  if (city) {
    sql += ' AND 縣市名稱 = ?';
    params.push(city);
  }
  if (region) {
    // 區域查詢: 需自行定義區域對應縣市
    const regionMap = {
      '北': ['台北市','新北市','基隆市','桃園市','新竹市','新竹縣','宜蘭縣'],
      '中': ['台中市','苗栗縣','彰化縣','南投縣','雲林縣'],
      '南': ['高雄市','台南市','嘉義市','嘉義縣','屏東縣','台東縣'],
      '東': ['花蓮縣','台東縣'],
      '離島': ['澎湖縣','金門縣','連江縣']
    };
    const cities = regionMap[region] || [];
    if (cities.length) {
      sql += ` AND 縣市名稱 IN (${cities.map(()=>'?').join(',')})`;
      params.push(...cities);
    }
  }
  db.all(sql, params, (err, rows) => {
    if (err) return res.status(500).json({ error: '查詢失敗' });
    res.json(rows);
  });
});

module.exports = app;

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
  db.all('SELECT * FROM 中油液化石油氣歷史牌價 ORDER BY 調價日期 ASC', (err, rows) => {
    if (err) return res.status(500).json({ error: '資料查詢失敗' });
    res.json(rows);
  });
});
app.post('/api/national', (req, res) => {
  db.all('SELECT * FROM 全國家用桶裝瓦斯均價 ORDER BY 年份 ASC', (err, rows) => {
    if (err) return res.status(500).json({ error: '資料查詢失敗' });
    res.json(rows);
  });
});
app.post('/api/local', (req, res) => {
  db.all('SELECT * FROM 各縣市家用桶裝瓦斯月均價 ORDER BY "查報日期(年/月)" ASC', (err, rows) => {
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
    params.push(year.toString());
  } else if (start && end) {
    sql += ' WHERE substr(調價日期, 1, 4) BETWEEN ? AND ?';
    params.push(start.toString(), end.toString());
  }
  sql += ' ORDER BY 調價日期 ASC';
  db.all(sql, params, (err, rows) => {
    if (err) return res.status(500).json({ error: '查詢失敗' });
    if (!rows || rows.length === 0) return res.status(404).json({ error: '查無資料' });
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
  sql += ' ORDER BY 年份 ASC';
  db.all(sql, params, (err, rows) => {
    if (err) return res.status(500).json({ error: '查詢失敗' });
    res.json(rows);
  });
});
// 各縣市家用桶裝瓦斯月均價: 年分、年分區間、縣市名稱、區域
app.post('/api/query/Local', (req, res) => {
  const { year, start, end, city, region } = req.body;
  let baseSql = 'SELECT * FROM 各縣市家用桶裝瓦斯月均價';
  let conditions = [];
  let params = [];
  if (year) {
    conditions.push('"查報日期(年/月)" BETWEEN ? AND ?');
    params.push(parseInt(year + '01'), parseInt(year + '12'));
  } else if (start && end) {
    conditions.push('"查報日期(年/月)" BETWEEN ? AND ?');
    params.push(parseInt(start + '01'), parseInt(end + '12'));
  }
  if (city) {
    conditions.push('縣市名稱 = ?');
    params.push(city);
  }
  if (region) {
    const regionMap = {
      '北': ['台北市','新北市','基隆市','桃園市','新竹市','新竹縣','宜蘭縣'],
      '中': ['台中市','苗栗縣','彰化縣','南投縣','雲林縣'],
      '南': ['高雄市','台南市','嘉義市','嘉義縣','屏東縣','台東縣'],
      '東': ['花蓮縣','台東縣'],
      '離島': ['澎湖縣','金門縣','連江縣']
    };
    const cities = regionMap[region] || [];
    if (cities.length) {
      conditions.push(`縣市名稱 IN (${cities.map(()=>'?').join(',')})`);
      params.push(...cities);
    }
  }
  let sql = baseSql;
  if (conditions.length > 0) {
    sql += ' WHERE ' + conditions.join(' AND ');
  }
  sql += ' ORDER BY "查報日期(年/月)" ASC';
  // debug log
  console.log('查詢SQL:', sql);
  console.log('參數:', params);
  db.all(sql, params, (err, rows) => {
    if (err) {
      console.error('查詢失敗:', err);
      return res.status(500).json({ error: '查詢失敗' });
    }
    if (!rows || rows.length === 0) return res.status(404).json({ error: '查無資料' });
    res.json(rows);
  });
});
// ========== API: 多條件查詢（Local_history） ==========
app.post('/query/Local', (req, res) => {
  const { start, end, year, city, cities } = req.body;
  let conditions = [];
  let params = [];
  if (start && end) {
    conditions.push('(查報年分 * 100 + 查報月份 >= ? AND 查報年分 * 100 + 查報月份 <= ?)');
    params.push(parseInt(start), parseInt(end));
  } else if (year) {
    conditions.push('查報年分 = ?');
    params.push(parseInt(year));
  }
  if (Array.isArray(cities) && cities.length > 0) {
    conditions.push(`縣市名稱 IN (${cities.map(() => '?').join(',')})`);
    params.push(...cities);
  } else if (city) {
    conditions.push('縣市名稱 = ?');
    params.push(city);
  }
  const where = conditions.length ? 'WHERE ' + conditions.join(' AND ') : '';
  const sql = `SELECT * FROM Local_history ${where}`;
  db.all(sql, params, (err, rows) => {
    if (err) {
      console.error(err);
      return res.status(500).json({ error: '資料查詢失敗' });
    }
    res.json(rows);
  });
});
// ========== API: 多條件查詢（National_history） ==========
app.post('/query/National', (req, res) => {
  const { start, end, year } = req.body;
  let conditions = [];
  let params = [];
  if (start && end) {
    conditions.push('年份 >= ? AND 年份 <= ?');
    params.push(parseInt(start), parseInt(end));
  } else if (year) {
    conditions.push('年份 = ?');
    params.push(parseInt(year));
  }
  const where = conditions.length ? 'WHERE ' + conditions.join(' AND ') : '';
  const sql = `SELECT * FROM National_history ${where} ORDER BY 年份`;
  db.all(sql, params, (err, rows) => {
    if (err) {
      console.error(err);
      return res.status(500).json({ error: '資料查詢失敗' });
    }
    res.json(rows);
  });
});
// ========== API: 多條件查詢（Gas_history） ==========
app.post('/query/Gas', (req, res) => {
  const { start, end, year } = req.body;
  let conditions = [];
  let params = [];
  if (start && end) {
    conditions.push('(年分 >= ? AND 年分 <= ?)');
    params.push(parseInt(start), parseInt(end));
  } else if (year) {
    conditions.push('(年分 >= ? AND 年分 <= ?)');
    params.push(parseInt(year + '0101'), parseInt(year + '1231'));
  }
  const where = conditions.length ? 'WHERE ' + conditions.join(' AND ') : '';
  const sql = `SELECT * FROM Gas_history ${where} ORDER BY 年分, 月份, 日`;
  db.all(sql, params, (err, rows) => {
    if (err) {
      console.error(err);
      return res.status(500).json({ error: '資料查詢失敗' });
    }
    res.json(rows);
  });
});

// ========== 優化：統一多條件查詢 API ==========
function buildQuery({ table, yearField, monthField, dayField, cityField, regionMap, orderBy, req }) {
  const { start, end, year, city, cities, region } = req.body;
  let conditions = [];
  let params = [];
  // 年分/區間查詢
  if (start && end) {
    if (monthField && dayField) {
      // YYYYMMDD 格式
      conditions.push(`(${yearField} >= ? AND ${yearField} <= ?)`);
      params.push(parseInt(start), parseInt(end));
    } else {
      // YYYY 或 YYYYMM 格式
      conditions.push(`${yearField} >= ? AND ${yearField} <= ?`);
      params.push(parseInt(start), parseInt(end));
    }
  } else if (year) {
    if (monthField && dayField) {
      // YYYYMMDD 格式
      conditions.push(`(${yearField} >= ? AND ${yearField} <= ?)`);
      params.push(parseInt(year + '0101'), parseInt(year + '1231'));
    } else {
      // YYYY 或 YYYYMM 格式
      conditions.push(`${yearField} = ?`);
      params.push(parseInt(year));
    }
  }
  // 多選縣市
  if (Array.isArray(cities) && cities.length > 0 && cityField) {
    conditions.push(`${cityField} IN (${cities.map(() => '?').join(',')})`);
    params.push(...cities);
  } else if (city && cityField) {
    conditions.push(`${cityField} = ?`);
    params.push(city);
  }
  // 區域查詢
  if (region && regionMap && cityField) {
    const regionCities = regionMap[region] || [];
    if (regionCities.length) {
      conditions.push(`${cityField} IN (${regionCities.map(() => '?').join(',')})`);
      params.push(...regionCities);
    }
  }
  const where = conditions.length ? 'WHERE ' + conditions.join(' AND ') : '';
  const sql = `SELECT * FROM ${table} ${where} ${orderBy ? orderBy : ''}`;
  return { sql, params };
}

// 優化後的多條件查詢 API
app.post('/query/optimized', (req, res) => {
  const { type } = req.body;
  let config = null;
  const regionMap = {
    '北': ['台北市','新北市','基隆市','桃園市','新竹市','新竹縣','宜蘭縣'],
    '中': ['台中市','苗栗縣','彰化縣','南投縣','雲林縣'],
    '南': ['高雄市','台南市','嘉義市','嘉義縣','屏東縣','台東縣'],
    '東': ['花蓮縣','台東縣'],
    '離島': ['澎湖縣','金門縣','連江縣']
  };
  if (type === 'local_history') {
    config = { table: 'Local_history', yearField: '查報年分', monthField: '查報月份', cityField: '縣市名稱', regionMap };
  } else if (type === 'national_history') {
    config = { table: 'National_history', yearField: '年份', orderBy: 'ORDER BY 年份' };
  } else if (type === 'gas_history') {
    config = { table: 'Gas_history', yearField: '年分', monthField: '月份', dayField: '日', orderBy: 'ORDER BY 年分, 月份, 日' };
  }
  if (!config) return res.status(400).json({ error: 'type 參數錯誤' });
  const { sql, params } = buildQuery({ ...config, req });
  db.all(sql, params, (err, rows) => {
    if (err) return res.status(500).json({ error: '查詢失敗' });
    res.json(rows);
  });
});

module.exports = app;

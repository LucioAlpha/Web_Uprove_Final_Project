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

app.get('/api/history', (req, res) => {
  db.all('SELECT * FROM 中油液化石油氣歷史牌價', (err, rows) => {
    if (err) {
      console.error(err.message);
      return res.status(500).json({ error: '資料查詢失敗' });
    }
    res.json(rows);
  });
});

app.get('/api', (req, res) => {
  const historyYear = req.query.history_year;
  if (!historyYear || !/^\d{4}$/.test(historyYear)) {
    return res.status(400).json({ error: '請提供正確的 history_year 參數 (YYYY)' });
  }
  // 只比對調價日期的前4碼（年份）
  const sql = 'SELECT * FROM 中油液化石油氣歷史牌價 WHERE substr(調價日期, 1, 4) = ?';
  db.all(sql, [historyYear], (err, rows) => {
    if (err) {
      console.error(err.message);
      return res.status(500).send('Internal Server Error');
    }
    res.json(rows);
  });
});

app.post('/api', (req, res) => {
  const historyYear = req.body.history_year;
  if (!historyYear || !/^\d{4}$/.test(historyYear)) {
    return res.status(400).json({ error: '請提供正確的 history_year 參數 (YYYY)' });
  }
  // 只比對調價日期的前4碼（年份）
  const sql = 'SELECT * FROM 中油液化石油氣歷史牌價 WHERE substr(調價日期, 1, 4) = ?';
  db.all(sql, [historyYear], (err, rows) => {
    if (err) {
      console.error(err.message);
      return res.status(500).send('Internal Server Error');
    }
    res.json(rows);
  });
});

app.get('/api/insert', (req, res) => {
  const {
    date,
    dealer,
    propane,
    propylene,
    butane,
    station,
    public
  } = req.query;

  if (!date || !dealer || !propane || !propylene || !butane || !station || !public) {
    return res.status(400).send('缺少必要參數');
  }

  // 先檢查是否重複
  const checkSql = 'SELECT COUNT(*) as count FROM 中油液化石油氣歷史牌價 WHERE 調價日期 = ?';
  db.get(checkSql, [date], (err, row) => {
    if (err) {
      console.error(err.message);
      return res.status(500).send('Internal Server Error');
    }
    if (row.count > 0) {
      return res.status(409).send('資料已存在，請勿重複新增');
    }
    // 若無重複再插入
    const sql = `INSERT INTO 中油液化石油氣歷史牌價 (
      調價日期,
      家用液化石油氣_經銷商_每公斤元,
      工業用丙烷_每公斤元,
      工業用丙丁烷_每公斤元,
      工業用丁烷_每公斤元,
      民營加氣站_每公斤元,
      一般民眾_每公斤元
    ) VALUES (?, ?, ?, ?, ?, ?, ?)`;
    db.run(sql, [date, dealer, propane, propylene, butane, station, public], (err) => {
      if (err) {
        console.error(err.message);
        return res.status(500).send('Internal Server Error');
      }
      res.send('Insert success');
    });
  });
});

app.post('/api/insert', (req, res) => {
  const {
    date,
    dealer,
    propane,
    propylene,
    butane,
    station,
    public: publicPrice
  } = req.body;

  if (!date || !dealer || !propane || !propylene || !butane || !station || !publicPrice) {
    return res.status(400).send('缺少必要參數');
  }

  // 先檢查是否有相同調價日期的資料
  const checkSql = 'SELECT COUNT(*) as count FROM 中油液化石油氣歷史牌價 WHERE 調價日期 = ?';
  db.get(checkSql, [date], (err, row) => {
    if (err) {
      console.error(err.message);
      return res.status(500).send('Internal Server Error');
    }
    if (row.count > 0) {
      // 已存在則更新
      const updateSql = `UPDATE 中油液化石油氣歷史牌價 SET
        家用液化石油氣_經銷商_每公斤元 = ?,
        工業用丙烷_每公斤元 = ?,
        工業用丙丁烷_每公斤元 = ?,
        工業用丁烷_每公斤元 = ?,
        民營加氣站_每公斤元 = ?,
        一般民眾_每公斤元 = ?
        WHERE 調價日期 = ?`;
      db.run(updateSql, [dealer, propane, propylene, butane, station, publicPrice, date], (err) => {
        if (err) {
          console.error(err.message);
          return res.status(500).send('Internal Server Error');
        }
        res.send('Update success');
      });
    } else {
      // 不存在則插入
      const insertSql = `INSERT INTO 中油液化石油氣歷史牌價 (
        調價日期,
        家用液化石油氣_經銷商_每公斤元,
        工業用丙烷_每公斤元,
        工業用丙丁烷_每公斤元,
        工業用丁烷_每公斤元,
        民營加氣站_每公斤元,
        一般民眾_每公斤元
      ) VALUES (?, ?, ?, ?, ?, ?, ?)`;
      db.run(insertSql, [date, dealer, propane, propylene, butane, station, publicPrice], (err) => {
        if (err) {
          console.error(err.message);
          return res.status(500).send('Internal Server Error');
        }
        res.send('Insert success');
      });
    }
  });
});

module.exports = app;

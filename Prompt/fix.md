資料庫中每個資料表的 schema 定義如下：
```sql
CREATE TABLE 'Gas_history' ('年分' INTEGER,'月份' INTEGER,'日' INTEGER,'家用液化石油氣_經銷商_每公斤元' REAL,'工業用丙烷_每公斤元' REAL,'工業用丙丁烷_每公斤元' REAL,'工業用丁烷_每公斤元' REAL,'民營加氣站_每公斤元' REAL,'一般民眾_每公斤元' REAL)
```
```sql
CREATE TABLE "Local_history" ('縣市名稱' TEXT,'查報均價(元/20公斤(桶))' INTEGER,'查報年分' INTEGER,'查報月份' INTEGER)
```
```sql
CREATE TABLE 'National_history' ('年份' INTEGER,'價格' INTEGER)
```

請針對更新過後的資料庫去更新所有的 api 以及 index
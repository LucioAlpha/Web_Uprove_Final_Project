const { createApp } = Vue;

createApp({
  data() {
    return {
      tabs: [
        { label: '首頁', value: 'home' },
        { label: '中油液化石油氣歷史牌價', value: 'history' },
        { label: '全國家用桶裝瓦斯均價', value: 'national' },
        { label: '各縣市家用桶裝瓦斯月均價', value: 'local' }
      ],
      currentTab: 'home',
      showInsert: false,
      insertMsg: '',
      // 表單
      formHistory: { date: '', dealer: '', propane: '', propylene: '', butane: '', station: '', public: '' },
      formNational: { year: '', price: '' },
      formLocal: { city: '', price: '', date: '' },
      // 查詢
      queryYear: '', queryStart: '', queryEnd: '', queryCity: '', queryRegion: '',
      // 資料
      tableData: [],
      tableColumns: [],
      chartId: '',
      chartObj: null,
      // 多圖表支援
      chartNationalOverview: false,
      chartNationalSingleYear: false,
      chartNationalYearRange: false,
      chartNationalOverviewObj: null,
      chartNationalSingleYearObj: null,
      chartNationalYearRangeObj: null,
      // 中油多圖表支援
      chartHistoryYear: false,
      chartHistoryYearRange: false,
      chartHistoryYearObj: null,
      chartHistoryYearRangeObj: null,
      // 各縣市多圖表支援
      chartLocalYear: false,
      chartLocalYearRange: false,
      chartLocalCity: false,
      chartLocalRegion: false,
      chartLocalYearObj: null,
      chartLocalYearRangeObj: null,
      chartLocalCityObj: null,
      chartLocalRegionObj: null
    }
  },
  computed: {
    tabTitle() {
      const t = this.tabs.find(t => t.value === this.currentTab);
      return t ? t.label : '';
    }
  },
  watch: {
    currentTab(val) {
      this.showInsert = false;
      this.insertMsg = '';
      this.tableData = [];
      this.tableColumns = [];
      this.queryYear = this.queryStart = this.queryEnd = this.queryCity = this.queryRegion = '';
      this.destroyAllCharts();
      if (val !== 'home') this.loadAll();
    }
  },
  mounted() {
    if (this.currentTab !== 'home') this.loadAll();
  },
  methods: {
    destroyAllCharts() {
      if (this.chartObj) { this.chartObj.destroy(); this.chartObj = null; }
      if (this.chartNationalOverviewObj) { this.chartNationalOverviewObj.destroy(); this.chartNationalOverviewObj = null; }
      if (this.chartNationalSingleYearObj) { this.chartNationalSingleYearObj.destroy(); this.chartNationalSingleYearObj = null; }
      if (this.chartNationalYearRangeObj) { this.chartNationalYearRangeObj.destroy(); this.chartNationalYearRangeObj = null; }
      // 新增中油圖表銷毀
      if (this.chartHistoryYearObj) { this.chartHistoryYearObj.destroy(); this.chartHistoryYearObj = null; }
      if (this.chartHistoryYearRangeObj) { this.chartHistoryYearRangeObj.destroy(); this.chartHistoryYearRangeObj = null; }
      // 新增各縣市圖表銷毀
      if (this.chartLocalYearObj) { this.chartLocalYearObj.destroy(); this.chartLocalYearObj = null; }
      if (this.chartLocalYearRangeObj) { this.chartLocalYearRangeObj.destroy(); this.chartLocalYearRangeObj = null; }
      if (this.chartLocalCityObj) { this.chartLocalCityObj.destroy(); this.chartLocalCityObj = null; }
      if (this.chartLocalRegionObj) { this.chartLocalRegionObj.destroy(); this.chartLocalRegionObj = null; }
      this.chartId = '';
      this.chartNationalOverview = false;
      this.chartNationalSingleYear = false;
      this.chartNationalYearRange = false;
      // 新增中油圖表顯示控制
      this.chartHistoryYear = false;
      this.chartHistoryYearRange = false;
      // 新增各縣市圖表顯示控制
      this.chartLocalYear = false;
      this.chartLocalYearRange = false;
      this.chartLocalCity = false;
      this.chartLocalRegion = false;
    },
    async loadAll() {
      let url = '';
      if (this.currentTab === 'history') url = '/api/history';
      else if (this.currentTab === 'national') url = '/api/national';
      else if (this.currentTab === 'local') url = '/api/local';
      if (!url) return;
      const res = await fetch(url, { method: 'POST' });
      const data = await res.json();
      this.tableData = data;
      this.tableColumns = data.length ? Object.keys(data[0]) : [];
      
      if (this.currentTab === 'national') {
        this.drawNationalOverviewChart(data);
      } else {
        this.drawChart(data);
      }
    },
    async submitHistory() {
      const res = await fetch('/api/insert/History', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(this.formHistory)
      });
      this.insertMsg = await res.text();
      if (res.ok) { this.loadAll(); this.showInsert = false; this.formHistory = { date: '', dealer: '', propane: '', propylene: '', butane: '', station: '', public: '' }; }
    },
    async submitNational() {
      const res = await fetch('/api/insert/National', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(this.formNational)
      });
      this.insertMsg = await res.text();
      if (res.ok) { this.loadAll(); this.showInsert = false; this.formNational = { year: '', price: '' }; }
    },
    async submitLocal() {
      const res = await fetch('/api/insert/Local', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(this.formLocal)
      });
      this.insertMsg = await res.text();
      if (res.ok) { this.loadAll(); this.showInsert = false; this.formLocal = { city: '', price: '', date: '' }; }
    },
    async querySingle() {
      let url = '', body = {};
      if (!this.queryYear) return;
      if (this.currentTab === 'history') { url = '/api/query/History'; body = { year: this.queryYear }; }
      else if (this.currentTab === 'national') { url = '/api/query/National'; body = { year: this.queryYear }; }
      else if (this.currentTab === 'local') { url = '/api/query/Local'; body = { year: this.queryYear }; }
      const res = await fetch(url, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) });
      const data = await res.json();
      this.tableData = data;
      this.tableColumns = data.length ? Object.keys(data[0]) : [];
      
      if (this.currentTab === 'national') {
        this.drawNationalSingleYearChart(data);
      } else if (this.currentTab === 'history') {
        this.drawHistoryYearChart(data);
      } else if (this.currentTab === 'local') {
        this.drawLocalYearChart(data);
      } else {
        this.drawChart(data);
      }
    },
    async queryRange() {
      let url = '', body = {};
      if (!this.queryStart || !this.queryEnd) return;
      if (this.currentTab === 'history') { url = '/api/query/History'; body = { start: this.queryStart, end: this.queryEnd }; }
      else if (this.currentTab === 'national') { url = '/api/query/National'; body = { start: this.queryStart, end: this.queryEnd }; }
      else if (this.currentTab === 'local') { url = '/api/query/Local'; body = { start: this.queryStart, end: this.queryEnd }; }
      const res = await fetch(url, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) });
      const data = await res.json();
      this.tableData = data;
      this.tableColumns = data.length ? Object.keys(data[0]) : [];
      
      if (this.currentTab === 'national') {
        this.drawNationalYearRangeChart(data);
      } else if (this.currentTab === 'history') {
        this.drawHistoryYearRangeChart(data);
      } else if (this.currentTab === 'local') {
        this.drawLocalYearRangeChart(data);
      } else {
        this.drawChart(data);
      }
    },
    async queryCityFunc() {
      if (!this.queryCity) return;
      const res = await fetch('/api/query/Local', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ city: this.queryCity }) });
      const data = await res.json();
      this.tableData = data;
      this.tableColumns = data.length ? Object.keys(data[0]) : [];
      this.drawLocalCityChart(data);
    },
    async queryRegionFunc() {
      if (!this.queryRegion) return;
      const res = await fetch('/api/query/Local', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ region: this.queryRegion }) });
      const data = await res.json();
      this.tableData = data;
      this.tableColumns = data.length ? Object.keys(data[0]) : [];
      this.drawLocalRegionChart(data);
    },
    drawNationalOverviewChart(data) {
      if (this.chartNationalOverviewObj) { this.chartNationalOverviewObj.destroy(); this.chartNationalOverviewObj = null; }
      if (!data || !data.length) { this.chartNationalOverview = false; return; }
      
      this.chartNationalOverview = true;
      this.$nextTick(() => {
        const ctx = document.getElementById('chartNationalOverview');
        if (!ctx) return;
        
        const labels = data.map(row => row['年份']);
        const datasets = [{
          label: '價格',
          data: data.map(row => row['價格']),
          borderColor: 'rgba(54, 162, 235, 1)',
          backgroundColor: 'rgba(54, 162, 235, 0.2)',
          fill: true,
          tension: 0.2
        }];
        
        this.chartNationalOverviewObj = new Chart(ctx, {
          type: 'line',
          data: { labels, datasets },
          options: { responsive: true, plugins: { legend: { position: 'top' } } }
        });
      });
    },
    drawNationalSingleYearChart(data) {
      if (this.chartNationalSingleYearObj) { this.chartNationalSingleYearObj.destroy(); this.chartNationalSingleYearObj = null; }
      if (!data || !data.length) { this.chartNationalSingleYear = false; return; }
      
      this.chartNationalSingleYear = true;
      this.$nextTick(() => {
        const ctx = document.getElementById('chartNationalSingleYear');
        if (!ctx) return;
        
        const labels = data.map(row => row['年份']);
        const datasets = [{
          label: '價格',
          data: data.map(row => row['價格']),
          borderColor: 'rgba(255, 99, 132, 1)',
          backgroundColor: 'rgba(255, 99, 132, 0.2)',
          fill: true,
          tension: 0.2
        }];
        
        this.chartNationalSingleYearObj = new Chart(ctx, {
          type: 'line',
          data: { labels, datasets },
          options: { responsive: true, plugins: { legend: { position: 'top' } } }
        });
      });
    },
    drawNationalYearRangeChart(data) {
      if (this.chartNationalYearRangeObj) { this.chartNationalYearRangeObj.destroy(); this.chartNationalYearRangeObj = null; }
      if (!data || !data.length) { this.chartNationalYearRange = false; return; }
      
      this.chartNationalYearRange = true;
      this.$nextTick(() => {
        const ctx = document.getElementById('chartNationalYearRange');
        if (!ctx) return;
        
        const labels = data.map(row => row['年份']);
        const datasets = [{
          label: '價格',
          data: data.map(row => row['價格']),
          borderColor: 'rgba(75, 192, 192, 1)',
          backgroundColor: 'rgba(75, 192, 192, 0.2)',
          fill: true,
          tension: 0.2
        }];
        
        this.chartNationalYearRangeObj = new Chart(ctx, {
          type: 'line',
          data: { labels, datasets },
          options: { responsive: true, plugins: { legend: { position: 'top' } } }
        });
      });
    },
    drawChart(data) {
      if (this.chartObj) { this.chartObj.destroy(); this.chartObj = null; }
      if (!data || !data.length) { this.chartId = ''; return; }
      let labels = [], datasets = [], chartId = '';
      if (this.currentTab === 'history') {
        chartId = 'chartHistory';
        labels = data.map(row => row['調價日期']);
        const fields = [
          '家用液化石油氣_經銷商_每公斤元',
          '工業用丙烷_每公斤元',
          '工業用丙丁烷_每公斤元',
          '工業用丁烷_每公斤元',
          '民營加氣站_每公斤元',
          '一般民眾_每公斤元'
        ];
        const colors = [
          'rgba(75, 192, 192, 1)',
          'rgba(255, 99, 132, 1)',
          'rgba(255, 206, 86, 1)',
          'rgba(54, 162, 235, 1)',
          'rgba(153, 102, 255, 1)',
          'rgba(255, 159, 64, 1)'
        ];
        datasets = fields.map((f, i) => ({
          label: f,
          data: data.map(row => row[f]),
          borderColor: colors[i],
          backgroundColor: colors[i],
          fill: false,
          tension: 0.2
        }));
      } else if (this.currentTab === 'local') {
        chartId = 'chartLocal';
        // 依縣市分組，產生多條折線
        const cityMap = {};
        data.forEach(row => {
          const city = row['縣市名稱'];
          if (!cityMap[city]) cityMap[city] = [];
          cityMap[city].push(row);
        });
        // 取得所有月份（x軸）
        const allMonthsSet = new Set();
        Object.values(cityMap).forEach(rows => {
          rows.forEach(row => allMonthsSet.add(row['查報日期(年/月)']));
        });
        const allMonths = Array.from(allMonthsSet).sort();
        labels = allMonths;
        // 每個縣市一條折線
        const colorList = [
          '#e6194b','#3cb44b','#ffe119','#4363d8','#f58231','#911eb4','#46f0f0','#f032e6','#bcf60c','#fabebe',
          '#008080','#e6beff','#9a6324','#fffac8','#800000','#aaffc3','#808000','#ffd8b1','#000075','#808080'
        ];
        let colorIdx = 0;
        datasets = Object.keys(cityMap).map(city => {
          // 依照 allMonths 補齊缺漏月份
          const monthPriceMap = {};
          cityMap[city].forEach(row => {
            monthPriceMap[row['查報日期(年/月)']] = row['查報均價(元/20公斤(桶))'];
          });
          const dataArr = allMonths.map(m => monthPriceMap[m] !== undefined ? monthPriceMap[m] : null);
          const color = colorList[colorIdx % colorList.length];
          colorIdx++;
          return {
            label: city,
            data: dataArr,
            borderColor: color,
            backgroundColor: color + '33',
            fill: false,
            tension: 0.2
          };
        });
      }
      this.chartId = chartId;
      this.$nextTick(() => {
        const ctx = document.getElementById(chartId);
        if (!ctx) return;
        this.chartObj = new Chart(ctx, {
          type: 'line',
          data: { labels, datasets },
          options: { responsive: true, plugins: { legend: { position: 'top' } } }
        });
      });
    },
    drawHistoryYearChart(data) {
      if (this.chartHistoryYearObj) { this.chartHistoryYearObj.destroy(); this.chartHistoryYearObj = null; }
      if (!data || !data.length) { this.chartHistoryYear = false; return; }
      this.chartHistoryYear = true;
      this.$nextTick(() => {
        const ctx = document.getElementById('historyYearChart');
        if (!ctx) return;
        const labels = data.map(row => row['調價日期']);
        const fields = [
          '家用液化石油氣_經銷商_每公斤元',
          '工業用丙烷_每公斤元',
          '工業用丙丁烷_每公斤元',
          '工業用丁烷_每公斤元',
          '民營加氣站_每公斤元',
          '一般民眾_每公斤元'
        ];
        const colors = [
          'rgba(75, 192, 192, 1)',
          'rgba(255, 99, 132, 1)',
          'rgba(255, 206, 86, 1)',
          'rgba(54, 162, 235, 1)',
          'rgba(153, 102, 255, 1)',
          'rgba(255, 159, 64, 1)'
        ];
        const datasets = fields.map((f, i) => ({
          label: f,
          data: data.map(row => row[f]),
          borderColor: colors[i],
          backgroundColor: colors[i],
          fill: false,
          tension: 0.2
        }));
        this.chartHistoryYearObj = new Chart(ctx, {
          type: 'line',
          data: { labels, datasets },
          options: { responsive: true, plugins: { legend: { position: 'top' } } }
        });
      });
    },
    drawHistoryYearRangeChart(data) {
      if (this.chartHistoryYearRangeObj) { this.chartHistoryYearRangeObj.destroy(); this.chartHistoryYearRangeObj = null; }
      if (!data || !data.length) { this.chartHistoryYearRange = false; return; }
      this.chartHistoryYearRange = true;
      this.$nextTick(() => {
        const ctx = document.getElementById('historyYearRangeChart');
        if (!ctx) return;
        const labels = data.map(row => row['調價日期']);
        const fields = [
          '家用液化石油氣_經銷商_每公斤元',
          '工業用丙烷_每公斤元',
          '工業用丙丁烷_每公斤元',
          '工業用丁烷_每公斤元',
          '民營加氣站_每公斤元',
          '一般民眾_每公斤元'
        ];
        const colors = [
          'rgba(75, 192, 192, 1)',
          'rgba(255, 99, 132, 1)',
          'rgba(255, 206, 86, 1)',
          'rgba(54, 162, 235, 1)',
          'rgba(153, 102, 255, 1)',
          'rgba(255, 159, 64, 1)'
        ];
        const datasets = fields.map((f, i) => ({
          label: f,
          data: data.map(row => row[f]),
          borderColor: colors[i],
          backgroundColor: colors[i],
          fill: false,
          tension: 0.2
        }));
        this.chartHistoryYearRangeObj = new Chart(ctx, {
          type: 'line',
          data: { labels, datasets },
          options: { responsive: true, plugins: { legend: { position: 'top' } } }
        });
      });
    },
    updateLocalChart(data, chartDomId, chartObjRefName) {
      if (this[chartObjRefName]) { this[chartObjRefName].destroy(); this[chartObjRefName] = null; }
      if (!data || !data.length) return;
      this.$nextTick(() => {
        const ctx = document.getElementById(chartDomId);
        if (!ctx) return;
        // 依縣市分組，產生多條折線
        const cityMap = {};
        data.forEach(row => {
          const city = row['縣市名稱'];
          if (!cityMap[city]) cityMap[city] = [];
          cityMap[city].push(row);
        });
        // 取得所有月份（x軸）
        const allMonthsSet = new Set();
        Object.values(cityMap).forEach(rows => {
          rows.forEach(row => allMonthsSet.add(row['查報日期(年/月)']));
        });
        const allMonths = Array.from(allMonthsSet).sort();
        const labels = allMonths;
        // 每個縣市一條折線
        const colorList = [
          '#e6194b','#3cb44b','#ffe119','#4363d8','#f58231','#911eb4','#46f0f0','#f032e6','#bcf60c','#fabebe',
          '#008080','#e6beff','#9a6324','#fffac8','#800000','#aaffc3','#808000','#ffd8b1','#000075','#808080'
        ];
        let colorIdx = 0;
        const datasets = Object.keys(cityMap).map(city => {
          // 依照 allMonths 補齊缺漏月份
          const monthPriceMap = {};
          cityMap[city].forEach(row => {
            monthPriceMap[row['查報日期(年/月)']] = row['查報均價(元/20公斤(桶))'];
          });
          const dataArr = allMonths.map(m => monthPriceMap[m] !== undefined ? monthPriceMap[m] : null);
          const color = colorList[colorIdx % colorList.length];
          colorIdx++;
          return {
            label: city,
            data: dataArr,
            borderColor: color,
            backgroundColor: color + '33',
            fill: false,
            tension: 0.2
          };
        });
        this[chartObjRefName] = new Chart(ctx, {
          type: 'line',
          data: { labels, datasets },
          options: { responsive: true, plugins: { legend: { position: 'top' } } }
        });
      });
    },
    drawLocalYearChart(data) {
      this.chartLocalYear = true;
      this.updateLocalChart(data, 'localYearChart', 'chartLocalYearObj');
    },
    drawLocalYearRangeChart(data) {
      this.chartLocalYearRange = true;
      this.updateLocalChart(data, 'localYearRangeChart', 'chartLocalYearRangeObj');
    },
    drawLocalCityChart(data) {
      this.chartLocalCity = true;
      this.updateLocalChart(data, 'localCityChart', 'chartLocalCityObj');
    },
    drawLocalRegionChart(data) {
      this.chartLocalRegion = true;
      this.updateLocalChart(data, 'localRegionChart', 'chartLocalRegionObj');
    },
  }
}).mount('#app');

// Chart.js 與表單、查詢、表格功能整合

document.getElementById('gas_form').addEventListener('submit', async (e) => {
  e.preventDefault();
  // 取得日期並轉為 YYYYMMDD 格式
  const dateInput = document.getElementById('date').value;
  let date = '';
  if (dateInput) {
    const d = new Date(dateInput);
    const yyyy = d.getFullYear();
    const mm = String(d.getMonth() + 1).padStart(2, '0');
    const dd = String(d.getDate()).padStart(2, '0');
    date = `${yyyy}${mm}${dd}`;
  }
  const dealer = document.getElementById('dealer').value;
  const propane = document.getElementById('propane').value;
  const propylene = document.getElementById('propylene').value;
  const butane = document.getElementById('butane').value;
  const station = document.getElementById('station').value;
  const publicPrice = document.getElementById('public').value;
  const res = await fetch('/api/insert', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({date, dealer, propane, propylene, butane, station, public: publicPrice})
  });
  const data = await res.text();
  document.getElementById('log').innerText = data;
  // 新增成功後自動刷新表格
  if (res.ok) loadHistoryTable();
});

// 取得所有歷史牌價資料並顯示於 table，根據調價日期新至遠排序
async function loadHistoryTable() {
  const res = await fetch('/api/history');
  let data = await res.json();
  // 依照調價日期(YYYYMMDD)字串由新到舊排序
  data = data.sort((a, b) => b['調價日期'] - a['調價日期']);
  const container = document.getElementById('history-table-container');
  if (!data || !data.length) {
    container.innerHTML = '<p>查無資料</p>';
    return;
  }
  let html = '<table border="1"><thead><tr>' +
    '<th>調價日期</th>' +
    '<th>家用液化石油氣_經銷商_每公斤元</th>' +
    '<th>工業用丙烷_每公斤元</th>' +
    '<th>工業用丙丁烷_每公斤元</th>' +
    '<th>工業用丁烷_每公斤元</th>' +
    '<th>民營加氣站_每公斤元</th>' +
    '<th>一般民眾_每公斤元</th>' +
    '</tr></thead><tbody>';
  for (const row of data) {
    html += `<tr>` +
      `<td>${row['調價日期']}</td>` +
      `<td>${row['家用液化石油氣_經銷商_每公斤元']}</td>` +
      `<td>${row['工業用丙烷_每公斤元']}</td>` +
      `<td>${row['工業用丙丁烷_每公斤元']}</td>` +
      `<td>${row['工業用丁烷_每公斤元']}</td>` +
      `<td>${row['民營加氣站_每公斤元']}</td>` +
      `<td>${row['一般民眾_每公斤元']}</td>` +
      `</tr>`;
  }
  html += '</tbody></table>';
  container.innerHTML = html;
}

// 單一年分查詢
// ...existing code...
document.getElementById('btnSingleYear').onclick = async function() {
  const year = document.getElementById('singleYear').value;
  if (!year) return alert('請輸入年份');
  const res = await fetch(`/api?history_year=${year}`);
  let data = await res.json();
  data = data.sort((a, b) => b['調價日期'] - a['調價日期']);
  // 折線圖資料
  const labels = data.map(row => String(row['調價日期']).slice(4,8)); // MMDD
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
  const bgColors = [
    'rgba(75, 192, 192, 0.2)',
    'rgba(255, 99, 132, 0.2)',
    'rgba(255, 206, 86, 0.2)',
    'rgba(54, 162, 235, 0.2)',
    'rgba(153, 102, 255, 0.2)',
    'rgba(255, 159, 64, 0.2)'
  ];
  const datasets = fields.map((field, idx) => ({
    label: field,
    data: data.map(row => row[field]).reverse(),
    borderColor: colors[idx],
    backgroundColor: bgColors[idx],
    fill: false,
    tension: 0.1
  }));
  // 畫圖
  const ctx = document.getElementById('chartSingleYear').getContext('2d');
  if(window.chartSingleYearObj) window.chartSingleYearObj.destroy();
  window.chartSingleYearObj = new Chart(ctx, {
    type: 'line',
    data: {
      labels: labels.reverse(),
      datasets: datasets
    },
    options: {
      plugins: { title: { display: true, text: `中油液化石油氣歷史牌價 ${year}` } },
      scales: { x: { title: { display: true, text: '調價日期(MM-DD)' } }, y: { title: { display: true, text: '價格' } } }
    }
  });
  // 表格
  let html = `<h3>中油液化石油氣歷史牌價 ${year}</h3><table border="1"><thead><tr>`+
    '<th>調價日期</th><th>家用液化石油氣_經銷商_每公斤元</th><th>工業用丙烷_每公斤元</th><th>工業用丙丁烷_每公斤元</th><th>工業用丁烷_每公斤元</th><th>民營加氣站_每公斤元</th><th>一般民眾_每公斤元</th></tr></thead><tbody>';
  for(const row of data) {
    html += `<tr><td>${row['調價日期']}</td><td>${row['家用液化石油氣_經銷商_每公斤元']}</td><td>${row['工業用丙烷_每公斤元']}</td><td>${row['工業用丙丁烷_每公斤元']}</td><td>${row['工業用丁烷_每公斤元']}</td><td>${row['民營加氣站_每公斤元']}</td><td>${row['一般民眾_每公斤元']}</td></tr>`;
  }
  html += '</tbody></table>';
  document.getElementById('tableSingleYear').innerHTML = html;
};

// 年份區間查詢
// ...existing code...
document.getElementById('btnRange').onclick = async function() {
    const start = document.getElementById('rangeStart').value;
    const end = document.getElementById('rangeEnd').value;
    if (!start || !end || Number(start) > Number(end)) return alert('請輸入正確的年份區間');

    // Fetch all historical data
    const res = await fetch('/api/history');
    let data = await res.json();

    // Filter data by year range and sort by date (newest to oldest)
    data = data.filter(row => String(row['調價日期']).slice(0, 4) >= start && String(row['調價日期']).slice(0, 4) <= end);
    data = data.sort((a, b) => b['調價日期'] - a['調價日期']);

    // Prepare line chart data
    const labels = data.map(row => {
        const dateStr = String(row['調價日期']);
        return `${dateStr.slice(4, 6)}-${dateStr.slice(6, 8)}`; // Format as MM-DD
    }).reverse(); // Reverse to show oldest to newest on x-axis

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

    const bgColors = [
        'rgba(75, 192, 192, 0.2)',
        'rgba(255, 99, 132, 0.2)',
        'rgba(255, 206, 86, 0.2)',
        'rgba(54, 162, 235, 0.2)',
        'rgba(153, 102, 255, 0.2)',
        'rgba(255, 159, 64, 0.2)'
    ];

    const datasets = fields.map((field, idx) => ({
        label: field,
        data: data.map(row => row[field]).reverse(), // Reverse to match labels
        borderColor: colors[idx],
        backgroundColor: bgColors[idx],
        fill: false,
        tension: 0.1
    }));

    // Create line chart
    const ctx = document.getElementById('chartRange').getContext('2d');
    if (window.chartRangeObj) window.chartRangeObj.destroy();
    window.chartRangeObj = new Chart(ctx, {
        type: 'line',
        data: {
            labels: labels,
            datasets: datasets
        },
        options: {
            plugins: {
                title: {
                    display: true,
                    text: `中油液化石油氣歷史牌價 ${start}-${end}`
                }
            },
            scales: {
                x: {
                    title: {
                        display: true,
                        text: '調價日期(MM-DD)'
                    }
                },
                y: {
                    title: {
                        display: true,
                        text: '價格(元/公斤)'
                    }
                }
            }
        }
    });

    // Generate table
    let html = `<h3>中油液化石油氣歷史牌價 ${start}-${end}</h3><table border="1"><thead><tr>` +
        '<th>調價日期</th><th>家用液化石油氣_經銷商_每公斤元</th><th>工業用丙烷_每公斤元</th><th>工業用丙丁烷_每公斤元</th><th>工業用丁烷_每公斤元</th><th>民營加氣站_每公斤元</th><th>一般民眾_每公斤元</th></tr></thead><tbody>';
    for (const row of data) {
        html += `<tr><td>${row['調價日期']}</td><td>${row['家用液化石油氣_經銷商_每公斤元']}</td><td>${row['工業用丙烷_每公斤元']}</td><td>${row['工業用丙丁烷_每公斤元']}</td><td>${row['工業用丁烷_每公斤元']}</td><td>${row['民營加氣站_每公斤元']}</td><td>${row['一般民眾_每公斤元']}</td></tr>`;
    }
    html += '</tbody></table>';
    document.getElementById('tableRange').innerHTML = html;
};

// 頁面載入時可選擇是否自動載入全部資料表格
 window.onload = loadHistoryTable;


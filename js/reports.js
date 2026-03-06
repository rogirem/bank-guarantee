const Reports = (() => {
  let chartStatuses;
  let chartTypes;

  function ensureCharts() {
    if (!chartStatuses) {
      const canvasStatuses = document.getElementById("chartStatuses");
      chartStatuses = new Chart(canvasStatuses, {
        type: "pie",
        data: { labels: [], datasets: [{ data: [], backgroundColor: ["#b85454", "#20c997", "#ffc107", "#6f42c1", "#fd7e14", "#17a2b8"] }] },
        options: {
          plugins: {
            legend: {
              position: "bottom",
              labels: {
                generateLabels: function(chart) {
                  const data = chart.data;
                  const ds = data.datasets[0];
                  const total = (ds.data || []).reduce((a, b) => a + b, 0);
                  const colors = ds.backgroundColor || [];
                  return (data.labels || []).map((label, i) => {
                    const value = ds.data[i] || 0;
                    const pct = total > 0 ? ((100 * value) / total).toFixed(1) : 0;
                    return {
                      text: `${label}: ${value} (${pct}%)`,
                      fillStyle: colors[i] || "#999",
                      strokeStyle: "#fff",
                      lineWidth: 1,
                      index: i
                    };
                  });
                }
              }
            },
            tooltip: {
              enabled: true,
              callbacks: {
                label: function(context) {
                  const label = context.label || '';
                  const value = context.parsed || 0;
                  const total = context.dataset.data.reduce((a, b) => a + b, 0);
                  const pct = total > 0 ? ((100 * value) / total).toFixed(1) : 0;
                  return label + ': ' + value + ' (' + pct + '%)';
                }
              }
            },
          },
          responsive: true,
          maintainAspectRatio: false,
          animation: false,
          interaction: {
            intersect: false,
          },
          layout: {
            padding: 0
          },
        },
      });
    }
    if (!chartTypes) {
      const canvasTypes = document.getElementById("chartTypes");
      chartTypes = new Chart(canvasTypes, {
        type: "bar",
        data: { labels: [], datasets: [{ label: "Количество", data: [], backgroundColor: "#b85454" }] },
        options: {
          plugins: {
            legend: { display: false },
            tooltip: {
              enabled: true,
              callbacks: {
                label: function(context) {
                  const label = context.label || '';
                  const value = context.parsed.y ?? context.parsed;
                  const arr = context.dataset.data;
                  const total = arr.reduce((a, b) => a + b, 0);
                  const pct = total > 0 ? ((100 * value) / total).toFixed(1) : 0;
                  return label + ': ' + value + ' (' + pct + '%)';
                }
              }
            },
          },
          scales: {
            y: { ticks: { stepSize: 1 } },
            x: { ticks: { maxRotation: 45, minRotation: 45 } },
          },
          responsive: true,
          maintainAspectRatio: false,
          animation: false,
          interaction: {
            intersect: false,
            mode: 'index',
          },
          layout: {
            padding: 0
          },
        },
      });
    }
  }

  function aggregate() {
    const statusCounts = {
      "Новая": 0,
      "Проверяется": 0,
      "Одобрено": 0,
      "Отказ": 0,
      "Выпущена": 0,
      "Зарегистрирована": 0,
    };
    
    const typeCounts = {};
    
    DB.state.applications.forEach((app) => {
      // Подсчет по статусам проверки
      if (app.checkStatus) {
        if (statusCounts[app.checkStatus] !== undefined) {
          statusCounts[app.checkStatus]++;
        }
      }
      
      // Подсчет по статусам выпуска
      if (app.issueStatus === "Выпущена") {
        statusCounts["Выпущена"]++;
      }
      
      // Подсчет по статусам регистрации
      if (app.registrationStatus === "Зарегистрирована") {
        statusCounts["Зарегистрирована"]++;
      }
      
      // Подсчет по типам гарантий
      const typeName = app.guaranteeTypeName || "Неизвестно";
      typeCounts[typeName] = (typeCounts[typeName] || 0) + 1;
    });
    
    return { statusCounts, typeCounts };
  }

  function updateCharts() {
    ensureCharts();
    const { statusCounts, typeCounts } = aggregate();

    // Диаграмма статусов
    const statusLabels = [];
    const statusData = [];
    Object.entries(statusCounts).forEach(([status, count]) => {
      if (count > 0) {
        statusLabels.push(status);
        statusData.push(count);
      }
    });

    chartStatuses.data.labels = statusLabels;
    chartStatuses.data.datasets[0].data = statusData;
    chartStatuses.update('none');

    // Диаграмма типов
    const typeLabels = Object.keys(typeCounts);
    const typeData = Object.values(typeCounts);

    chartTypes.data.labels = typeLabels;
    chartTypes.data.datasets[0].data = typeData;
    chartTypes.update('none');
  }

  function initCharts() {
    ensureCharts();
    updateCharts();
  }

  return { updateCharts, initCharts };
})();

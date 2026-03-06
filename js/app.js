const App = (() => {
  function initMenu() {
    const menuLinks = document.querySelectorAll("#menu .nav-link");
    if (menuLinks.length === 0) {
      console.error("Меню не найдено!");
      return;
    }
    
    menuLinks.forEach((link) => {
      link.addEventListener("click", (e) => {
        e.preventDefault();
        const target = link.dataset.target;
        if (!target) {
          console.error("Атрибут data-target не найден у ссылки меню");
          return;
        }
        document.querySelectorAll("#menu .nav-link").forEach((l) => l.classList.remove("active"));
        link.classList.add("active");
        document.querySelectorAll(".section").forEach((s) => s.classList.remove("active"));
        const targetSection = document.getElementById(target);
        if (targetSection) {
          targetSection.classList.add("active");
        } else {
          console.error(`Секция с id="${target}" не найдена`);
        }
      });
    });
  }

  async function init() {
    try {
      console.log("Инициализация приложения...");
      
      initMenu();
      
      console.log("Загрузка данных из API...");
      await DB.bootstrap();
      console.log("Данные загружены:", {
        clients: DB.state.clients.length,
        applications: DB.state.applications.length,
        staff: DB.state.staff.length
      });
      
      UI.renderClients();
      UI.renderApplicationForm();
      UI.renderApps();
      UI.renderRefs();
      UI.renderHistory();
      UI.renderDocs();
      
      Forms.bind();
      Reports.initCharts();
      Docs.bind();
      
      console.log("Приложение инициализировано успешно!");
    } catch (error) {
      console.error("Ошибка при инициализации приложения:", error);
      alert("Ошибка при загрузке приложения. Проверьте консоль браузера (F12) и убедитесь, что сервер запущен на http://localhost:3000");
    }
  }

  if (document.readyState === 'loading') {
    document.addEventListener("DOMContentLoaded", init);
  } else {
    // DOM уже загружен
    init();
  }
})();

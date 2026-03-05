const Forms = (() => {
  const LIMIT_AMOUNT = 5000000;
  const LIMIT_TERM_DAYS = 365;

  async function handleApplicationSubmit(e) {
    e.preventDefault();
    try {
      const form = new FormData(e.target);
      const clientId = Number(form.get("client"));
      const managerId = Number(form.get("manager"));
      const guaranteeTypeId = Number(form.get("guarantee_type"));
      const amount = Number(form.get("amount"));
      const termDays = Number(form.get("term_days"));
      const beneficiary = form.get("beneficiary");
      const comment = form.get("comment");
      
      if (!clientId || !managerId || !guaranteeTypeId || !amount || !termDays) {
        alert("Заполните все обязательные поля.");
        return;
      }
      if (amount > LIMIT_AMOUNT) {
        alert(`Сумма гарантии не должна превышать ${LIMIT_AMOUNT.toLocaleString("ru-RU")} ₽. Заявка не принята.`);
        return;
      }
      if (termDays > LIMIT_TERM_DAYS) {
        alert(`Срок гарантии не должен превышать ${LIMIT_TERM_DAYS} дн. Заявка не принята.`);
        return;
      }
      
      await DB.addApplication({
        client: clientId,
        manager: managerId,
        guarantee_type: guaranteeTypeId,
        amount: amount,
        term_days: termDays,
        beneficiary: beneficiary,
        comment: comment,
      });
      e.target.reset();
      UI.renderApps();
      UI.renderHistory();
      Reports.updateCharts();
      const selectApplication = document.querySelector("#checkForm select[name='applicationId']");
      if (selectApplication) selectApplication.value = "";
      alert("Заявка принята (сохранено в БД).");
    } catch (error) {
      console.error("Ошибка при создании заявки:", error);
      alert("Ошибка при создании заявки: " + (error.message || "Неизвестная ошибка"));
    }
  }

  async function handleCheckSubmit(e) {
    e.preventDefault();
    const id = new FormData(e.target).get("applicationId");
    if (!id) {
      alert("Выберите заявку из списка.");
      return;
    }
    const app = DB.state.applications.find((a) => a.id === id);
    if (!app) return alert("Заявка не найдена.");
    if (app.checkStatus === "Одобрено" || app.checkStatus === "Отказ") {
      alert("По этой заявке решение уже принято во вкладке «Оценка рисков». Чтобы изменить решение, откройте «Оценка рисков» и примените новое решение.");
      return;
    }
    
    // Упрощенное правило: если сумма <= 5 000 000 → одобрено, иначе отказ
    const approved = app.amount <= 5000000;
    const checkStatus = approved ? "Одобрено" : "Отказ";
    const comment = approved ? "Проверка пройдена, сумма в пределах лимита" : "Сумма превышает лимит в 5 000 000 ₽";
    
    try {
      await DB.updateApplication(app.id, {
        checkStatus: checkStatus,
        stage: "Проверка возможности выдачи",
        historyComment: comment,
      });
      DB.state.lastChecked = approved ? app.id : null;
      const statusEl = document.getElementById("checkStatus");
      if (statusEl) statusEl.value = checkStatus;
      UI.renderApps();
      UI.renderHistory();
      Reports.updateCharts();
      const checkSelect = document.getElementById("checkApplicationId");
      if (checkSelect) checkSelect.value = app.id;
      alert(approved ? "Проверка выполнена. Статус: Одобрено. Теперь можно нажать «Рассчитать условия»." : "Проверка выполнена. Статус: Отказ (сумма превышает лимит 5 000 000 ₽).");
    } catch (err) {
      console.error(err);
      alert("Ошибка при сохранении статуса проверки.");
    }
  }

  async function calculateConditions() {
    const id = document.getElementById("checkApplicationId")?.value;
    if (!id) {
      alert("Выберите заявку в списке «Проверка возможности выдачи».");
      return;
    }
    const app = DB.state.applications.find((a) => a.id === id);
    if (!app || app.checkStatus !== "Одобрено") {
      alert("Для расчёта условий заявка должна быть одобрена. Выберите одобренную заявку или пройдите «Оценка рисков» и получите статус «Одобрено».");
      return;
    }
    
    const tariff = DB.getTariff(app.guaranteeTypeId);
    if (!tariff) {
      alert("Тариф для данного типа гарантии не найден.");
      return;
    }
    
    const commission = Math.max(
      (app.amount * tariff.commissionPercent * app.termDays) / (100 * 365),
      tariff.minCommission
    );
    
    try {
      await DB.updateApplication(app.id, {
        commission: commission,
        stage: "Расчет условий гарантии",
        historyComment: `Комиссия рассчитана: ${UI.formatCurrency(commission)} (${tariff.commissionPercent}% годовых, минимум ${UI.formatCurrency(tariff.minCommission)})`,
      });
      DB.state.lastChecked = app.id;
      UI.renderApps();
      UI.renderHistory();
      Reports.updateCharts();
      const checkSelect = document.getElementById("checkApplicationId");
      if (checkSelect) checkSelect.value = app.id;
      const statusEl = document.getElementById("checkStatus");
      if (statusEl) statusEl.value = app.checkStatus;
      alert("Условия рассчитаны. Комиссия: " + UI.formatCurrency(commission) + ". Можно нажать «Выпустить гарантию».");
    } catch (err) {
      console.error(err);
      alert("Ошибка при расчёте условий.");
    }
  }

  async function issueGuarantee() {
    const id = document.getElementById("checkApplicationId")?.value;
    if (!id) {
      alert("Выберите заявку в списке «Проверка возможности выдачи».");
      return;
    }
    const app = DB.state.applications.find((a) => a.id === id);
    if (!app || app.checkStatus !== "Одобрено") {
      return alert("Заявка должна быть одобрена. Выберите одобренную заявку и при необходимости рассчитайте условия.");
    }
    
    try {
      await DB.updateApplication(app.id, {
        issueStatus: "Выпущена",
        stage: "Выпуск банковской гарантии",
        historyComment: "Банковская гарантия выпущена",
      });
      UI.renderApps();
      UI.renderHistory();
      Reports.updateCharts();
      const checkSelect = document.getElementById("checkApplicationId");
      if (checkSelect) checkSelect.value = app.id;
      alert("Гарантия выпущена. Можно нажать «Зарегистрировать».");
    } catch (err) {
      console.error(err);
      alert("Ошибка при выпуске гарантии.");
    }
  }

  async function registerApplication() {
    const id = document.getElementById("checkApplicationId")?.value;
    if (!id) {
      alert("Выберите заявку в списке «Проверка возможности выдачи».");
      return;
    }
    const app = DB.state.applications.find((a) => a.id === id);
    if (!app || app.issueStatus !== "Выпущена") {
      return alert("Сначала нажмите «Выпустить гарантию» для выбранной заявки.");
    }
    
    try {
      await DB.updateApplication(app.id, {
        registrationStatus: "Зарегистрирована",
        stage: "Регистрация гарантии",
        historyComment: "Гарантия зарегистрирована в реестре",
      });
      UI.renderApps();
      UI.renderHistory();
      UI.renderDocs();
      Reports.updateCharts();
      const checkSelect = document.getElementById("checkApplicationId");
      if (checkSelect) checkSelect.value = app.id;
      alert("Гарантия зарегистрирована. Для этой заявки доступны кнопки «Заявка» и «Договор» для скачивания документов.");
    } catch (err) {
      console.error(err);
      alert("Ошибка при регистрации.");
    }
  }

  async function handleAddClient() {
    const form = document.getElementById("formAddClient");
    if (!form) return;
    const formData = new FormData(form);
    const name = formData.get("name")?.trim() || "";
    const inn = formData.get("inn")?.trim() || "";
    const contact = formData.get("contact")?.trim() || "";
    
    if (!name) {
      alert("Заполните наименование/ФИО.");
      return;
    }
    
    try {
      const clientId = await DB.addClient(name, inn || null, contact || null);
      UI.renderClients();
      UI.renderApplicationForm();
      UI.renderRefs();
      const modalEl = document.getElementById("modalAddClient");
      if (modalEl) {
        // Пробуем закрыть через Bootstrap API
        let modal = null;
        if (typeof bootstrap !== 'undefined') {
          modal = bootstrap.Modal.getInstance(modalEl);
        } else if (window.bootstrap) {
          modal = window.bootstrap.Modal.getInstance(modalEl);
        }
        
        if (modal) {
          modal.hide();
        } else {
          // Fallback: закрываем вручную
          modalEl.classList.remove('show');
          modalEl.style.display = 'none';
          modalEl.setAttribute('aria-hidden', 'true');
          modalEl.removeAttribute('aria-modal');
          const backdrop = document.querySelector('.modal-backdrop');
          if (backdrop) backdrop.remove();
          document.body.classList.remove('modal-open');
          document.body.style.overflow = '';
        }
      }
      form.reset();
      alert("Клиент добавлен.");
    } catch (e) {
      console.error("Ошибка при добавлении клиента:", e);
      alert("Ошибка при добавлении клиента. Проверьте консоль.");
    }
  }

  function computeRiskDecision(app, creditYes, courtYes) {
    const amountOk = app && app.amount <= LIMIT_AMOUNT;
    const termOk = app && app.termDays <= LIMIT_TERM_DAYS;
    const approved = amountOk && termOk && creditYes && courtYes;
    const reasons = [];
    if (!amountOk) reasons.push("сумма превышает лимит 5 000 000 ₽");
    if (!termOk) reasons.push("срок превышает 365 дн.");
    if (!creditYes) reasons.push("негативная кредитная история");
    if (!courtYes) reasons.push("судебные процедуры / банкротство");
    const comment = approved
      ? "Оценка рисков: одобрено. Все критерии соблюдены."
      : "Отказ: " + reasons.join("; ");
    return { decision: approved ? "Одобрено" : "Отказ", comment };
  }

  function updateRiskDecisionDisplay() {
    const id = document.getElementById("riskApplicationId")?.value;
    const badge = document.getElementById("riskDecisionBadge");
    const commentEl = document.getElementById("riskCommentText");
    if (!id || !badge || !commentEl) return;
    const app = DB.state.applications.find((a) => a.id === id);
    const creditChecked = document.querySelector("input[name='riskCredit']:checked");
    const courtChecked = document.querySelector("input[name='riskCourt']:checked");
    if (!app) {
      badge.textContent = "—";
      badge.className = "badge text-bg-secondary fs-6";
      commentEl.textContent = "—";
      return;
    }
    if (!creditChecked || !courtChecked) {
      badge.textContent = "—";
      badge.className = "badge text-bg-secondary fs-6";
      commentEl.textContent = "Укажите ответы по критериям «Негативная кредитная история» и «Судебные процедуры» (Да/Нет).";
      return;
    }
    const creditYes = creditChecked.value === "yes";
    const courtYes = courtChecked.value === "yes";
    const { decision, comment } = computeRiskDecision(app, creditYes, courtYes);
    badge.textContent = decision;
    badge.className = "badge fs-6 " + (decision === "Одобрено" ? "text-bg-success" : "text-bg-danger");
    commentEl.textContent = comment;
  }

  function handleRiskApplicationChange() {
    const id = document.getElementById("riskApplicationId")?.value;
    const summary = document.getElementById("riskSummary");
    const amountOk = document.getElementById("riskAmountOk");
    const termOk = document.getElementById("riskTermOk");
    if (!id) {
      if (summary) summary.style.display = "none";
      if (amountOk) amountOk.textContent = "—";
      if (termOk) termOk.textContent = "—";
      document.querySelectorAll("input[name='riskCredit']").forEach((r) => (r.checked = false));
      document.querySelectorAll("input[name='riskCourt']").forEach((r) => (r.checked = false));
      updateRiskDecisionDisplay();
      return;
    }
    const app = DB.state.applications.find((a) => a.id === id);
    if (!app) return;
    document.getElementById("riskClientName").textContent = app.clientName || "—";
    document.getElementById("riskAmount").textContent = UI.formatCurrency(app.amount);
    document.getElementById("riskTerm").textContent = app.termDays;
    document.getElementById("riskBeneficiary").textContent = app.beneficiary || "—";
    summary.style.display = "block";
    amountOk.textContent = app.amount <= LIMIT_AMOUNT ? "Да" : "Нет";
    amountOk.className = "badge " + (app.amount <= LIMIT_AMOUNT ? "text-bg-success" : "text-bg-danger");
    termOk.textContent = app.termDays <= LIMIT_TERM_DAYS ? "Да" : "Нет";
    termOk.className = "badge " + (app.termDays <= LIMIT_TERM_DAYS ? "text-bg-success" : "text-bg-danger");
    document.querySelectorAll("input[name='riskCredit']").forEach((r) => (r.checked = false));
    document.querySelectorAll("input[name='riskCourt']").forEach((r) => (r.checked = false));
    updateRiskDecisionDisplay();
  }

  async function handleRiskSubmit(e) {
    e.preventDefault();
    const id = document.getElementById("riskApplicationId")?.value;
    if (!id) {
      alert("Выберите заявку.");
      return;
    }
    const creditYes = document.querySelector("input[name='riskCredit']:checked")?.value === "yes";
    const courtYes = document.querySelector("input[name='riskCourt']:checked")?.value === "yes";
    if (document.querySelector("input[name='riskCredit']:checked") === null || document.querySelector("input[name='riskCourt']:checked") === null) {
      alert("Укажите ответы по критериям «Негативная кредитная история» и «Судебные процедуры» (Да/Нет).");
      return;
    }
    const app = DB.state.applications.find((a) => a.id === id);
    if (!app) return;
    const { decision, comment } = computeRiskDecision(app, creditYes, courtYes);
    const historyComment = comment;
    try {
      await DB.updateApplication(app.id, {
        checkStatus: decision,
        comment: decision === "Отказ" ? comment : app.comment,
        stage: "Оценка рисков",
        historyComment,
      });
      if (decision === "Одобрено") DB.state.lastChecked = app.id;
      if (decision === "Отказ" && DB.state.lastChecked === app.id) DB.state.lastChecked = null;
      const checkSelect = document.getElementById("checkApplicationId");
      if (checkSelect) checkSelect.value = app.id;
      const statusEl = document.getElementById("checkStatus");
      if (statusEl) statusEl.value = decision;
      UI.renderApps();
      UI.renderHistory();
      Reports.updateCharts();
      alert(decision === "Одобрено" ? "Решение применено: заявка одобрена. Дальше можно нажать «Рассчитать условия» в блоке Операции." : "Решение применено: заявке присвоен отказ.");
    } catch (err) {
      console.error(err);
      alert("Ошибка при сохранении решения.");
    }
  }

  function bind() {
    try {
      const appForm = document.getElementById("applicationForm");
      if (appForm) {
        appForm.addEventListener("submit", handleApplicationSubmit);
      }

      const checkForm = document.getElementById("checkForm");
      if (checkForm) {
        checkForm.addEventListener("submit", (e) => {
          e.preventDefault();
          alert("Решение по заявке принимается только во вкладке «Оценка рисков». Нажмите «Перейти к оценке рисков».");
        });
      }
      const linkToRisks = document.getElementById("linkToRisks");
      if (linkToRisks) {
        linkToRisks.addEventListener("click", (e) => {
          e.preventDefault();
          const targetId = linkToRisks.getAttribute("data-target");
          document.querySelectorAll("#menu .nav-link").forEach((l) => l.classList.remove("active"));
          const menuLink = document.querySelector(`#menu .nav-link[data-target="${targetId}"]`);
          if (menuLink) menuLink.classList.add("active");
          document.querySelectorAll(".section").forEach((s) => s.classList.remove("active"));
          const section = document.getElementById(targetId);
          if (section) section.classList.add("active");
          const checkSelect = document.getElementById("checkApplicationId");
          const riskSelect = document.getElementById("riskApplicationId");
          if (checkSelect && riskSelect && checkSelect.value) {
            riskSelect.value = checkSelect.value;
            handleRiskApplicationChange();
          }
        });
      }
      const checkSelect = document.getElementById("checkApplicationId");
      const checkStatusEl = document.getElementById("checkStatus");
      if (checkSelect && checkStatusEl) {
        checkSelect.addEventListener("change", () => {
          const id = checkSelect.value;
          const app = DB.state.applications.find((a) => a.id === id);
          checkStatusEl.value = app ? app.checkStatus : "";
        });
      }

      const btnCalculate = document.getElementById("btnCalculate");
      if (btnCalculate) {
        btnCalculate.addEventListener("click", calculateConditions);
      }

      const btnIssue = document.getElementById("btnIssue");
      if (btnIssue) {
        btnIssue.addEventListener("click", issueGuarantee);
      }

      const btnRegister = document.getElementById("btnRegister");
      if (btnRegister) {
        btnRegister.addEventListener("click", registerApplication);
      }

      const btnAddClient = document.getElementById("btnAddClient");
      if (btnAddClient) {
        btnAddClient.addEventListener("click", () => {
          const modalEl = document.getElementById("modalAddClient");
          if (modalEl) {
            // Используем Bootstrap 5 API
            const bootstrap = window.bootstrap || (typeof bootstrap !== 'undefined' ? bootstrap : null);
            if (bootstrap && bootstrap.Modal) {
              const modal = new bootstrap.Modal(modalEl);
              modal.show();
            } else {
              // Fallback если bootstrap не загружен
              modalEl.style.display = 'block';
              modalEl.classList.add('show');
              modalEl.setAttribute('aria-hidden', 'false');
              modalEl.setAttribute('aria-modal', 'true');
              const backdrop = document.createElement('div');
              backdrop.className = 'modal-backdrop fade show';
              document.body.appendChild(backdrop);
              document.body.classList.add('modal-open');
              document.body.style.overflow = 'hidden';
            }
          }
        });
      }

      const btnSubmitClient = document.getElementById("btnSubmitClient");
      if (btnSubmitClient) {
        btnSubmitClient.addEventListener("click", handleAddClient);
      }

      const riskApplicationId = document.getElementById("riskApplicationId");
      if (riskApplicationId) {
        riskApplicationId.addEventListener("change", handleRiskApplicationChange);
      }
      document.querySelectorAll("input[name='riskCredit'], input[name='riskCourt']").forEach((el) => {
        el.addEventListener("change", updateRiskDecisionDisplay);
      });
      const riskForm = document.getElementById("riskForm");
      if (riskForm) {
        riskForm.addEventListener("submit", handleRiskSubmit);
      }

      const appsFilter = document.getElementById("appsFilter");
      if (appsFilter) {
        appsFilter.addEventListener("input", () => UI.renderApps());
      }

      const docsFilter = document.getElementById("docsFilter");
      if (docsFilter) {
        docsFilter.addEventListener("input", () => UI.renderDocs());
      }
    } catch (error) {
      console.error("Ошибка при привязке обработчиков:", error);
    }
  }

  return { bind };
})();

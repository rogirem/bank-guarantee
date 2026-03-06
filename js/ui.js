const UI = (() => {
  const formatCurrency = (value) => new Intl.NumberFormat("ru-RU").format(value) + " ₽";
  const fmtDateTime = (date) =>
    new Intl.DateTimeFormat("ru-RU", { dateStyle: "short", timeStyle: "medium" }).format(date);
  const fmtDate = (date) => new Intl.DateTimeFormat("ru-RU", { dateStyle: "short" }).format(date);

  let filteredApps = [];

  function renderClients() {
    const tbody = document.querySelector("#clientsTable tbody");
    tbody.innerHTML = "";
    DB.state.clients.forEach((c) => {
      const tr = document.createElement("tr");
      tr.innerHTML = `
        <td>${c.name}</td>
        <td>${c.inn || "—"}</td>
        <td>${c.contact || "—"}</td>
      `;
      tbody.appendChild(tr);
    });
  }

  function renderApplicationForm() {
    const selectClient = document.querySelector("#applicationForm select[name='client']");
    const selectManager = document.querySelector("#applicationForm select[name='manager']");
    const selectType = document.querySelector("#applicationForm select[name='guarantee_type']");
    
    selectClient.innerHTML = "";
    selectManager.innerHTML = "";
    selectType.innerHTML = "";
    
    DB.state.clients.forEach((c) => {
      const opt = document.createElement("option");
      opt.value = c.id;
      opt.textContent = c.name;
      selectClient.appendChild(opt);
    });
    
    DB.state.staff.forEach((s) => {
      const opt = document.createElement("option");
      opt.value = s.id;
      opt.textContent = `${s.name} (${s.role || ""})`;
      selectManager.appendChild(opt);
    });
    
    DB.state.guaranteeTypes.forEach((gt) => {
      const opt = document.createElement("option");
      opt.value = gt.id;
      opt.textContent = gt.name;
      selectType.appendChild(opt);
    });
  }

  function filterApps(query) {
    if (!query) {
      filteredApps = DB.state.applications;
      return;
    }
    const q = query.toLowerCase();
    filteredApps = DB.state.applications.filter((app) => {
      const client = DB.getClient(app.clientId);
      return (
        app.id.toLowerCase().includes(q) ||
        (client?.name || "").toLowerCase().includes(q) ||
        app.amount.toString().includes(q) ||
        app.guaranteeTypeName.toLowerCase().includes(q)
      );
    });
  }

  function renderApps() {
    const tbody = document.querySelector("#appsTable tbody");
    const selectApplication = document.querySelector("#checkForm select[name='applicationId']");
    const riskSelect = document.getElementById("riskApplicationId");
    tbody.innerHTML = "";
    selectApplication.innerHTML = "";
    if (riskSelect) {
      riskSelect.innerHTML = '<option value="">— Выберите заявку —</option>';
    }

    filterApps(document.getElementById("appsFilter")?.value || "");

    filteredApps.forEach((app) => {
      const tr = document.createElement("tr");
      const date = app.timestamp ? fmtDate(new Date(app.timestamp)) : "—";
      const checkBadge = app.checkStatus === "Одобрено" ? "success" : app.checkStatus === "Отказ" ? "danger" : app.checkStatus === "Проверяется" ? "warning" : "secondary";
      const issueBadge = app.issueStatus === "Выпущена" ? "success" : "secondary";
      const regBadge = app.registrationStatus === "Зарегистрирована" ? "success" : "secondary";
      
      tr.innerHTML = `
        <td>${app.id}</td>
        <td>${date}</td>
        <td>${app.clientName}</td>
        <td>${app.guaranteeTypeName}</td>
        <td>${formatCurrency(app.amount)}</td>
        <td>${app.termDays} дн.</td>
        <td><span class="badge text-bg-${checkBadge} badge-status">${app.checkStatus}</span></td>
        <td><span class="badge text-bg-${issueBadge} badge-status">${app.issueStatus}</span></td>
        <td><span class="badge text-bg-${regBadge} badge-status">${app.registrationStatus}</span></td>
        <td>
          ${app.registrationStatus === "Зарегистрирована"
            ? `<button class="btn btn-sm btn-outline-primary me-1" onclick="Docs.buildGuarantee('${app.id}')">Заявка</button>
          <button class="btn btn-sm btn-outline-primary" onclick="Docs.buildContract('${app.id}')">Договор</button>`
            : "—"}
        </td>
      `;
      tbody.appendChild(tr);

      const opt = document.createElement("option");
      opt.value = app.id;
      opt.textContent = `${app.id} — ${app.clientName} (${formatCurrency(app.amount)})`;
      selectApplication.appendChild(opt);
      if (riskSelect) {
        const opt2 = document.createElement("option");
        opt2.value = app.id;
        opt2.textContent = `${app.id} — ${app.clientName} (${formatCurrency(app.amount)})`;
        riskSelect.appendChild(opt2);
      }
    });

    document.getElementById("countApps").textContent = `${filteredApps.length} из ${DB.state.applications.length} заявок`;
    const statusEl = document.getElementById("checkStatus");
    if (filteredApps.length > 0 && statusEl) {
      const currentVal = selectApplication.value;
      const app = filteredApps.find((a) => a.id === currentVal) || filteredApps[0];
      if (!currentVal) selectApplication.value = app.id;
      statusEl.value = app.checkStatus;
    }
  }

  function renderDocs() {
    const tbody = document.querySelector("#docsTable tbody");
    tbody.innerHTML = "";
    const query = (document.getElementById("docsFilter")?.value || "").toLowerCase();
    const appsWithDocs = DB.state.applications.filter((app) => app.registrationStatus === "Зарегистрирована");
    let filtered = appsWithDocs;
    if (query) {
      filtered = appsWithDocs.filter((app) => {
        const client = DB.getClient(app.clientId);
        return (
          app.id.toLowerCase().includes(query) ||
          (client?.name || "").toLowerCase().includes(query) ||
          app.amount.toString().includes(query)
        );
      });
    }
    filtered.forEach((app) => {
      const client = DB.getClient(app.clientId);
      const tr = document.createElement("tr");
      const date = app.timestamp ? fmtDate(new Date(app.timestamp)) : "—";
      tr.innerHTML = `
        <td>${date}</td>
        <td>${app.id}</td>
        <td>${client?.name || "—"}</td>
        <td>${formatCurrency(app.amount)}</td>
        <td>Заявка, Договор</td>
        <td>
          <button class="btn btn-sm btn-outline-primary me-1" onclick="Docs.buildGuarantee('${app.id}')">Заявка</button>
          <button class="btn btn-sm btn-outline-primary" onclick="Docs.buildContract('${app.id}')">Договор</button>
        </td>
      `;
      tbody.appendChild(tr);
    });
  }

  function renderRefs() {
    const makeList = (id, items) => {
      const ul = document.getElementById(id);
      ul.innerHTML = "";
      items.forEach((item) => {
        const li = document.createElement("li");
        li.className = "list-group-item";
        li.textContent = item;
        ul.appendChild(li);
      });
    };
    makeList("refClients", DB.state.clients.map((c) => `${c.name}${c.inn ? ` (ИНН: ${c.inn})` : ""}`));
    makeList("refStaff", DB.state.staff.map((s) => `${s.name}${s.role ? ` — ${s.role}` : ""}`));
    makeList("refGuaranteeTypes", DB.state.guaranteeTypes.map((gt) => gt.name));
    makeList("refTariffs", DB.state.tariffs.map((t) => {
      const type = DB.state.guaranteeTypes.find((gt) => gt.id === t.guaranteeTypeId);
      return `${type?.name || "—"}: ${t.commissionPercent}% годовых, мин. ${formatCurrency(t.minCommission)}`;
    }));
  }

  function renderHistory() {
    const tbody = document.querySelector("#historyTable tbody");
    tbody.innerHTML = "";
    DB.state.history.forEach((h) => {
      const tr = document.createElement("tr");
      tr.innerHTML = `
        <td>${fmtDateTime(h.ts)}</td>
        <td>${h.appId}</td>
        <td>${h.stage}</td>
        <td>${h.comment || ""}</td>
      `;
      tbody.appendChild(tr);
    });
  }

  return {
    renderClients,
    renderApplicationForm,
    renderApps,
    renderRefs,
    renderHistory,
    renderDocs,
    filterApps,
    formatCurrency,
  };
})();

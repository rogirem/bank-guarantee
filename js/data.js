const DB = (() => {
  const state = {
    clients: [],
    staff: [],
    guaranteeTypes: [],
    tariffs: [],
    applications: [],
    history: [],
    lastChecked: null,
  };

  async function bootstrap() {
    try {
      console.log("Загрузка данных из API...");
      const data = await api.bootstrap();
      console.log("Получены данные:", {
        clients: data.clients?.length || 0,
        applications: data.applications?.length || 0,
        staff: data.staff?.length || 0
      });
      
      if (!data.clients || !Array.isArray(data.clients)) {
        console.warn("Клиенты не найдены в ответе API");
        data.clients = [];
      }
      
      state.clients = data.clients.map((c) => ({
        id: c.id,
        name: c.name,
        inn: c.inn || "",
        contact: c.contact || "",
      }));
    state.staff = data.staff.map((s) => ({
      id: s.id,
      name: s.name,
      role: s.role || "",
    }));
    state.guaranteeTypes = data.guaranteeTypes.map((gt) => ({
      id: gt.id,
      name: gt.name,
    }));
    state.tariffs = data.tariffs.map((t) => ({
      id: t.id,
      guaranteeTypeId: t.guarantee_type_id,
      commissionPercent: Number(t.commission_percent),
      minCommission: Number(t.min_commission),
    }));
      if (!data.applications || !Array.isArray(data.applications)) {
        console.warn("Заявки не найдены в ответе API");
        data.applications = [];
      }
      
      state.applications = data.applications.map((a) => ({
        id: `APP-${String(a.id).padStart(3, "0")}`,
        rawId: a.id,
        clientId: a.client_id,
        managerId: a.manager_id,
        guaranteeTypeId: a.guarantee_type_id,
        amount: Number(a.amount),
        termDays: Number(a.term_days),
        commission: Number(a.commission || 0),
        checkStatus: a.check_status,
        issueStatus: a.issue_status,
        registrationStatus: a.registration_status,
        beneficiary: a.beneficiary || "",
        comment: a.comment || "",
        timestamp: a.created_at,
        clientName: state.clients.find((c) => c.id === a.client_id)?.name || "",
        guaranteeTypeName: state.guaranteeTypes.find((gt) => gt.id === a.guarantee_type_id)?.name || "",
      }));
      if (!data.history || !Array.isArray(data.history)) {
        console.warn("История не найдена в ответе API");
        data.history = [];
      }
      
      state.history = data.history.map((h) => ({
        ts: new Date(h.ts),
        appId: `APP-${String(h.application_id).padStart(3, "0")}`,
        stage: h.stage,
        comment: h.comment,
      }));
      state.lastChecked = null;
      
      console.log("Данные загружены в состояние:", {
        clients: state.clients.length,
        applications: state.applications.length,
        history: state.history.length
      });
    } catch (error) {
      console.error("Ошибка при загрузке данных:", error);
      throw error;
    }
  }

  const nextAppId = (rawId) => `APP-${String(rawId).padStart(3, "0")}`;

  function pushHistory(rawId, stage, comment = "") {
    state.history.unshift({
      ts: new Date(),
      appId: nextAppId(rawId),
      stage,
      comment,
    });
  }

  async function addApplication(payload) {
    const client = state.clients.find((c) => c.id === payload.client);
    if (!client) {
      throw new Error("Клиент не найден");
    }
    const created = await api.createApplication({
      client_id: payload.client,
      manager_id: payload.manager,
      guarantee_type_id: payload.guarantee_type,
      amount: Number(payload.amount),
      term_days: Number(payload.term_days),
      beneficiary: payload.beneficiary || null,
      comment: payload.comment || "",
    });
    const app = {
      id: nextAppId(created.id),
      rawId: created.id,
      clientId: created.client_id,
      clientName: client.name,
      managerId: created.manager_id,
      guaranteeTypeId: created.guarantee_type_id,
      guaranteeTypeName: state.guaranteeTypes.find((gt) => gt.id === created.guarantee_type_id)?.name || "",
      amount: Number(created.amount),
      termDays: Number(created.term_days),
      commission: Number(created.commission || 0),
      checkStatus: created.check_status,
      issueStatus: created.issue_status,
      registrationStatus: created.registration_status,
      beneficiary: created.beneficiary || "",
      comment: created.comment || "",
      timestamp: created.created_at,
    };
    state.applications.push(app);
    state.lastChecked = null;
    pushHistory(created.id, "Создание заявки", "Заявка создана");
    return app;
  }

  async function updateApplication(appId, data) {
    const app = state.applications.find((a) => a.id === appId);
    if (!app) return null;
    const updated = await api.updateApplication(app.rawId, {
      check_status: data.checkStatus,
      issue_status: data.issueStatus,
      registration_status: data.registrationStatus,
      commission: data.commission,
      comment: data.comment || "",
      stage: data.stage || "Обновление",
      history_comment: data.historyComment || data.comment || "",
    });
    Object.assign(app, {
      checkStatus: updated.check_status,
      issueStatus: updated.issue_status,
      registrationStatus: updated.registration_status,
      commission: Number(updated.commission || 0),
      comment: updated.comment || "",
    });
    pushHistory(updated.id, data.stage || "Обновление", data.historyComment || data.comment || "");
    return app;
  }

  function getClient(id) {
    return state.clients.find((c) => c.id === id);
  }

  function getTariff(guaranteeTypeId) {
    return state.tariffs.find((t) => t.guaranteeTypeId === guaranteeTypeId);
  }

  async function addClient(name, inn, contact) {
    const created = await api.createClient({ name, inn: inn || null, contact: contact || null });
    state.clients.push({
      id: created.id,
      name: created.name,
      inn: created.inn || "",
      contact: created.contact || "",
    });
    return created.id;
  }

  return {
    state,
    bootstrap,
    addApplication,
    updateApplication,
    getClient,
    getTariff,
    addClient,
  };
})();

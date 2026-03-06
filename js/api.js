(() => {
  const API_BASE = window.API_BASE || "http://localhost:3000/api";

  async function request(url, options = {}) {
    try {
      const res = await fetch(`${API_BASE}${url}`, {
        headers: { "Content-Type": "application/json" },
        ...options,
      });
      if (!res.ok) {
        const errorText = await res.text();
        throw new Error(`API error ${res.status}: ${errorText}`);
      }
      return res.json();
    } catch (error) {
      console.error(`Ошибка запроса к ${API_BASE}${url}:`, error);
      throw error;
    }
  }

  window.api = {
    bootstrap: () => request("/bootstrap"),
    createClient: (payload) => request("/clients", { method: "POST", body: JSON.stringify(payload) }),
    createApplication: (payload) => request("/applications", { method: "POST", body: JSON.stringify(payload) }),
    updateApplication: (id, payload) => request(`/applications/${id}`, { method: "PATCH", body: JSON.stringify(payload) }),
    saveDocument: (applicationId, docType) => request("/documents", { method: "POST", body: JSON.stringify({ application_id: applicationId, doc_type: docType }) }),
    getDocuments: (applicationId) => request(`/documents${applicationId ? `?application_id=${applicationId}` : ""}`),
  };
})();

const BASE_URL = "/api";

async function request(path, options = {}) {
  const res = await fetch(`${BASE_URL}${path}`, {
    credentials: "include",
    headers: { "Content-Type": "application/json", ...(options.headers || {}) },
    ...options
  });

  if (res.status === 204) return null;

  const data = await res.json().catch(() => null);

  if (!res.ok) {
    const message = data?.error || `Request failed with status ${res.status}`;
    const error = new Error(message);
    error.status = res.status;
    error.data = data;
    throw error;
  }

  return data;
}

export const api = {
  auth: {
    register: body => request("/auth/register", { method: "POST", body: JSON.stringify(body) }),
    login: body => request("/auth/login", { method: "POST", body: JSON.stringify(body) }),
    logout: () => request("/auth/logout", { method: "POST" }),
    me: () => request("/auth/me"),
    updateProfile: body => request("/auth/me", { method: "PATCH", body: JSON.stringify(body) })
  },
  tasks: {
    list: () => request("/tasks"),
    get: id => request(`/tasks/${id}`),
    create: body => request("/tasks", { method: "POST", body: JSON.stringify(body) }),
    update: (id, body) => request(`/tasks/${id}`, { method: "PATCH", body: JSON.stringify(body) }),
    changeStatus: (id, status) =>
      request(`/tasks/${id}/status`, { method: "PATCH", body: JSON.stringify({ status }) }),
    remove: id => request(`/tasks/${id}`, { method: "DELETE" }),
    removeCompleted: () => request("/tasks/completed", { method: "DELETE" }),
    reorder: order => request("/tasks/reorder", { method: "PATCH", body: JSON.stringify({ order }) })
  },
  categories: {
    list: () => request("/categories"),
    create: body => request("/categories", { method: "POST", body: JSON.stringify(body) }),
    update: (id, body) => request(`/categories/${id}`, { method: "PATCH", body: JSON.stringify(body) }),
    remove: (id, reassignToId) =>
      request(`/categories/${id}`, { method: "DELETE", body: JSON.stringify({ reassignToId }) })
  },
  profile: {
    summary: () => request("/profile/summary")
  },
  journal: {
    list: () => request("/journal/entries"),
    get: date => request(`/journal/entries/${date}`),
    upsert: (date, body) => request(`/journal/entries/${date}`, { method: "PUT", body: JSON.stringify(body) }),
    remove: date => request(`/journal/entries/${date}`, { method: "DELETE" }),
    insights: () => request("/journal/insights"),
    generateInsight: () => request("/journal/insights/generate", { method: "POST" }),
    stats: window => request(`/journal/stats?window=${window}`)
  },
  stats: {
    overview: window => request(`/stats/overview?window=${window}`)
  },
  oracle: {
    conversation: () => request("/oracle/conversation"),
    sendMessage: text => request("/oracle/messages", { method: "POST", body: JSON.stringify({ text }) }),
    editSuggestion: (id, body) =>
      request(`/oracle/suggestions/${id}`, { method: "PATCH", body: JSON.stringify(body) }),
    approveSuggestion: id => request(`/oracle/suggestions/${id}/approve`, { method: "POST" }),
    rejectSuggestion: id => request(`/oracle/suggestions/${id}/reject`, { method: "POST" })
  }
};

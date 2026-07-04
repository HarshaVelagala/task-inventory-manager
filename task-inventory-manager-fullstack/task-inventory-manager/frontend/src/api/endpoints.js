import client from "./client";

export const authApi = {
  register: (payload) => client.post("/api/auth/register", payload),
  login: (payload) => client.post("/api/auth/login", payload),
  me: () => client.get("/api/auth/me"),
};

export const taskApi = {
  list: (status) => client.get("/api/tasks/", { params: status ? { status } : {} }),
  create: (payload) => client.post("/api/tasks/", payload),
  update: (id, payload) => client.put(`/api/tasks/${id}`, payload),
  remove: (id) => client.delete(`/api/tasks/${id}`),
};

export const inventoryApi = {
  list: () => client.get("/api/inventory/"),
  lowStock: () => client.get("/api/inventory/low-stock"),
  create: (payload) => client.post("/api/inventory/", payload),
  update: (id, payload) => client.put(`/api/inventory/${id}`, payload),
  adjustStock: (id, delta) => client.patch(`/api/inventory/${id}/stock`, { delta }),
  remove: (id) => client.delete(`/api/inventory/${id}`),
};

export const userApi = {
  list: () => client.get("/api/users/"),
  updateRole: (id, role) => client.patch(`/api/users/${id}/role`, { role }),
  remove: (id) => client.delete(`/api/users/${id}`),
};

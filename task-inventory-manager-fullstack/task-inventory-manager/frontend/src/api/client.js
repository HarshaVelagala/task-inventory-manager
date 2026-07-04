import axios from "axios";

export const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || "http://localhost:8000";

const client = axios.create({
  baseURL: API_BASE_URL,
});

let accessToken = null;
let refreshToken = null;
let onAuthFailure = () => {};

export function setTokens({ access, refresh }) {
  accessToken = access ?? accessToken;
  refreshToken = refresh ?? refreshToken;
}

export function clearTokens() {
  accessToken = null;
  refreshToken = null;
}

export function setOnAuthFailure(callback) {
  onAuthFailure = callback;
}

client.interceptors.request.use((config) => {
  if (accessToken) {
    config.headers.Authorization = `Bearer ${accessToken}`;
  }
  return config;
});

let refreshInFlight = null;

client.interceptors.response.use(
  (response) => response,
  async (error) => {
    const original = error.config;

    if (error.response?.status === 401 && !original._retry && refreshToken) {
      original._retry = true;

      try {
        if (!refreshInFlight) {
          refreshInFlight = axios
            .post(`${API_BASE_URL}/api/auth/refresh`, { refresh_token: refreshToken })
            .finally(() => {
              refreshInFlight = null;
            });
        }
        const { data } = await refreshInFlight;
        setTokens({ access: data.access_token, refresh: data.refresh_token });
        original.headers.Authorization = `Bearer ${data.access_token}`;
        return client(original);
      } catch (refreshError) {
        clearTokens();
        onAuthFailure();
        return Promise.reject(refreshError);
      }
    }

    return Promise.reject(error);
  }
);

export default client;

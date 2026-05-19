import axios from 'axios';
import { notify } from './global-message';

export const api = axios.create({
  baseURL: '/api/v1',
});

api.interceptors.request.use((config) => {
  const token = localStorage.getItem('cpq_token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

api.interceptors.response.use(
  (response) => response,
  (error) => {
    const message =
      error.response?.data?.message ??
      error.message ??
      '请求失败，请稍后重试';
    if (error.response?.status === 401) {
      localStorage.removeItem('cpq_token');
      if (window.location.pathname !== '/login') {
        window.location.href = '/login';
      }
    } else if (error.response?.status === 403) {
      notify('error', '没有权限执行该操作');
    } else {
      notify('error', message);
    }
    return Promise.reject(error);
  },
);

import axios from 'axios';
import type { SearchRequest, SearchResponse, LCARequest, LCAResponse } from './types';

const apiClient = axios.create({
  baseURL: typeof window === 'undefined'
    ? 'http://backend:8080/api'
    : (import.meta.env.DEV ? 'http://localhost:8080/api' : '/api'),
  headers: {
    'Content-Type': 'application/json',
  },
});

export const searchDOM = async (request: SearchRequest): Promise<SearchResponse> => {
  const { data } = await apiClient.post<SearchResponse>('/search', request);
  return data;
};

export const findLCA = async (request: LCARequest): Promise<LCAResponse> => {
  const { data } = await apiClient.post<LCAResponse>('/lca', request);
  return data;
};

export const getLatestHTML = async (): Promise<string> => {
  const { data } = await apiClient.get<string>('/html/latest', { responseType: 'text' });
  return data;
};

export const downloadLatestLog = async (): Promise<void> => {
  const response = await apiClient.get('/log/latest', { responseType: 'blob' });
  const url = window.URL.createObjectURL(new Blob([response.data], { type: 'text/plain' }));
  const a = document.createElement('a');
  a.href = url;
  a.download = 'traversal_log.log';
  a.click();
  window.URL.revokeObjectURL(url);
};

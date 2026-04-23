import axios from 'axios';
import type { SearchRequest, SearchResponse } from './types';

const apiClient = axios.create({
  baseURL: typeof window === 'undefined' ? 'http://backend:8080/api' : '/api',
  headers: {
    'Content-Type': 'application/json',
  },
});

export const searchDOM = async (request: SearchRequest): Promise<SearchResponse> => {
  const { data } = await apiClient.post<SearchResponse>('/search', request);
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

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

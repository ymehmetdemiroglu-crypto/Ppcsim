import axios from 'axios';
import { Keyword, CreateKeywordData, UpdateKeywordData, BulkKeywordOperation } from '../types/keyword';

const API_BASE_URL = import.meta.env.VITE_API_URL || '/api';

interface ApiResponse<T> {
  status: string;
  data: T;
}

export const keywordApi = {
  // Get all keywords for a campaign
  getCampaignKeywords: async (campaignId: number): Promise<Keyword[]> => {
    const response = await axios.get<ApiResponse<{ keywords: Keyword[] }>>(
      `${API_BASE_URL}/campaigns/${campaignId}/keywords`
    );
    return response.data.data.keywords;
  },

  // Get all keywords for an ad group (uses adGroupId query param on campaign keywords route)
  getAdGroupKeywords: async (campaignId: number, adGroupId: number): Promise<Keyword[]> => {
    const response = await axios.get<ApiResponse<{ keywords: Keyword[] }>>(
      `${API_BASE_URL}/campaigns/${campaignId}/keywords?adGroupId=${adGroupId}`
    );
    return response.data.data.keywords;
  },

  // Get a single keyword by ID
  getKeywordById: async (campaignId: number, id: number): Promise<Keyword> => {
    const response = await axios.get<ApiResponse<{ keyword: Keyword }>>(
      `${API_BASE_URL}/campaigns/${campaignId}/keywords/${id}`
    );
    return response.data.data.keyword;
  },

  // Create a new keyword
  createKeyword: async (data: CreateKeywordData): Promise<Keyword> => {
    const response = await axios.post<ApiResponse<{ keyword: Keyword }>>(
      `${API_BASE_URL}/campaigns/${data.campaignId}/keywords`,
      data
    );
    return response.data.data.keyword;
  },

  // Update a keyword
  updateKeyword: async (campaignId: number, id: number, data: UpdateKeywordData): Promise<Keyword> => {
    const response = await axios.put<ApiResponse<{ keyword: Keyword }>>(
      `${API_BASE_URL}/campaigns/${campaignId}/keywords/${id}`,
      data
    );
    return response.data.data.keyword;
  },

  // Delete a keyword
  deleteKeyword: async (campaignId: number, id: number): Promise<void> => {
    await axios.delete(`${API_BASE_URL}/campaigns/${campaignId}/keywords/${id}`);
  },

  // Bulk operations on keywords
  bulkOperation: async (campaignId: number, operation: BulkKeywordOperation): Promise<void> => {
    await axios.post(`${API_BASE_URL}/campaigns/${campaignId}/keywords/bulk`, operation);
  },
};

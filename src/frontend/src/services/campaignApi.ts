import axios from 'axios';
import { Campaign, CampaignStats, CreateCampaignDto, UpdateCampaignDto } from '../types/campaign';

const API_BASE_URL = import.meta.env.VITE_API_URL || '/api';

interface ApiResponse<T> {
  status: string;
  data: T;
}

export const campaignApi = {
  /**
   * Get all campaigns for a user
   */
  getCampaigns: async (_userId: number, filters?: {
    status?: string;
    campaignType?: string;
  }) => {
    const params = new URLSearchParams();
    if (filters?.status) params.append('status', filters.status);
    if (filters?.campaignType) params.append('campaignType', filters.campaignType);
    const query = params.toString();

    return axios.get<ApiResponse<{ campaigns: Campaign[] }>>(
      `${API_BASE_URL}/campaigns${query ? `?${query}` : ''}`
    );
  },

  /**
   * Get a single campaign by ID
   */
  getCampaign: async (id: number, _userId: number) => {
    return axios.get<ApiResponse<{ campaign: Campaign }>>(
      `${API_BASE_URL}/campaigns/${id}`
    );
  },

  /**
   * Create a new campaign
   */
  createCampaign: async (_userId: number, data: CreateCampaignDto) => {
    return axios.post<ApiResponse<{ campaign: Campaign }>>(
      `${API_BASE_URL}/campaigns`,
      data
    );
  },

  /**
   * Update a campaign
   */
  updateCampaign: async (id: number, _userId: number, data: UpdateCampaignDto) => {
    return axios.put<ApiResponse<{ campaign: Campaign }>>(
      `${API_BASE_URL}/campaigns/${id}`,
      data
    );
  },

  /**
   * Delete a campaign
   */
  deleteCampaign: async (id: number, _userId: number) => {
    return axios.delete(
      `${API_BASE_URL}/campaigns/${id}`
    );
  },

  /**
   * Get campaign statistics
   */
  getCampaignStats: async (id: number, _userId: number) => {
    return axios.get<ApiResponse<{ stats: CampaignStats }>>(
      `${API_BASE_URL}/campaigns/${id}/stats`
    );
  },
};

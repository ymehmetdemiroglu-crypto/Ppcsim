import axios from 'axios';
import { AdGroup, CreateAdGroupData, UpdateAdGroupData } from '../types/adGroup';

const API_BASE_URL = import.meta.env.VITE_API_URL || '/api';

interface ApiResponse<T> {
  status: string;
  data: T;
}

export const adGroupApi = {
  // Get all ad groups for a campaign
  getCampaignAdGroups: async (campaignId: number): Promise<AdGroup[]> => {
    const response = await axios.get<ApiResponse<{ adGroups: AdGroup[] }>>(
      `${API_BASE_URL}/campaigns/${campaignId}/adgroups`
    );
    return response.data.data.adGroups;
  },

  // Get a single ad group by ID
  getAdGroupById: async (campaignId: number, id: number): Promise<AdGroup> => {
    const response = await axios.get<ApiResponse<{ adGroup: AdGroup }>>(
      `${API_BASE_URL}/campaigns/${campaignId}/adgroups/${id}`
    );
    return response.data.data.adGroup;
  },

  // Create a new ad group
  createAdGroup: async (data: CreateAdGroupData): Promise<AdGroup> => {
    const response = await axios.post<ApiResponse<{ adGroup: AdGroup }>>(
      `${API_BASE_URL}/campaigns/${data.campaignId}/adgroups`,
      data
    );
    return response.data.data.adGroup;
  },

  // Update an ad group
  updateAdGroup: async (campaignId: number, id: number, data: UpdateAdGroupData): Promise<AdGroup> => {
    const response = await axios.put<ApiResponse<{ adGroup: AdGroup }>>(
      `${API_BASE_URL}/campaigns/${campaignId}/adgroups/${id}`,
      data
    );
    return response.data.data.adGroup;
  },

  // Delete an ad group
  deleteAdGroup: async (campaignId: number, id: number): Promise<void> => {
    await axios.delete(`${API_BASE_URL}/campaigns/${campaignId}/adgroups/${id}`);
  },
};

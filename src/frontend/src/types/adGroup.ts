export interface AdGroup {
  id: number;
  campaignId: number;
  name: string;
  defaultBid: number;
  status: 'ACTIVE' | 'PAUSED' | 'ARCHIVED';
  createdAt: string;
  updatedAt: string;
  _count?: {
    keywords: number;
    products: number;
  };
}

export interface CreateAdGroupData {
  campaignId: number;
  name: string;
  defaultBid: number;
}

export interface UpdateAdGroupData {
  name?: string;
  defaultBid?: number;
  status?: 'ACTIVE' | 'PAUSED' | 'ARCHIVED';
}

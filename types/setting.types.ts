export interface Setting {
  id: string;
  code: string;
  name: string;
  description: string;
  group: string;
  scope: string;
  value: string;
  type: string;
}

export interface CreateSettingPayload {
  code: string;
  name: string;
  description: string;
  group: string;
  scope: string;
  value: string;
  type: string;
}

export interface UpdateSettingPayload {
  name: string;
  description: string;
  group: string;
  scope: string;
  value: string;
  type: string;
}

export interface SettingFilterParams {
  code?: string;
  name?: string;
  group?: string;
  scope?: string;
  type?: string;
  pageNumber?: number;
  pageSize?: number;
}

export interface RefundPolicy {
  code: string;
  name: string;
  description: string;
  percent: number;
  requiresImage: boolean;
}

export interface CreateRefundPolicyPayload {
  code: string;
  name: string;
  description: string;
  percent: number;
  requiresImage: boolean;
}

export interface UpdateRefundPolicyPayload {
  code: string;
  name: string;
  description: string;
  percent: number;
  requiresImage: boolean;
}

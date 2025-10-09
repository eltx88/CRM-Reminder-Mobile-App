export interface RPCResponse<T = unknown> {
  success: boolean;
  message?: string;
  data?: T;
  [key: string]: unknown; // Allow additional properties
}

export const handleRPCResponse = <T>(data: unknown): T => {
  if (!data) {
    throw new Error('No response data received');
  }

  const response = data as RPCResponse<T>;
  
  if (!response.success) {
    throw new Error(response.message || 'RPC function failed');
  }

  return response as T;
};

export const toOptionalParam = (value: string): string | undefined => {
  return value.trim() === '' ? undefined : value;
};
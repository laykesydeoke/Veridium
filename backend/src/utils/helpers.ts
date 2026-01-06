export const sleep = (ms: number): Promise<void> => {
  return new Promise((resolve) => setTimeout(resolve, ms));
};

export const isValidAddress = (address: string): boolean => {
  return /^0x[a-fA-F0-9]{40}$/.test(address);
};

export const normalizeAddress = (address: string): string => {
  return address.toLowerCase();
};

export const calculatePagination = (
  page: number = 1,
  limit: number = 10
): { offset: number; limit: number } => {
  const normalizedPage = Math.max(1, page);
  const normalizedLimit = Math.min(100, Math.max(1, limit));

  return {
    offset: (normalizedPage - 1) * normalizedLimit,
    limit: normalizedLimit,
  };
};

export const formatError = (error: unknown): string => {
  if (error instanceof Error) {
    return error.message;
  }
  return String(error);
};

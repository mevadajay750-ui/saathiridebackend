const store = new Map<string, string>();

export const tokenStore = {
  get: (userId: string) => store.get(userId),
  set: (userId: string, token: string) => store.set(userId, token),
  delete: (userId: string) => store.delete(userId),
};

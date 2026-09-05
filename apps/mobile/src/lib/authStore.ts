import AsyncStorage from '@react-native-async-storage/async-storage';
import type { AuthUser } from './api';

const TOKEN_KEY = 'karaokebo:token';
const USER_KEY = 'karaokebo:user';

export const authStore = {
  getToken: () => AsyncStorage.getItem(TOKEN_KEY),
  setToken: (token: string) => AsyncStorage.setItem(TOKEN_KEY, token),
  getUser: async (): Promise<AuthUser | null> => {
    const raw = await AsyncStorage.getItem(USER_KEY);
    return raw ? (JSON.parse(raw) as AuthUser) : null;
  },
  setUser: (user: AuthUser) => AsyncStorage.setItem(USER_KEY, JSON.stringify(user)),
  clear: () => AsyncStorage.multiRemove([TOKEN_KEY, USER_KEY]),
};

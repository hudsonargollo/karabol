import AsyncStorage from '@react-native-async-storage/async-storage';

const TOKEN_KEY = 'karaokebo:token';

export const authStore = {
  getToken: () => AsyncStorage.getItem(TOKEN_KEY),
  setToken: (token: string) => AsyncStorage.setItem(TOKEN_KEY, token),
  clear: () => AsyncStorage.removeItem(TOKEN_KEY),
};

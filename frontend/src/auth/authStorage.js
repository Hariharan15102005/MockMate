/**
 * AgentHire Token & Session Storage Abstraction
 * 
 * Note: Uses browser localStorage for single-page client state in this MVP.
 * Can be replaced seamlessly with HttpOnly cookie tokens in hardened deployments.
 */

const TOKEN_KEY = 'mockmate_access_token';
const USER_KEY = 'mockmate_user';

export const authStorage = {
  saveToken(token) {
    if (token) {
      localStorage.setItem(TOKEN_KEY, token);
    }
  },

  getToken() {
    return localStorage.getItem(TOKEN_KEY);
  },

  removeToken() {
    localStorage.removeItem(TOKEN_KEY);
  },

  saveUser(user) {
    if (user) {
      localStorage.setItem(USER_KEY, JSON.stringify(user));
    }
  },

  getUser() {
    const raw = localStorage.getItem(USER_KEY);
    if (!raw) return null;
    try {
      return JSON.parse(raw);
    } catch {
      return null;
    }
  },

  removeUser() {
    localStorage.removeItem(USER_KEY);
  },

  clearAuth() {
    this.removeToken();
    this.removeUser();
  }
};

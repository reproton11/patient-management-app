const TOKEN_KEY = "klinik_token";
const USER_KEY = "klinik_user";
const SESSION_EXPIRED_KEY = "klinik_session_expired";

export const saveSession = (token, user) => {
  localStorage.setItem(TOKEN_KEY, token);
  localStorage.setItem(USER_KEY, JSON.stringify(user));
};

export const getToken = () => localStorage.getItem(TOKEN_KEY);

export const getUser = () => {
  try {
    return JSON.parse(localStorage.getItem(USER_KEY));
  } catch {
    return null;
  }
};

export const clearSession = () => {
  localStorage.removeItem(TOKEN_KEY);
  localStorage.removeItem(USER_KEY);
};

export const markSessionExpired = () => {
  sessionStorage.setItem(SESSION_EXPIRED_KEY, "1");
};

export const consumeSessionExpired = () => {
  const expired = sessionStorage.getItem(SESSION_EXPIRED_KEY) === "1";
  sessionStorage.removeItem(SESSION_EXPIRED_KEY);
  return expired;
};

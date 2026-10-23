import { createContext, useContext, useState } from "react";
import { api } from "./api.js";

const AuthContext = createContext(null);

function readStored() {
  try {
    return JSON.parse(localStorage.getItem("lms-auth")) || { token: null, user: null };
  } catch {
    return { token: null, user: null };
  }
}

export function AuthProvider({ children }) {
  const [auth, setAuth] = useState(readStored);

  const save = (data) => {
    localStorage.setItem("lms-auth", JSON.stringify(data));
    setAuth(data);
  };

  const login = async (email, password) => save(await api("/auth/login", { method: "POST", body: { email, password } }));
  const register = async (form) => save(await api("/auth/register", { method: "POST", body: form }));
  const logout = () => {
    localStorage.removeItem("lms-auth");
    setAuth({ token: null, user: null });
  };

  return <AuthContext.Provider value={{ ...auth, login, register, logout }}>{children}</AuthContext.Provider>;
}

export const useAuth = () => useContext(AuthContext);

import { createContext, useState, useEffect } from "react";
import { getUser } from "../api/auth";

export const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [jwt, setJwt] = useState(localStorage.getItem("token") || "");

  useEffect(() => {
    if (jwt) {
      getUser(jwt).then((res) => setUser(res.data.user)).catch(() => {
        localStorage.removeItem("token");
        setJwt("");
      });
    }
  }, [jwt]);

  const login = (token, userData) => {
    setJwt(token);
    setUser(userData);
    localStorage.setItem("token", token);
  };

  const logout = () => {
    setJwt("");
    setUser(null);
    localStorage.removeItem("token");
  };

  return (
    <AuthContext.Provider value={{ user, jwt, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
};

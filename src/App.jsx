import { useState, useEffect } from "react";
import { Routes, Route, Navigate } from "react-router-dom";
import LoginPage from "./components/LoginPage";
import SignupPage from "./components/SignupPage";
import LudoBoard from "./components/LudoBoard";

function App() {
  const [user, setUser] = useState(null);

  // Load user from localStorage on app start
  useEffect(() => {
    const savedUser = localStorage.getItem("user");
    if (savedUser) setUser(JSON.parse(savedUser));
  }, []);

  // Callback to update user after login/signup
  const handleLogin = (userData) => {
    localStorage.setItem("user", JSON.stringify(userData));
    setUser(userData);
  };

  return (
    <Routes>
      {/* Public routes */}
      <Route
        path="/login"
        element={user ? <Navigate to="/ludodashboard" /> : <LoginPage onLogin={handleLogin} />}
      />
      <Route
        path="/signup"
        element={user ? <Navigate to="/ludodashboard" /> : <SignupPage onLogin={handleLogin} />}
      />

      {/* Protected route */}
      <Route
        path="/ludodashboard"
        element={user ? <LudoBoard token={localStorage.getItem("token")} /> : <Navigate to="/login" />}
      />

      {/* Default route */}
      <Route
        path="*"
        element={<Navigate to={user ? "/ludodashboard" : "/login"} />}
      />
    </Routes>
  );
}

export default App;

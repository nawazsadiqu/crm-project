import { createContext, useContext, useEffect, useState } from "react";

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const storedUser = sessionStorage.getItem("user"); // ✅ changed

    if (storedUser) {
      setUser(JSON.parse(storedUser));
    }

    setLoading(false);
  }, []);

  const login = (data) => {
    sessionStorage.setItem("token", data.token); // ✅ changed
    sessionStorage.setItem("user", JSON.stringify(data.user)); // ✅ changed
    setUser(data.user);
  };

  const logout = () => {
    sessionStorage.removeItem("token"); // ✅ changed
    sessionStorage.removeItem("user"); // ✅ changed
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ user, login, logout, loading }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
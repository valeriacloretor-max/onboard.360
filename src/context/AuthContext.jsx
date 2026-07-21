import { createContext, useContext, useState, useEffect } from 'react';

const AuthContext = createContext();

const USERS = {
  'RRHHAdmin': { username: 'RRHHAdmin', password: 'Valeria123.', role: 'admin' },
  'Director': { username: 'Director', password: 'Director123.', role: 'director' }
};

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Check local storage for session
    const storedUser = localStorage.getItem('onboard360_user');
    if (storedUser) {
      try {
        setUser(JSON.parse(storedUser));
      } catch (e) {
        localStorage.removeItem('onboard360_user');
      }
    }
    setLoading(false);
  }, []);

  const login = (username, password) => {
    const foundUser = USERS[username];
    if (foundUser && foundUser.password === password) {
      const sessionUser = { username: foundUser.username, role: foundUser.role };
      setUser(sessionUser);
      localStorage.setItem('onboard360_user', JSON.stringify(sessionUser));
      return { success: true };
    }
    return { success: false, error: 'Usuario o contraseña incorrectos' };
  };

  const logout = () => {
    setUser(null);
    localStorage.removeItem('onboard360_user');
  };

  return (
    <AuthContext.Provider value={{ user, login, logout, loading }}>
      {!loading && children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}

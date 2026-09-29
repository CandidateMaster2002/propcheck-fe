import React, { createContext, useContext, useState } from 'react';

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  // Initialize from sessionStorage to allow multiple parallel logins in different tabs
  const [authState, setAuthState] = useState(() => {
    const storedUser = sessionStorage.getItem('propcheck_user');
    if (storedUser) {
      try {
        return JSON.parse(storedUser);
      } catch (err) {
        console.error('Failed to parse user from sessionStorage', err);
      }
    }
    return {
      id: null,
      name: null,
      email: null,
      role: null,
      city: null
    };
  });

  const login = (userData) => {
    const newUserState = {
      id: userData.id ?? null,
      name: userData.name ?? null,
      email: userData.email ?? null,
      role: userData.role ?? null,
      city: userData.city ?? null
    };
    
    setAuthState(newUserState);
    sessionStorage.setItem('propcheck_user', JSON.stringify(newUserState));
  };

  const logout = () => {
    setAuthState({
      id: null,
      name: null,
      email: null,
      role: null,
      city: null
    });
    sessionStorage.removeItem('propcheck_user');
  };

  return (
    <AuthContext.Provider value={{ ...authState, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  return useContext(AuthContext);
};

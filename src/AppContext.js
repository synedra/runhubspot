import React, { createContext, useState, useContext } from 'react';

const AppContext = createContext();

export const useAppContext = () => {
  const context = useContext(AppContext);
  if (!context) {
    throw new Error('useAppContext must be used within an AppProvider');
  }
  return context;
};

export const AppProvider = ({ children }) => {
  const [tasks, setTasks] = useState([]);
  const [loadingBoards, setLoadingBoards] = useState(false);
  const [error, setError] = useState(null);
  const [userEmail, setUserEmail] = useState('');
  const [userId, setUserId] = useState('');
  const [checkingCredential, setCheckingCredential] = useState(false);
  const [needsAuth, setNeedsAuth] = useState(false);
  const [emailSubmitted, setEmailSubmitted] = useState(false);
  const [credentialId, setCredentialId] = useState("")

  const value = {
    tasks,
    setTasks,
    loadingBoards,
    setLoadingBoards,
    error,
    setError,
    userEmail,
    setUserEmail,
    userId,
    setUserId,
    checkingCredential,
    setCheckingCredential,
    needsAuth,
    setNeedsAuth,
    emailSubmitted,
    setEmailSubmitted,
  };

  return (
    <AppContext.Provider value={value}>
      {children}
    </AppContext.Provider>
  );
};
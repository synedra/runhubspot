import React from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import './index.css';
import App from './App.js';
import AuthCallback from './AuthCallback.js';
import { AppProvider } from './AppContext.js';

const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(
  <React.StrictMode>
    <AppProvider>
      <Router>
        <Routes>
          <Route path="/" element={<App />} />
          <Route path="/auth/callback" element={<AuthCallback />} />
        </Routes>
      </Router>
    </AppProvider>
  </React.StrictMode>
);



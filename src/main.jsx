import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
//import React from 'react';
//import ReactDOM from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import './styles/App.scss';
import App from './App.jsx';

//ReactDOM.createRoot(document.getElementById('root')).render(
createRoot(document.getElementById('root')).render(
  <StrictMode>
    <BrowserRouter>
      <AuthProvider>
        <App />
      </AuthProvider>
    </BrowserRouter>
  </StrictMode>
);

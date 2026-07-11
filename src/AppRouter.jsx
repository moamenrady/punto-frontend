/**
 * AppRouter — alternative entry point that gates the app behind authentication.
 * Currently not used (main.jsx renders App directly).
 * To activate: change main.jsx to render <AppRouter /> instead of <App />.
 */
import React, { useState } from 'react';
import { AuthProvider } from './context/AuthContext';
import useAuth from './context/useAuth';
import App from './App.jsx';
import LoginPage from './pages/LoginPage.jsx';

function RouterContent() {
  const { token } = useAuth();
  const [isDarkMode, setIsDarkMode] = useState(false);

  const theme = isDarkMode
    ? { bg: 'bg-[#12102A]', textP: 'text-[#E2E0FF]', textM: 'text-[#8480B8]',
        border: 'border-[#2E2B5A]', input: 'bg-[#1E1B3A]', primary: '#7F6FF5',
        accent: '#3ECFAA', btn: 'from-[#7F6FF5] to-[#3ECFAA]' }
    : { bg: 'bg-[#F5F4FF]', textP: 'text-[#1E1B3A]', textM: 'text-[#7F77DD]',
        border: 'border-[#DDD9FF]', input: 'bg-white', primary: '#534AB7',
        accent: '#0F6E56', btn: 'from-[#534AB7] to-[#7F77DD]' };

  if (!token) {
    return <LoginPage isDarkMode={isDarkMode} setIsDarkMode={setIsDarkMode} theme={theme} />;
  }

  return <App />;
}

export default function AppRouter() {
  return (
    <AuthProvider>
      <RouterContent />
    </AuthProvider>
  );
}

// LanguageContext.js
import React, { createContext, useContext, useState, useEffect } from 'react';

const LanguageContext = createContext();

export const useLanguage = () => useContext(LanguageContext);

export const LanguageProvider = ({ children }) => {
  const [language, setLanguage] = useState(localStorage.getItem('language') || 'English');
  const [timezone, setTimezone] = useState(localStorage.getItem('timezone') || '');
  const [showTimezone, setShowTimezone] = useState(localStorage.getItem('showTimezone') === 'true');

  useEffect(() => {
    localStorage.setItem('language', language);
  }, [language]);

  useEffect(() => {
    localStorage.setItem('timezone', timezone);
  }, [timezone]);

  useEffect(() => {
    localStorage.setItem('showTimezone', showTimezone);
  }, [showTimezone]);

  const changeLanguage = (lang) => setLanguage(lang);

  const changeTimezone = (zone) => {
    setTimezone(zone);
    setShowTimezone(true); // Display timezone in header after saving
  };

  const deleteTimezone = () => {
    setTimezone('');
    setShowTimezone(false); // Hide timezone from header after deleting
    localStorage.removeItem('timezone');
    localStorage.removeItem('showTimezone');
  };

  return (
    <LanguageContext.Provider value={{ language, changeLanguage, timezone, changeTimezone, deleteTimezone, showTimezone }}>
      {children}
    </LanguageContext.Provider>
  );
};

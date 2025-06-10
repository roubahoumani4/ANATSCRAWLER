// App.js
import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Route, Routes, Navigate } from 'react-router-dom';
import { LanguageProvider } from './LanguageContext';
import NewLogin from './components/NewLogin/Login';
import Header from './components/Header';
import Dashboard from './components/Dashboard';
import SearchForm from './components/SearchForm';
import ResultsTable from './components/ResultsTable';
import Footer from './components/Footer';
import GeneralSettings from './components/Settings/GeneralSettings';
import PreferencesSettings from './components/Settings/PreferencesSettings';
import EditUser from './components/Settings/EditUser';
import Users from './components/Users/Users';
import NewUser from './components/Users/NewUser';
import './App.css';

const App = () => {
  const [isAuthenticated, setIsAuthenticated] = useState(
    localStorage.getItem('authToken') !== null
  );

  const [results, setResults] = useState([]);
  const [totalFiles, setTotalFiles] = useState(0);
  const [activeComponent, setActiveComponent] = useState(null);

  useEffect(() => {
    const fetchTotalIndexedFiles = async () => {
      try {
        const response = await fetch(`${process.env.REACT_APP_API_URL}/api/total-indexed`);
        if (response.ok) {
          const data = await response.json();
          setTotalFiles(data.total);
        } else {
          console.error('Failed to fetch total indexed files');
        }
      } catch (error) {
        console.error('Error fetching total indexed files:', error);
      }
    };

    fetchTotalIndexedFiles();
  }, []);

  const handleLogin = (token) => {
    localStorage.setItem('authToken', token);
    setIsAuthenticated(true);
    return <Navigate to="/" replace />;

  };

  const handleLogout = () => {
    localStorage.removeItem('authToken');
    localStorage.removeItem('authUsername');
    setIsAuthenticated(false);
    return <Navigate to="/" replace />;
  };

  return (
    <LanguageProvider>
      <Router>
        <Routes>
          {!isAuthenticated ? (
            <>
              <Route path="/" element={<NewLogin onLogin={handleLogin} />} />
              <Route path="*" element={<Navigate to="/" />} />
            </>
          ) : (
            <>
              <Route path="/edit-user" element={
                <div className="app">
                  <Header handleLogout={handleLogout} setActiveComponent={setActiveComponent} />
                  <main>
                    <EditUser />
                  </main>
                  <Footer />
                </div>
              } />

              <Route path="/users" element={
                <div className="app">
                  <Header handleLogout={handleLogout} setActiveComponent={setActiveComponent} />
                  <main>
                    <Users />
                  </main>
                  <Footer />
                </div>
              } />

              <Route path="/new-user" element={
                <div className="app">
                  <Header handleLogout={handleLogout} setActiveComponent={setActiveComponent} />
                  <main>
                    <NewUser />
                  </main>
                  <Footer />
                </div>
              } />

              <Route path="*" element={
                <div className="app">
                  <Header handleLogout={handleLogout} setActiveComponent={setActiveComponent} />
                  <main>
                    {activeComponent === "GeneralSettings" ? (
                      <GeneralSettings userName={localStorage.getItem('authUsername')} />
                    ) : activeComponent === "Preferences" ? (
                      <PreferencesSettings />
                    ) : (
                      <>
                        <Dashboard totalFiles={totalFiles} />
                        <SearchForm setResults={setResults} />
                        <ResultsTable results={results} />
                      </>
                    )}
                  </main>
                  <Footer />
                </div>
              } />
            </>
          )}
        </Routes>
      </Router>
    </LanguageProvider>
  );
};

export default App;

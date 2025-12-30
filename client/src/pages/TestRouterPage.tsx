import React from 'react';
import { useNavigate, useLocation } from 'react-router-dom';

const TestRouterPage = () => {
  const navigate = useNavigate();
  const location = useLocation();

  return (
    <div className="min-h-screen bg-gray-900 text-white flex flex-col items-center justify-center p-8">
      <h1 className="text-3xl font-bold mb-6">Router Test Page</h1>
      <div className="bg-gray-800 p-6 rounded-lg max-w-md w-full">
        <p className="mb-4">Current location: <code className="bg-gray-700 px-2 py-1 rounded">{location.pathname}</code></p>
        <p className="mb-4">Router hooks are working correctly!</p>
        
        <div className="space-y-3">
          <button
            onClick={() => navigate('/')}
            className="w-full bg-blue-600 hover:bg-blue-700 px-4 py-2 rounded"
          >
            Go to Landing Page (/)
          </button>
          
          <button
            onClick={() => navigate('/login')}
            className="w-full bg-green-600 hover:bg-green-700 px-4 py-2 rounded"
          >
            Go to Login Page (/login)
          </button>
        </div>
      </div>
    </div>
  );
};

export default TestRouterPage;

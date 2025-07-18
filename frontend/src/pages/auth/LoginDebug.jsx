import { useState } from 'react';
import api from '../../services/api';

const LoginDebug = () => {
  const [results, setResults] = useState([]);

  const addResult = (message) => {
    setResults(prev => [...prev, `${new Date().toISOString()}: ${message}`]);
  };

  const testLogin = async () => {
    setResults([]);
    
    try {
      addResult(`API URL: ${import.meta.env.VITE_API_URL || 'NOT SET'}`);
      addResult(`Default API URL: ${api.defaults.baseURL}`);
      
      const loginData = {
        email: 'instructor@lms.com',
        password: 'TeachPass123!'
      };
      
      addResult('Sending login request...');
      
      const response = await api.post('/auth/login', loginData);
      
      addResult(`Success! Response: ${JSON.stringify(response.data)}`);
      
      if (response.data.data.accessToken) {
        localStorage.setItem('accessToken', response.data.data.accessToken);
        addResult('Token stored in localStorage');
      }
      
    } catch (error) {
      addResult(`Error: ${error.message}`);
      if (error.response) {
        addResult(`Response status: ${error.response.status}`);
        addResult(`Response data: ${JSON.stringify(error.response.data)}`);
      } else if (error.request) {
        addResult('No response received from server');
        addResult(`Request URL: ${error.config?.url}`);
        addResult(`Full URL: ${error.config?.baseURL}${error.config?.url}`);
      }
    }
  };

  const checkBackend = async () => {
    try {
      const response = await fetch('http://localhost:5001/api/health');
      const text = await response.text();
      addResult(`Backend health check: ${response.status} - ${text}`);
    } catch (error) {
      addResult(`Backend health check failed: ${error.message}`);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-2xl font-bold mb-4">Login Debug</h1>
        
        <div className="space-y-4">
          <button
            onClick={testLogin}
            className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
          >
            Test Login
          </button>
          
          <button
            onClick={checkBackend}
            className="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700 ml-4"
          >
            Check Backend
          </button>
          
          <button
            onClick={() => setResults([])}
            className="px-4 py-2 bg-gray-600 text-white rounded hover:bg-gray-700 ml-4"
          >
            Clear
          </button>
        </div>
        
        <div className="mt-8 bg-white rounded-lg shadow p-6">
          <h2 className="text-lg font-semibold mb-4">Results:</h2>
          <pre className="text-sm whitespace-pre-wrap font-mono">
            {results.length === 0 ? 'No results yet...' : results.join('\n')}
          </pre>
        </div>
        
        <div className="mt-4 bg-white rounded-lg shadow p-6">
          <h2 className="text-lg font-semibold mb-4">Current State:</h2>
          <p>Access Token: {localStorage.getItem('accessToken') ? 'Present' : 'Not set'}</p>
          <p>API URL from env: {import.meta.env.VITE_API_URL || 'Not set'}</p>
          <p>Window location: {window.location.origin}</p>
        </div>
      </div>
    </div>
  );
};

export default LoginDebug;
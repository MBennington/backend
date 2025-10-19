'use client';

import React, { useState } from 'react';

export default function TestAuthPage() {
  const [result, setResult] = useState('');
  const [loading, setLoading] = useState(false);

  const testFallbackAuth = async () => {
    setLoading(true);
    setResult('Testing fallback authentication...');

    try {
      const formData = new FormData();
      formData.append('email', 'admin@areca.com');
      formData.append('password', 'admin123');

      const response = await fetch('/api/auth/fallback-login', {
        method: 'POST',
        body: formData,
      });

      const data = await response.json();
      
      if (response.ok) {
        setResult('✅ Fallback authentication successful! Redirecting...');
        setTimeout(() => {
          window.location.href = '/dashboard';
        }, 1000);
      } else {
        setResult(`❌ Authentication failed: ${data.error}`);
      }
    } catch (error) {
      setResult(`❌ Network error: ${error}`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ padding: '20px', maxWidth: '600px', margin: '0 auto' }}>
      <h1>Authentication Test Page</h1>
      <p>This page tests the fallback authentication system.</p>
      
      <button 
        onClick={testFallbackAuth}
        disabled={loading}
        style={{
          padding: '10px 20px',
          backgroundColor: '#007AFF',
          color: 'white',
          border: 'none',
          borderRadius: '8px',
          cursor: loading ? 'not-allowed' : 'pointer',
          marginBottom: '20px'
        }}
      >
        {loading ? 'Testing...' : 'Test Fallback Authentication'}
      </button>

      {result && (
        <div style={{
          padding: '15px',
          backgroundColor: result.includes('✅') ? '#d4edda' : '#f8d7da',
          border: `1px solid ${result.includes('✅') ? '#c3e6cb' : '#f5c6cb'}`,
          borderRadius: '8px',
          color: result.includes('✅') ? '#155724' : '#721c24'
        }}>
          {result}
        </div>
      )}

      <div style={{ marginTop: '20px', padding: '15px', backgroundColor: '#f8f9fa', borderRadius: '8px' }}>
        <h3>Test Credentials:</h3>
        <ul>
          <li>admin@areca.com / admin123</li>
          <li>user@areca.com / user123</li>
          <li>demo@areca.com / demo123</li>
        </ul>
      </div>
    </div>
  );
}

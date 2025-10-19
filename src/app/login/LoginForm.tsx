'use client';

import React, { useState } from 'react';

export default function LoginForm() {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');

    const formData = new FormData(e.currentTarget);
    const email = formData.get('email') as string;
    const password = formData.get('password') as string;

    console.log('Login attempt:', { email, password: '***' });

    try {
      const response = await fetch('/api/auth/login', {
        method: 'POST',
        body: formData,
      });

      if (response.ok) {
        // Redirect will be handled by the server
        window.location.href = '/dashboard';
      } else {
        const data = await response.json();
        
        // If backend is not available, try fallback authentication
        if (data.error && data.error.includes('Backend server is not available')) {
          try {
            const fallbackResponse = await fetch('/api/auth/fallback-login', {
              method: 'POST',
              body: formData,
            });

            if (fallbackResponse.ok) {
              const fallbackData = await fallbackResponse.json();
              console.log('Fallback auth successful:', fallbackData);
              window.location.href = '/dashboard';
              return;
            } else {
              const fallbackData = await fallbackResponse.json();
              setError(fallbackData.error || 'Login failed');
            }
          } catch (fallbackError) {
            setError('Authentication service is not available. Please try again later.');
          }
        } else {
          setError(data.error || 'Login failed');
        }
      }
    } catch (error) {
      setError('Network error. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="login-form">
      {error && (
        <div className="error-message">
          {error}
        </div>
      )}
      
      <div className="form-group">
        <label htmlFor="email" className="form-label">Email</label>
        <input
          type="email"
          id="email"
          name="email"
          className="form-input"
          placeholder="Enter your email"
          required
          disabled={isLoading}
        />
      </div>

      <div className="form-group">
        <label htmlFor="password" className="form-label">Password</label>
        <input
          type="password"
          id="password"
          name="password"
          className="form-input"
          placeholder="Enter your password"
          required
          disabled={isLoading}
        />
      </div>

      <button 
        type="submit" 
        className="login-button"
        disabled={isLoading}
      >
        {isLoading ? (
          <>
            <span>⏳</span>
            Signing In...
          </>
        ) : (
          <>
            <span>🔐</span>
            Sign In
          </>
        )}
      </button>
    </form>
  );
}

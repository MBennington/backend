import React from 'react';
import { redirect } from 'next/navigation';
import { cookies } from 'next/headers';
import { Suspense } from 'react';
import LoginForm from './LoginForm';
import './login.css';

// Check if user is already authenticated
async function checkAuth() {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get('auth-token')?.value;
    
    if (token) {
      const response = await fetch('/api/auth/me', {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      if (response.ok) {
        redirect('/dashboard');
      }
    }
  } catch (error) {
    console.error('Auth check error:', error);
  }
}

export default async function LoginPage() {
  await checkAuth();

  return (
    <div className="login-container">
      <div className="login-card">
        <div className="login-header">
          <img src="/icon.png" alt="ARECA Icon" className="login-icon" />
          <h1 className="login-title">ARECA Dashboard</h1>
          <p className="login-subtitle">Sign in to access your business dashboard</p>
        </div>

        <LoginForm />

        <div className="login-footer">
          <p>ARECA Business Management System</p>
          <p>Secure Authentication Required</p>
          <div className="demo-credentials">
            <p><strong>Demo Credentials:</strong></p>
            <p>admin@areca.com / admin123</p>
            <p>user@areca.com / user123</p>
            <p>demo@areca.com / demo123</p>
          </div>
        </div>
      </div>
    </div>
  );
}

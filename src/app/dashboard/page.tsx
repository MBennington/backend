import React from 'react';
import { headers } from 'next/headers';
import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import { getDatabase } from '../../lib/database';
import { authenticateRequest } from '../../lib/middleware';
import { ObjectId } from 'mongodb';
import './dashboard.css';

// Force dynamic rendering - disable caching
export const dynamic = 'force-dynamic';
export const revalidate = 0;

// Authentication helper function
async function getAuthenticatedUser() {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get('auth-token')?.value;
    const userData = cookieStore.get('user-data')?.value;
    
    if (!token) {
      return null;
    }

    // Check if it's a fallback token (for development)
    if (token.startsWith('fallback-token-') && userData) {
      return JSON.parse(userData);
    }

    // For production, verify token with the same auth system as frontend
    try {
      // Use the same JWT verification as the API routes
      const { verifyToken, getUserById } = await import('../../lib/auth');
      const tokenData = verifyToken(token);
      
      if (!tokenData) {
        return null;
      }

      const user = await getUserById(tokenData.id);
      return user;
    } catch (error) {
      console.error('Authentication error:', error);
      return null;
    }
  } catch (error) {
    console.error('Auth error:', error);
    return null;
  }
}

export default async function PrivateDashboard() {
  // Check authentication
  const user = await getAuthenticatedUser();
  
  if (!user) {
    redirect('/login');
  }

  // Check for success messages
  const searchParams = new URLSearchParams();
  const dispatchSuccess = searchParams.get('dispatch') === 'success';

  try {
    // Get database connection
    const db = await getDatabase();
    
    // Fetch dashboard data with authentication
    // Note: Add user-specific filtering if needed based on business requirements
    const [
      employees,
      workRecords,
      configurations,
      payments
    ] = await Promise.all([
      db.collection('employees').find({}).toArray(),
      db.collection('workRecords').find({}).toArray(),
      db.collection('configurations').find({}).toArray(),
      db.collection('payments').find({}).toArray()
    ]);

    // Calculate dashboard metrics
    const totalEmployees = employees.length;
    const totalWorkRecords = workRecords.length;
    const totalKilograms = workRecords.reduce((sum, record) => sum + record.kilograms, 0);
    
    // Get today's date
    const today = new Date().toISOString().split('T')[0];
    const todayWorkRecords = workRecords.filter(record => {
      const recordDate = typeof record.date === 'string' ? record.date : record.date.toISOString().split('T')[0];
      return recordDate === today;
    });
    const todayKilograms = todayWorkRecords.reduce((sum, record) => sum + record.kilograms, 0);

    // Calculate daily records for the last 30 days
    const dailyRecords = [];
    for (let i = 29; i >= 0; i--) {
      const date = new Date();
      date.setDate(date.getDate() - i);
      const dateString = date.toISOString().split('T')[0];
      
      const dayRecords = workRecords.filter(record => {
        const recordDate = typeof record.date === 'string' ? record.date : record.date.toISOString().split('T')[0];
        return recordDate === dateString;
      });
      
      const dayKilograms = dayRecords.reduce((sum, record) => sum + record.kilograms, 0);
      const dayCount = dayRecords.length;
      
      // Group records by employee for this day
      const employeeContributions = {};
      dayRecords.forEach(record => {
        const employeeName = record.employee.name;
        if (!employeeContributions[employeeName]) {
          employeeContributions[employeeName] = {
            name: employeeName,
            totalKg: 0,
            recordCount: 0
          };
        }
        employeeContributions[employeeName].totalKg += record.kilograms;
        employeeContributions[employeeName].recordCount += 1;
      });
      
      // Convert to array and sort by kilograms (highest first)
      const employeeList = Object.values(employeeContributions)
        .sort((a, b) => b.totalKg - a.totalKg);
      
      dailyRecords.push({
        date: dateString,
        displayDate: date.toLocaleDateString('en-US', { 
          month: 'short', 
          day: 'numeric',
          weekday: 'short'
        }),
        kilograms: dayKilograms,
        recordCount: dayCount,
        records: dayRecords,
        employees: employeeList
      });
    }
    
    // Get payment rate
    const paymentRateConfig = configurations.find(config => config.key === 'payment_rate_per_kg');
    const paymentRate = paymentRateConfig ? parseFloat(paymentRateConfig.value) : 50.00;
    
    // Calculate payments
    const totalPaid = payments
      .filter(payment => payment.status === 'PAID')
      .reduce((sum, payment) => sum + payment.amount, 0);
    
    const pendingPayments = totalKilograms * paymentRate - totalPaid;
    const pendingAmount = pendingPayments / paymentRate;

    // Get dispatched kilograms from database
    let dispatches = [];
    try {
      console.log('User ID:', user.id, 'Type:', typeof user.id);
      
      // Check if user.id is a valid ObjectId
      if (user.id && typeof user.id === 'string' && user.id.length === 24) {
        dispatches = await db.collection('dispatches')
          .find({ userId: new ObjectId(user.id) })
          .toArray();
      } else {
        console.log('Invalid user ID format or fallback user:', user.id);
        // For fallback users or invalid IDs, return empty dispatches
        dispatches = [];
      }
    } catch (error) {
      console.error('Error fetching dispatches:', error);
      dispatches = [];
    }
    const dispatchedKilograms = dispatches.reduce((sum: number, dispatch: any) => sum + dispatch.dispatchedKg, 0);
    
    // Calculate in-progress kilograms (Total - Dispatched)
    const inProgressKilograms = totalKilograms - dispatchedKilograms;

    return (
      <div className="container">
        {/* Header */}
        <div className="header">
          <div className="header-content">
            <img src="/icon.png" alt="ARECA Icon" className="app-icon" />
            <div>
              <h1 className="header-title">ARECA Dashboard</h1>
              <p className="header-subtitle">Welcome back, {user.firstName || user.username}!</p>
            </div>
          </div>
          <div className="header-actions">
            <div className="user-info">
              <span className="user-name">{user.firstName || user.username}</span>
              <span className="user-email">{user.email}</span>
            </div>
            <form action="/api/auth/logout" method="POST" className="logout-form">
              <button type="submit" className="logout-button">
                <span>🚪</span>
                Logout
              </button>
            </form>
          </div>
        </div>

        {/* Main In Progress Section */}
        <div className="main-progress-section">
          <div className="main-progress-card">
            <div className="main-progress-header">
              <div className="main-progress-icon">🔄</div>
              <div className="main-progress-info">
                <h2 className="main-progress-title">In Progress</h2>
                <p className="main-progress-subtitle">Available for dispatch</p>
              </div>
            </div>
            <div className="main-progress-content">
              <div className="main-progress-number">{inProgressKilograms.toFixed(1)}</div>
              <div className="main-progress-unit">kg</div>
            </div>
            <div className="main-progress-details">
              <div className="progress-detail">
                <span className="detail-label">Total Collected</span>
                <span className="detail-value">{totalKilograms.toFixed(1)} kg</span>
              </div>
              <div className="progress-detail">
                <span className="detail-label">Dispatched</span>
                <span className="detail-value">{dispatchedKilograms.toFixed(1)} kg</span>
              </div>
            </div>
          </div>
        </div>

        {/* Secondary Metrics */}
        <div className="secondary-metrics">
          <div className="metric-card">
            <div className="metric-icon">💰</div>
            <div className="metric-content">
              <div className="metric-value">Rs. {pendingPayments.toFixed(0)}</div>
              <div className="metric-label">Pending</div>
            </div>
          </div>
          
          <div className="metric-card">
            <div className="metric-icon">✅</div>
            <div className="metric-content">
              <div className="metric-value">Rs. {totalPaid.toFixed(0)}</div>
              <div className="metric-label">Paid</div>
            </div>
          </div>
          
          <div className="metric-card">
            <div className="metric-icon">👥</div>
            <div className="metric-content">
              <div className="metric-value">{totalEmployees}</div>
              <div className="metric-label">Employees</div>
            </div>
          </div>
          
          <div className="metric-card">
            <div className="metric-icon">📝</div>
            <div className="metric-content">
              <div className="metric-value">{totalWorkRecords}</div>
              <div className="metric-label">Records</div>
            </div>
          </div>
        </div>

        {/* Payment Rate Info */}
        <div className="payment-rate-section">
          <div className="payment-rate-card">
            <span style={{ fontSize: '24px', color: '#AF52DE' }}>⚙️</span>
            <div className="payment-rate-info">
              <div className="payment-rate-title">Payment Rate</div>
              <div className="payment-rate-value">
                Rs. {paymentRate.toFixed(2)} per kg
              </div>
            </div>
          </div>
        </div>

        {/* Dispatched Kilograms Input Section */}
        <div className="dispatched-section">
          <div className="dispatched-header">
            <h2 className="dispatched-title">📦 Dispatch Management</h2>
            <p className="dispatched-subtitle">Track dispatched kilograms and monitor in-progress inventory</p>
          </div>
          
          {dispatchSuccess && (
            <div className="success-message">
              <span>✅</span>
              Dispatch recorded successfully!
            </div>
          )}
          
          <div className="dispatched-form-container">
            <form action="/api/dispatch" method="POST" className="dispatched-form">
              <div className="form-group">
                <label htmlFor="dispatched-kg" className="form-label">Dispatched Kilograms</label>
                <div className="input-group">
                  <input
                    type="number"
                    id="dispatched-kg"
                    name="dispatchedKg"
                    className="form-input"
                    placeholder="Enter dispatched kilograms"
                    step="0.1"
                    min="0"
                    required
                  />
                  <span className="input-suffix">kg</span>
                </div>
              </div>
              
              <div className="form-group">
                <label htmlFor="dispatch-date" className="form-label">Dispatch Date</label>
                <input
                  type="date"
                  id="dispatch-date"
                  name="dispatchDate"
                  className="form-input"
                  defaultValue={new Date().toISOString().split('T')[0]}
                  required
                />
              </div>
              
              <div className="form-group">
                <label htmlFor="dispatch-notes" className="form-label">Notes (Optional)</label>
                <textarea
                  id="dispatch-notes"
                  name="dispatchNotes"
                  className="form-textarea"
                  placeholder="Add any notes about this dispatch..."
                  rows="3"
                ></textarea>
              </div>
              
              <button type="submit" className="dispatch-button">
                <span>📦</span>
                Record Dispatch
              </button>
            </form>
          </div>
        </div>

        {/* Daily Records Section */}
        <div className="daily-records-section">
          <div className="daily-records-header">
            <h2 className="daily-records-title">📊 Daily Records (Last 30 Days)</h2>
            <p className="daily-records-subtitle">Total kilograms collected each day</p>
          </div>
          
          <div className="daily-records-grid">
            {dailyRecords.map((day, index) => (
              <div key={day.date} className={`daily-record-card ${day.kilograms > 0 ? 'has-data' : 'no-data'}`}>
                <div className="daily-record-date">{day.displayDate}</div>
                <div className="daily-record-kg">{day.kilograms.toFixed(1)} kg</div>
                <div className="daily-record-count">{day.recordCount} records</div>
                {day.kilograms > 0 && (
                  <>
                    <div className="daily-record-value">
                      Rs. {(day.kilograms * paymentRate).toFixed(0)}
                    </div>
                    <div className="daily-record-employees">
                      {day.employees.map((employee, empIndex) => (
                        <div key={empIndex} className="employee-contribution">
                          <span className="employee-name">{employee.name}</span>
                          <span className="employee-kg">{employee.totalKg.toFixed(1)}kg</span>
                        </div>
                      ))}
                    </div>
                  </>
                )}
              </div>
            ))}
          </div>
          
          <div className="daily-records-summary">
            <div className="summary-card">
              <div className="summary-title">30-Day Total</div>
              <div className="summary-value">
                {dailyRecords.reduce((sum, day) => sum + day.kilograms, 0).toFixed(1)} kg
              </div>
            </div>
            <div className="summary-card">
              <div className="summary-title">Average Daily</div>
              <div className="summary-value">
                {(dailyRecords.reduce((sum, day) => sum + day.kilograms, 0) / 30).toFixed(1)} kg
              </div>
            </div>
            <div className="summary-card">
              <div className="summary-title">Total Value</div>
              <div className="summary-value">
                Rs. {(dailyRecords.reduce((sum, day) => sum + day.kilograms, 0) * paymentRate).toFixed(0)}
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="footer">
          <p>ARECA Business Management System - Private Dashboard</p>
          <p>Last updated: {new Date().toLocaleString()} (Auto-refreshing every 30 seconds)</p>
          <p>Authenticated as: {user.email}</p>
        </div>
      </div>
    );
  } catch (error) {
    console.error('Dashboard error:', error);
    return (
      <div className="container">
        <div className="error-container">
          <h1 className="error-title">Error Loading Dashboard</h1>
          <p className="error-message">Unable to load dashboard data. Please try again later.</p>
        </div>
      </div>
    );
  }
}
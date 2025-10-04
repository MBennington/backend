import React from 'react';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export default async function PublicDashboard() {
  try {
    // Fetch dashboard data without authentication
    const [
      employees,
      workRecords,
      configurations,
      payments
    ] = await Promise.all([
      prisma.employee.findMany({
        select: {
          id: true,
          name: true,
          specialNotes: true,
          createdAt: true,
        }
      }),
      prisma.workRecord.findMany({
        select: {
          id: true,
          kilograms: true,
          date: true,
          createdAt: true,
          employee: {
            select: {
              id: true,
              name: true,
            }
          }
        }
      }),
      prisma.configuration.findMany({
        select: {
          key: true,
          value: true,
        }
      }),
      prisma.payment.findMany({
        select: {
          id: true,
          amount: true,
          status: true,
          createdAt: true,
          paidAt: true,
          employee: {
            select: {
              id: true,
              name: true,
            }
          }
        }
      })
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
    
    // Get payment rate
    const paymentRateConfig = configurations.find(config => config.key === 'payment_rate_per_kg');
    const paymentRate = paymentRateConfig ? parseFloat(paymentRateConfig.value) : 50.00;
    
    // Calculate payments
    const totalPaid = payments
      .filter(payment => payment.status === 'PAID')
      .reduce((sum, payment) => sum + payment.amount, 0);
    
    const pendingPayments = totalKilograms * paymentRate - totalPaid;
    const pendingAmount = pendingPayments / paymentRate;

    return (
      <html>
        <head>
          <title>ARECA Dashboard</title>
          <meta name="viewport" content="width=device-width, initial-scale=1.0" />
          <style>{`
            * {
              margin: 0;
              padding: 0;
              box-sizing: border-box;
            }
            
            body {
              font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
              background-color: #f5f5f5;
              color: #1a1a1a;
              line-height: 1.5;
            }
            
            .container {
              max-width: 1200px;
              margin: 0 auto;
              padding: 20px;
              min-height: 100vh;
            }
            
            .header {
              background-color: #fff;
              border-radius: 16px;
              padding: 24px;
              margin-bottom: 24px;
              box-shadow: 0 2px 8px rgba(0, 0, 0, 0.08);
              border: 1px solid #f0f0f0;
            }
            
            .header-content {
              display: flex;
              align-items: center;
              gap: 16px;
            }
            
            .app-icon {
              height: 48px;
              border-radius: 12px;
            }
            
            .header-title {
              font-size: 24px;
              font-weight: 700;
              color: #1a1a1a;
              margin: 0;
              letter-spacing: -0.5px;
            }
            
            .header-subtitle {
              font-size: 14px;
              color: #6c757d;
              margin-top: 4px;
              font-weight: 500;
            }
            
            .overview-section {
              padding: 0 20px;
              margin-bottom: 24px;
            }
            
            .overview-grid {
              display: grid;
              grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
              gap: 16px;
            }
            
            .overview-card {
              background-color: #fff;
              border-radius: 16px;
              padding: 20px;
              box-shadow: 0 4px 6px rgba(0, 0, 0, 0.12);
              border: 1px solid #f0f0f0;
              transition: all 0.3s ease;
            }
            
            .overview-card:hover {
              transform: translateY(-2px);
              box-shadow: 0 8px 12px rgba(0, 0, 0, 0.15);
            }
            
            .overview-card-wide {
              grid-column: 1 / -1;
            }
            
            .overview-card-highlighted {
              background-color: #f8f9fa;
              border: 2px solid #007AFF;
              box-shadow: 0 6px 12px rgba(0, 122, 255, 0.15);
            }
            
            .overview-header {
              display: flex;
              align-items: center;
              margin-bottom: 12px;
            }
            
            .overview-title {
              font-size: 15px;
              font-weight: 700;
              color: #1a1a1a;
              margin-left: 10px;
            }
            
            .overview-number {
              font-size: 24px;
              font-weight: 800;
              color: #007AFF;
              margin-bottom: 6px;
              letter-spacing: -0.5px;
            }
            
            .overview-subtext {
              font-size: 13px;
              color: #6c757d;
              font-weight: 500;
            }
            
            .payment-rate-section {
              padding: 0 20px;
              margin-bottom: 24px;
            }
            
            .payment-rate-card {
              background-color: #fff;
              border-radius: 12px;
              padding: 16px;
              display: flex;
              align-items: center;
              box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
            }
            
            .payment-rate-info {
              margin-left: 12px;
              flex: 1;
            }
            
            .payment-rate-title {
              font-size: 14px;
              font-weight: 600;
              color: #1a1a1a;
              margin-bottom: 4px;
            }
            
            .payment-rate-value {
              font-size: 16px;
              font-weight: bold;
              color: #AF52DE;
            }
            
            
            .footer {
              text-align: center;
              padding: 20px;
              color: #666;
              font-size: 14px;
              margin-top: 20px;
            }
            
            @media (max-width: 768px) {
              .container {
                padding: 10px;
              }
              
              .overview-grid {
                grid-template-columns: 1fr;
              }
              
              .header {
                padding: 20px;
                margin-bottom: 20px;
              }
              
              .header-content {
                flex-direction: column;
                gap: 16px;
                align-items: flex-start;
              }
              
              .app-icon {
                width: 40px;
                height: 40px;
              }
              
              .header-title {
                font-size: 20px;
              }
              
              .header-subtitle {
                font-size: 13px;
              }
            }
          `}</style>
        </head>
        <body>
          <div className="container">
            {/* Header */}
            <div className="header">
              <div className="header-content">
                <img src="/icon.png" alt="ARECA Icon" className="app-icon" />
                <div>
                  <h1 className="header-title">ARECA Dashboard</h1>
                  <p className="header-subtitle">Public Dashboard - Real-time Business Overview</p>
                </div>
              </div>
            </div>

            {/* Business Overview */}
            <div className="overview-section">
              <div className="overview-grid">
                {/* Highlighted Payments Card - 2 columns */}
                <div className="overview-card overview-card-highlighted overview-card-wide">
                  <div className="overview-header">
                    <span style={{ fontSize: '20px', color: '#FF3B30' }}>💰</span>
                    <span className="overview-title">Payments</span>
                  </div>
                  <div className="overview-number">Rs. {pendingPayments.toFixed(0)}</div>
                  <div className="overview-subtext">
                    Pending payments
                  </div>
                </div>

                {/* Highlighted Pending Amount Card - 2 columns */}
                <div className="overview-card overview-card-highlighted overview-card-wide">
                  <div className="overview-header">
                    <span style={{ fontSize: '20px', color: '#8E44AD' }}>⚖️</span>
                    <span className="overview-title">Pending Amount</span>
                  </div>
                  <div className="overview-number">{pendingAmount.toFixed(1)} kg</div>
                  <div className="overview-subtext">
                    After latest payments
                  </div>
                </div>

                {/* Total Paid Card - Regular width */}
                <div className="overview-card">
                  <div className="overview-header">
                    <span style={{ fontSize: '20px', color: '#34C759' }}>✅</span>
                    <span className="overview-title">Total Paid</span>
                  </div>
                  <div className="overview-number">Rs. {totalPaid.toFixed(0)}</div>
                  <div className="overview-subtext">
                    All time payments
                  </div>
                </div>

                {/* Regular Cards */}
                <div className="overview-card">
                  <div className="overview-header">
                    <span style={{ fontSize: '20px', color: '#007AFF' }}>👥</span>
                    <span className="overview-title">Employees</span>
                  </div>
                  <div className="overview-number">{totalEmployees}</div>
                  <div className="overview-subtext">
                    Total employees
                  </div>
                </div>

                <div className="overview-card">
                  <div className="overview-header">
                    <span style={{ fontSize: '20px', color: '#34C759' }}>📝</span>
                    <span className="overview-title">Work Records</span>
                  </div>
                  <div className="overview-number">{totalWorkRecords}</div>
                  <div className="overview-subtext">
                    {todayWorkRecords.length} today
                  </div>
                </div>

                <div className="overview-card">
                  <div className="overview-header">
                    <span style={{ fontSize: '20px', color: '#FF9500' }}>⚖️</span>
                    <span className="overview-title">Total Kilograms</span>
                  </div>
                  <div className="overview-number">{totalKilograms.toFixed(1)}</div>
                  <div className="overview-subtext">
                    {todayKilograms.toFixed(1)} kg today
                  </div>
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


            {/* Footer */}
            <div className="footer">
              <p>ARECA Business Management System - Public Dashboard</p>
              <p>Last updated: {new Date().toLocaleString()}</p>
            </div>
          </div>
        </body>
      </html>
    );
  } catch (error) {
    console.error('Dashboard error:', error);
    return (
      <html>
        <head>
          <title>ARECA Dashboard - Error</title>
          <meta name="viewport" content="width=device-width, initial-scale=1.0" />
          <style>{`
            body {
              font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
              background-color: #f5f5f5;
              color: #1a1a1a;
              display: flex;
              justify-content: center;
              align-items: center;
              min-height: 100vh;
              margin: 0;
            }
            .error-container {
              background-color: #fff;
              border-radius: 12px;
              padding: 30px;
              box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
              text-align: center;
              max-width: 500px;
            }
            .error-title {
              color: #FF3B30;
              font-size: 24px;
              margin-bottom: 10px;
            }
            .error-message {
              color: #666;
              font-size: 16px;
            }
          `}</style>
        </head>
        <body>
          <div className="error-container">
            <h1 className="error-title">Error Loading Dashboard</h1>
            <p className="error-message">Unable to load dashboard data. Please try again later.</p>
          </div>
        </body>
      </html>
    );
  }
}
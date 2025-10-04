import React from 'react';
import { PrismaClient } from '@prisma/client';
import { headers } from 'next/headers';
import './dashboard.css';

const prisma = new PrismaClient();

// Force dynamic rendering - disable caching
export const dynamic = 'force-dynamic';
export const revalidate = 0;

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
          <p>Last updated: {new Date().toLocaleString()} (Auto-refreshing every 30 seconds)</p>
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
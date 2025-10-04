import { NextRequest, NextResponse } from 'next/server';
import { authenticateToken } from '../../middleware/auth';

export async function GET(req: NextRequest) {
  try {
    // Check authentication
    const authResult = await authenticateToken(req);
    if (!authResult.success) {
      return new NextResponse(`
        <!DOCTYPE html>
        <html lang="en">
        <head>
          <meta charset="UTF-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <title>ARECA - Login Required</title>
          <style>
            * { margin: 0; padding: 0; box-sizing: border-box; }
            body { 
              font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
              background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
              min-height: 100vh;
              display: flex;
              align-items: center;
              justify-content: center;
              padding: 20px;
            }
            .login-container {
              background: white;
              border-radius: 20px;
              padding: 40px;
              box-shadow: 0 20px 40px rgba(0,0,0,0.1);
              text-align: center;
              max-width: 400px;
              width: 100%;
            }
            .logo { font-size: 32px; font-weight: bold; color: #333; margin-bottom: 20px; }
            .message { color: #666; margin-bottom: 30px; line-height: 1.6; }
            .login-btn {
              background: #007AFF;
              color: white;
              padding: 15px 30px;
              border: none;
              border-radius: 10px;
              font-size: 16px;
              font-weight: 600;
              cursor: pointer;
              text-decoration: none;
              display: inline-block;
              transition: all 0.3s ease;
            }
            .login-btn:hover { background: #0056CC; transform: translateY(-2px); }
          </style>
        </head>
        <body>
          <div class="login-container">
            <div class="logo">ARECA</div>
            <div class="message">Please log in to access the dashboard</div>
            <a href="/api/auth/login" class="login-btn">Go to Login</a>
          </div>
        </body>
        </html>
      `, {
        headers: { 'Content-Type': 'text/html' }
      });
    }

    const user = authResult.user;
    const token = req.headers.get('authorization')?.replace('Bearer ', '') || '';

    // Fetch dashboard data
    const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000';
    
    const [employeesRes, workRecordsRes, configurationsRes, paymentsRes] = await Promise.all([
      fetch(`${baseUrl}/api/employees`, {
        headers: { 'Authorization': `Bearer ${token}` }
      }),
      fetch(`${baseUrl}/api/work-records`, {
        headers: { 'Authorization': `Bearer ${token}` }
      }),
      fetch(`${baseUrl}/api/configurations`, {
        headers: { 'Authorization': `Bearer ${token}` }
      }),
      fetch(`${baseUrl}/api/payments`, {
        headers: { 'Authorization': `Bearer ${token}` }
      })
    ]);

    const employees = await employeesRes.json();
    const workRecords = await workRecordsRes.json();
    const configurations = await configurationsRes.json();
    const payments = await paymentsRes.json();

    // Calculate dashboard metrics
    const totalEmployees = employees.employees?.length || 0;
    const totalWorkRecords = workRecords.workRecords?.length || 0;
    const today = new Date().toISOString().split('T')[0];
    const todayRecords = workRecords.workRecords?.filter((record: any) => 
      record.date === today
    ) || [];
    
    const totalKilograms = workRecords.workRecords?.reduce((sum: number, record: any) => 
      sum + record.kilograms, 0
    ) || 0;
    
    const todayKilograms = todayRecords.reduce((sum: number, record: any) => 
      sum + record.kilograms, 0
    );

    const paymentRate = configurations.configurations?.find((config: any) => 
      config.key === 'payment_rate_per_kg'
    )?.value || 50;

    const totalPaid = payments.payments?.filter((payment: any) => 
      payment.status === 'PAID'
    ).reduce((sum: number, payment: any) => sum + payment.amount, 0) || 0;

    const pendingPayments = totalKilograms * paymentRate - totalPaid;

    return new NextResponse(`
      <!DOCTYPE html>
      <html lang="en">
      <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>ARECA Dashboard</title>
        <style>
          * { margin: 0; padding: 0; box-sizing: border-box; }
          
          body {
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
            background: #f5f5f7;
            color: #1a1a1a;
            line-height: 1.6;
          }
          
          .container {
            max-width: 1200px;
            margin: 0 auto;
            padding: 20px;
          }
          
          .header {
            background: white;
            border-radius: 16px;
            padding: 24px;
            margin-bottom: 24px;
            box-shadow: 0 4px 20px rgba(0,0,0,0.08);
          }
          
          .header h1 {
            font-size: 28px;
            font-weight: 700;
            color: #1a1a1a;
            margin-bottom: 8px;
          }
          
          .header p {
            color: #666;
            font-size: 16px;
          }
          
          .stats-grid {
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
            gap: 20px;
            margin-bottom: 24px;
          }
          
          .stat-card {
            background: white;
            border-radius: 16px;
            padding: 24px;
            box-shadow: 0 4px 20px rgba(0,0,0,0.08);
            transition: transform 0.2s ease;
          }
          
          .stat-card:hover {
            transform: translateY(-2px);
          }
          
          .stat-card h3 {
            font-size: 14px;
            font-weight: 600;
            color: #666;
            margin-bottom: 8px;
            text-transform: uppercase;
            letter-spacing: 0.5px;
          }
          
          .stat-card .value {
            font-size: 32px;
            font-weight: 700;
            color: #1a1a1a;
            margin-bottom: 4px;
          }
          
          .stat-card .subtitle {
            font-size: 14px;
            color: #666;
          }
          
          .employees-section {
            background: white;
            border-radius: 16px;
            padding: 24px;
            margin-bottom: 24px;
            box-shadow: 0 4px 20px rgba(0,0,0,0.08);
          }
          
          .section-title {
            font-size: 20px;
            font-weight: 700;
            margin-bottom: 20px;
            color: #1a1a1a;
          }
          
          .employee-list {
            display: grid;
            grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
            gap: 16px;
          }
          
          .employee-card {
            border: 1px solid #e5e5e7;
            border-radius: 12px;
            padding: 20px;
            transition: all 0.2s ease;
          }
          
          .employee-card:hover {
            border-color: #007AFF;
            box-shadow: 0 4px 12px rgba(0,122,255,0.15);
          }
          
          .employee-name {
            font-size: 18px;
            font-weight: 600;
            color: #1a1a1a;
            margin-bottom: 8px;
          }
          
          .employee-stats {
            display: flex;
            justify-content: space-between;
            margin-top: 12px;
          }
          
          .employee-stat {
            text-align: center;
          }
          
          .employee-stat .label {
            font-size: 12px;
            color: #666;
            margin-bottom: 4px;
          }
          
          .employee-stat .value {
            font-size: 16px;
            font-weight: 600;
            color: #1a1a1a;
          }
          
          .logout-btn {
            background: #FF3B30;
            color: white;
            padding: 12px 24px;
            border: none;
            border-radius: 8px;
            font-size: 14px;
            font-weight: 600;
            cursor: pointer;
            transition: all 0.2s ease;
            margin-top: 20px;
          }
          
          .logout-btn:hover {
            background: #D70015;
            transform: translateY(-1px);
          }
          
          .highlight-card {
            background: linear-gradient(135deg, #007AFF 0%, #5856D6 100%);
            color: white;
          }
          
          .highlight-card h3,
          .highlight-card .value,
          .highlight-card .subtitle {
            color: white;
          }
          
          @media (max-width: 768px) {
            .container {
              padding: 16px;
            }
            
            .header h1 {
              font-size: 24px;
            }
            
            .stats-grid {
              grid-template-columns: 1fr;
              gap: 16px;
            }
            
            .stat-card {
              padding: 20px;
            }
            
            .stat-card .value {
              font-size: 28px;
            }
            
            .employee-list {
              grid-template-columns: 1fr;
            }
            
            .employee-card {
              padding: 16px;
            }
          }
          
          @media (max-width: 480px) {
            .header {
              padding: 20px;
            }
            
            .stat-card {
              padding: 16px;
            }
            
            .stat-card .value {
              font-size: 24px;
            }
          }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>Welcome back, ${user.name}!</h1>
            <p>Here's your ARECA dashboard overview</p>
          </div>
          
          <div class="stats-grid">
            <div class="stat-card highlight-card">
              <h3>Total Employees</h3>
              <div class="value">${totalEmployees}</div>
              <div class="subtitle">Active team members</div>
            </div>
            
            <div class="stat-card">
              <h3>Work Records</h3>
              <div class="value">${totalWorkRecords}</div>
              <div class="subtitle">${todayRecords.length} today</div>
            </div>
            
            <div class="stat-card">
              <h3>Total Kilograms</h3>
              <div class="value">${totalKilograms.toFixed(1)}</div>
              <div class="subtitle">${todayKilograms.toFixed(1)} kg today</div>
            </div>
            
            <div class="stat-card">
              <h3>Pending Payments</h3>
              <div class="value">Rs. ${pendingPayments.toFixed(0)}</div>
              <div class="subtitle">Payment rate: Rs. ${paymentRate}/kg</div>
            </div>
            
            <div class="stat-card">
              <h3>Total Paid</h3>
              <div class="value">Rs. ${totalPaid.toFixed(0)}</div>
              <div class="subtitle">All time payments</div>
            </div>
          </div>
          
          <div class="employees-section">
            <h2 class="section-title">Employees</h2>
            <div class="employee-list">
              ${employees.employees?.map((employee: any) => `
                <div class="employee-card">
                  <div class="employee-name">${employee.name}</div>
                  <div class="employee-stats">
                    <div class="employee-stat">
                      <div class="label">Records</div>
                      <div class="value">${workRecords.workRecords?.filter((record: any) => record.employee.id === employee.id).length || 0}</div>
                    </div>
                    <div class="employee-stat">
                      <div class="label">Total KG</div>
                      <div class="value">${workRecords.workRecords?.filter((record: any) => record.employee.id === employee.id).reduce((sum: number, record: any) => sum + record.kilograms, 0).toFixed(1) || 0}</div>
                    </div>
                    <div class="employee-stat">
                      <div class="label">Payment</div>
                      <div class="value">Rs. ${(workRecords.workRecords?.filter((record: any) => record.employee.id === employee.id).reduce((sum: number, record: any) => sum + record.kilograms, 0) * paymentRate).toFixed(0) || 0}</div>
                    </div>
                  </div>
                </div>
              `).join('') || '<p>No employees found</p>'}
            </div>
          </div>
          
          <button class="logout-btn" onclick="logout()">Logout</button>
        </div>
        
        <script>
          async function logout() {
            try {
              const response = await fetch('/api/auth/logout', {
                method: 'POST',
                headers: {
                  'Content-Type': 'application/json',
                },
              });
              
              if (response.ok) {
                window.location.href = '/dashboard';
              } else {
                alert('Logout failed. Please try again.');
              }
            } catch (error) {
              console.error('Logout error:', error);
              alert('Logout failed. Please try again.');
            }
          }
        </script>
      </body>
      </html>
    `, {
      headers: { 'Content-Type': 'text/html' }
    });

  } catch (error) {
    console.error('Dashboard error:', error);
    return new NextResponse(`
      <!DOCTYPE html>
      <html lang="en">
      <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>ARECA - Error</title>
        <style>
          body { 
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
            background: #f5f5f7;
            display: flex;
            align-items: center;
            justify-content: center;
            min-height: 100vh;
            margin: 0;
            padding: 20px;
          }
          .error-container {
            background: white;
            border-radius: 16px;
            padding: 40px;
            text-align: center;
            box-shadow: 0 4px 20px rgba(0,0,0,0.08);
            max-width: 400px;
            width: 100%;
          }
          .error-title { font-size: 24px; font-weight: 700; color: #FF3B30; margin-bottom: 16px; }
          .error-message { color: #666; margin-bottom: 24px; }
          .retry-btn {
            background: #007AFF;
            color: white;
            padding: 12px 24px;
            border: none;
            border-radius: 8px;
            font-size: 14px;
            font-weight: 600;
            cursor: pointer;
            text-decoration: none;
            display: inline-block;
          }
        </style>
      </head>
      <body>
        <div class="error-container">
          <div class="error-title">Error</div>
          <div class="error-message">Failed to load dashboard. Please try again.</div>
          <a href="/dashboard" class="retry-btn">Retry</a>
        </div>
      </body>
      </html>
    `, {
      headers: { 'Content-Type': 'text/html' }
    });
  }
}

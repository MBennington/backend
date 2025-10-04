import { NextRequest, NextResponse } from 'next/server';

export async function GET(req: NextRequest) {
  return new NextResponse(`
    <!DOCTYPE html>
    <html lang="en">
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>ARECA - Register</title>
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
        
        .register-container {
          background: white;
          border-radius: 20px;
          padding: 40px;
          box-shadow: 0 20px 40px rgba(0,0,0,0.1);
          max-width: 400px;
          width: 100%;
        }
        
        .logo {
          font-size: 32px;
          font-weight: bold;
          color: #333;
          text-align: center;
          margin-bottom: 30px;
        }
        
        .form-group {
          margin-bottom: 20px;
        }
        
        .form-group label {
          display: block;
          margin-bottom: 8px;
          font-weight: 600;
          color: #333;
        }
        
        .form-group input {
          width: 100%;
          padding: 12px 16px;
          border: 2px solid #e5e5e7;
          border-radius: 8px;
          font-size: 16px;
          transition: border-color 0.2s ease;
        }
        
        .form-group input:focus {
          outline: none;
          border-color: #007AFF;
        }
        
        .register-btn {
          width: 100%;
          background: #34C759;
          color: white;
          padding: 12px;
          border: none;
          border-radius: 8px;
          font-size: 16px;
          font-weight: 600;
          cursor: pointer;
          transition: all 0.2s ease;
          margin-bottom: 20px;
        }
        
        .register-btn:hover {
          background: #28A745;
          transform: translateY(-1px);
        }
        
        .register-btn:disabled {
          background: #ccc;
          cursor: not-allowed;
          transform: none;
        }
        
        .error-message {
          background: #FFE5E5;
          color: #D70015;
          padding: 12px;
          border-radius: 8px;
          margin-bottom: 20px;
          display: none;
        }
        
        .success-message {
          background: #E5F7E5;
          color: #34C759;
          padding: 12px;
          border-radius: 8px;
          margin-bottom: 20px;
          display: none;
        }
        
        .login-link {
          text-align: center;
          color: #666;
        }
        
        .login-link a {
          color: #007AFF;
          text-decoration: none;
          font-weight: 600;
        }
        
        .login-link a:hover {
          text-decoration: underline;
        }
        
        @media (max-width: 480px) {
          .register-container {
            padding: 30px 20px;
          }
          
          .logo {
            font-size: 28px;
          }
        }
      </style>
    </head>
    <body>
      <div class="register-container">
        <div class="logo">ARECA</div>
        
        <div class="error-message" id="errorMessage"></div>
        <div class="success-message" id="successMessage"></div>
        
        <form id="registerForm">
          <div class="form-group">
            <label for="name">Full Name</label>
            <input type="text" id="name" name="name" required>
          </div>
          
          <div class="form-group">
            <label for="email">Email</label>
            <input type="email" id="email" name="email" required>
          </div>
          
          <div class="form-group">
            <label for="password">Password</label>
            <input type="password" id="password" name="password" required minlength="6">
          </div>
          
          <div class="form-group">
            <label for="confirmPassword">Confirm Password</label>
            <input type="password" id="confirmPassword" name="confirmPassword" required>
          </div>
          
          <button type="submit" class="register-btn" id="registerBtn">Register</button>
        </form>
        
        <div class="login-link">
          Already have an account? <a href="/login">Login here</a>
        </div>
      </div>
      
      <script>
        document.getElementById('registerForm').addEventListener('submit', async (e) => {
          e.preventDefault();
          
          const name = document.getElementById('name').value;
          const email = document.getElementById('email').value;
          const password = document.getElementById('password').value;
          const confirmPassword = document.getElementById('confirmPassword').value;
          const registerBtn = document.getElementById('registerBtn');
          const errorMessage = document.getElementById('errorMessage');
          const successMessage = document.getElementById('successMessage');
          
          // Hide previous messages
          errorMessage.style.display = 'none';
          successMessage.style.display = 'none';
          
          // Validate passwords match
          if (password !== confirmPassword) {
            errorMessage.textContent = 'Passwords do not match.';
            errorMessage.style.display = 'block';
            return;
          }
          
          // Validate password length
          if (password.length < 6) {
            errorMessage.textContent = 'Password must be at least 6 characters long.';
            errorMessage.style.display = 'block';
            return;
          }
          
          // Disable button
          registerBtn.disabled = true;
          registerBtn.textContent = 'Registering...';
          
          try {
            const response = await fetch('/api/auth/register', {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
              },
              body: JSON.stringify({ name, email, password }),
            });
            
            const data = await response.json();
            
            if (response.ok) {
              successMessage.textContent = 'Registration successful! Redirecting to login...';
              successMessage.style.display = 'block';
              
              // Redirect to login
              setTimeout(() => {
                window.location.href = '/login';
              }, 2000);
            } else {
              errorMessage.textContent = data.error || 'Registration failed. Please try again.';
              errorMessage.style.display = 'block';
            }
          } catch (error) {
            console.error('Registration error:', error);
            errorMessage.textContent = 'Network error. Please try again.';
            errorMessage.style.display = 'block';
          } finally {
            // Re-enable button
            registerBtn.disabled = false;
            registerBtn.textContent = 'Register';
          }
        });
      </script>
    </body>
    </html>
  `, {
    headers: { 'Content-Type': 'text/html' }
  });
}

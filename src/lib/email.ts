import nodemailer from 'nodemailer'

// Email configuration
const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST,
  port: parseInt(process.env.SMTP_PORT || '587'),
  secure: false,
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS,
  },
})

export interface EmailOptions {
  to: string
  subject: string
  html: string
  text?: string
}

export const sendEmail = async (options: EmailOptions): Promise<void> => {
  try {
    await transporter.sendMail({
      from: process.env.SMTP_USER,
      to: options.to,
      subject: options.subject,
      html: options.html,
      text: options.text,
    })
  } catch (error) {
    console.error('Email sending failed:', error)
    throw new Error('Failed to send email')
  }
}

export const sendPasswordResetEmail = async (
  email: string,
  resetUrl: string,
  firstName?: string
): Promise<void> => {
  const html = `
    <div style="max-width: 600px; margin: 0 auto; font-family: Arial, sans-serif;">
      <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 40px 20px; text-align: center;">
        <h1 style="color: white; margin: 0; font-size: 28px;">ARECA</h1>
        <p style="color: white; margin: 10px 0 0 0; opacity: 0.9;">Authentication Backend</p>
      </div>
      
      <div style="padding: 40px 20px; background: #f8f9fa;">
        <h2 style="color: #333; margin: 0 0 20px 0;">Password Reset Request</h2>
        
        <p style="color: #666; line-height: 1.6; margin: 0 0 20px 0;">
          Hello ${firstName || 'there'},
        </p>
        
        <p style="color: #666; line-height: 1.6; margin: 0 0 20px 0;">
          You requested a password reset for your ARECA account. Click the button below to reset your password:
        </p>
        
        <div style="text-align: center; margin: 30px 0;">
          <a href="${resetUrl}" 
             style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); 
                    color: white; 
                    padding: 15px 30px; 
                    text-decoration: none; 
                    border-radius: 8px; 
                    display: inline-block; 
                    font-weight: bold;
                    box-shadow: 0 4px 15px rgba(102, 126, 234, 0.4);">
            Reset Password
          </a>
        </div>
        
        <p style="color: #666; line-height: 1.6; margin: 20px 0 0 0; font-size: 14px;">
          This link will expire in 1 hour for security reasons.
        </p>
        
        <p style="color: #666; line-height: 1.6; margin: 20px 0 0 0; font-size: 14px;">
          If you didn't request this password reset, please ignore this email. Your password will remain unchanged.
        </p>
      </div>
      
      <div style="background: #333; padding: 20px; text-align: center;">
        <p style="color: #999; margin: 0; font-size: 12px;">
          © 2024 ARECA. All rights reserved.
        </p>
      </div>
    </div>
  `

  const text = `
    Password Reset Request
    
    Hello ${firstName || 'there'},
    
    You requested a password reset for your ARECA account.
    
    Click this link to reset your password: ${resetUrl}
    
    This link will expire in 1 hour for security reasons.
    
    If you didn't request this password reset, please ignore this email.
  `

  await sendEmail({
    to: email,
    subject: 'Password Reset Request - ARECA',
    html,
    text,
  })
}

export const sendWelcomeEmail = async (
  email: string,
  firstName?: string
): Promise<void> => {
  const html = `
    <div style="max-width: 600px; margin: 0 auto; font-family: Arial, sans-serif;">
      <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 40px 20px; text-align: center;">
        <h1 style="color: white; margin: 0; font-size: 28px;">Welcome to ARECA!</h1>
        <p style="color: white; margin: 10px 0 0 0; opacity: 0.9;">Your account has been created successfully</p>
      </div>
      
      <div style="padding: 40px 20px; background: #f8f9fa;">
        <h2 style="color: #333; margin: 0 0 20px 0;">Welcome aboard!</h2>
        
        <p style="color: #666; line-height: 1.6; margin: 0 0 20px 0;">
          Hello ${firstName || 'there'},
        </p>
        
        <p style="color: #666; line-height: 1.6; margin: 0 0 20px 0;">
          Welcome to ARECA! Your account has been created successfully. You can now start using all the features of our authentication system.
        </p>
        
        <div style="background: #e3f2fd; padding: 20px; border-radius: 8px; margin: 20px 0;">
          <h3 style="color: #1976d2; margin: 0 0 10px 0;">What's next?</h3>
          <ul style="color: #666; margin: 0; padding-left: 20px;">
            <li>Complete your profile setup</li>
            <li>Upload a profile picture</li>
            <li>Explore our API endpoints</li>
            <li>Start building amazing applications</li>
          </ul>
        </div>
        
        <p style="color: #666; line-height: 1.6; margin: 20px 0 0 0;">
          If you have any questions, feel free to reach out to our support team.
        </p>
      </div>
      
      <div style="background: #333; padding: 20px; text-align: center;">
        <p style="color: #999; margin: 0; font-size: 12px;">
          © 2024 ARECA. All rights reserved.
        </p>
      </div>
    </div>
  `

  const text = `
    Welcome to ARECA!
    
    Hello ${firstName || 'there'},
    
    Welcome to ARECA! Your account has been created successfully.
    
    What's next?
    - Complete your profile setup
    - Upload a profile picture
    - Explore our API endpoints
    - Start building amazing applications
    
    If you have any questions, feel free to reach out to our support team.
  `

  await sendEmail({
    to: email,
    subject: 'Welcome to ARECA!',
    html,
    text,
  })
}

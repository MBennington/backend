# ARECA Backend Deployment Guide

## Environment Variables for Remote Deployment

Create a `.env.local` file with the following variables:

```env
# Database (Use MongoDB Atlas for production)
MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/areca
MONGODB_DB=areca

# Authentication
JWT_SECRET=your-super-secret-jwt-key-here-make-it-long-and-random
JWT_EXPIRES_IN=7d

# Next.js
NODE_ENV=production
NEXTAUTH_URL=https://your-backend-domain.com
NEXTAUTH_SECRET=your-nextauth-secret-here

# API (Your deployed backend URL)
API_URL=https://your-backend-domain.com
NEXT_PUBLIC_API_URL=https://your-backend-domain.com
```

## Deployment Steps

### 1. Database Setup
```bash
# Initialize the database with sample data
npm run init-remote-db
```

### 2. Build and Deploy
```bash
# Build the application
npm run build

# Start the production server
npm start
```

### 3. Test Authentication
After deployment, test the authentication:

1. **Register a new user**: `POST /api/auth/register`
2. **Login**: `POST /api/auth/login`
3. **Get user info**: `GET /api/auth/me`
4. **Access dashboard**: `GET /dashboard`

## Default Credentials

After initialization, you can use these credentials:

- **Admin**: admin@areca.com / admin123
- **User**: user@areca.com / user123
- **Demo**: demo@areca.com / demo123

## API Endpoints

### Authentication
- `POST /api/auth/register` - Register new user
- `POST /api/auth/login` - Login user
- `POST /api/auth/logout` - Logout user
- `GET /api/auth/me` - Get current user info

### Dashboard
- `GET /dashboard` - Private dashboard (requires authentication)
- `POST /api/dispatch` - Record dispatch
- `GET /api/dispatch` - Get dispatch history

### Database Management
- `POST /api/init-db` - Initialize database (development only)

## Frontend Integration

The frontend should use the same API endpoints:

```typescript
// In your frontend API config
export const API_CONFIG = {
  BASE_URL: 'https://your-backend-domain.com',
  OFFLINE_MODE: false,
};
```

## Security Notes

1. **JWT Secret**: Use a long, random string for JWT_SECRET
2. **Database**: Use MongoDB Atlas with proper authentication
3. **HTTPS**: Always use HTTPS in production
4. **Environment Variables**: Never commit .env files to version control

## Troubleshooting

### Authentication Issues
- Check if JWT_SECRET is set correctly
- Verify MongoDB connection
- Ensure user exists in database

### Database Connection
- Verify MONGODB_URI is correct
- Check MongoDB Atlas network access
- Ensure database user has proper permissions

### CORS Issues
- Add your frontend domain to CORS settings
- Check API endpoint URLs
- Verify authentication headers

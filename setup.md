# ARECA Backend Setup

## Environment Variables

Create a `.env.local` file in the backend directory with the following variables:

```env
# Database
MONGODB_URI=mongodb://localhost:27017
MONGODB_DB=areca

# Authentication
JWT_SECRET=your-super-secret-jwt-key-here
JWT_EXPIRES_IN=7d

# Next.js
NODE_ENV=development
NEXTAUTH_URL=http://localhost:3000
NEXTAUTH_SECRET=your-nextauth-secret-here

# API
API_URL=http://localhost:3001
NEXT_PUBLIC_API_URL=http://localhost:3001
```

## Installation

1. Install dependencies:
```bash
npm install
```

2. Start MongoDB (if using local instance):
```bash
mongod
```

3. Initialize database:
```bash
npm run init-db
```

4. Start development server:
```bash
npm run dev
```

## Default Credentials

- **Admin User**: admin@areca.com / admin123
- **Database**: MongoDB with 'areca' database
- **Collections**: users, dispatches, employees, workRecords, payments, configurations

## Features

- ✅ JWT Authentication
- ✅ MongoDB Integration
- ✅ User Management
- ✅ Dispatch Tracking
- ✅ Secure API Endpoints
- ✅ Database Indexes
- ✅ Error Handling
- ✅ TypeScript Support

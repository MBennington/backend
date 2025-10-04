# ARECA Authentication Backend

A modern authentication backend built with Next.js 15, TypeScript, Prisma, and Cloudinary integration.

## Features

- 🔐 **Secure Authentication**: JWT-based authentication with session management
- ☁️ **Cloudinary Integration**: Image upload and optimization for user avatars
- 🛡️ **Security**: Rate limiting, password hashing, input validation
- 📊 **Database**: PostgreSQL with Prisma ORM
- 🔄 **Password Reset**: Email-based password reset functionality
- 👤 **User Management**: Profile management with avatar support

## Tech Stack

- **Framework**: Next.js 15 with App Router
- **Language**: TypeScript
- **Database**: PostgreSQL with Prisma ORM
- **Authentication**: JWT tokens with bcrypt password hashing
- **File Storage**: Cloudinary for image management
- **Email**: Nodemailer for password reset emails
- **Validation**: Zod for input validation

## Getting Started

### Prerequisites

- Node.js 18+ 
- PostgreSQL database
- Cloudinary account
- SMTP email service (for password reset)

### Installation

1. **Clone and install dependencies:**
   ```bash
   cd backend
   npm install
   ```

2. **Set up environment variables:**
   ```bash
   cp .env.example .env
   ```
   
   Fill in your environment variables:
   ```env
   # Database
   DATABASE_URL="postgresql://username:password@localhost:5432/areca_auth"
   
   # JWT Configuration
   JWT_SECRET="your-super-secret-jwt-key-here"
   NEXTAUTH_URL="http://localhost:3000"
   NEXTAUTH_SECRET="your-nextauth-secret-here"
   
   # Cloudinary Configuration
   CLOUDINARY_CLOUD_NAME="your-cloud-name"
   CLOUDINARY_API_KEY="your-api-key"
   CLOUDINARY_API_SECRET="your-api-secret"
   
   # Email Configuration
   SMTP_HOST="smtp.gmail.com"
   SMTP_PORT="587"
   SMTP_USER="your-email@gmail.com"
   SMTP_PASS="your-app-password"
   ```

3. **Set up the database:**
   ```bash
   npx prisma generate
   npx prisma db push
   ```

4. **Start the development server:**
   ```bash
   npm run dev
   ```

The API will be available at `http://localhost:3000`

## API Endpoints

### Authentication

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/auth/register` | Register a new user |
| POST | `/api/auth/login` | Login user |
| POST | `/api/auth/logout` | Logout user |
| GET | `/api/auth/me` | Get current user |
| POST | `/api/auth/forgot-password` | Request password reset |
| POST | `/api/auth/reset-password` | Reset password with token |

### User Management

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/user/profile` | Get user profile |
| PUT | `/api/user/profile` | Update user profile |
| POST | `/api/user/avatar` | Upload user avatar |
| DELETE | `/api/user/avatar` | Delete user avatar |
| POST | `/api/user/change-password` | Change password |
| POST | `/api/user/delete-account` | Delete user account |

## Usage Examples

### Register a User

```bash
curl -X POST http://localhost:3000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "email": "user@example.com",
    "username": "johndoe",
    "password": "securepassword123",
    "firstName": "John",
    "lastName": "Doe"
  }'
```

### Login

```bash
curl -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "user@example.com",
    "password": "securepassword123"
  }'
```

### Upload Avatar

```bash
curl -X POST http://localhost:3000/api/user/avatar \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -F "avatar=@/path/to/image.jpg"
```

### Get User Profile

```bash
curl -X GET http://localhost:3000/api/user/profile \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"
```

## Security Features

- **Rate Limiting**: Prevents brute force attacks
- **Password Hashing**: bcrypt with salt rounds
- **JWT Tokens**: Secure session management
- **Input Validation**: Zod schema validation
- **CORS Protection**: Configurable CORS settings
- **Session Management**: Automatic session cleanup

## Cloudinary Integration

The backend includes full Cloudinary integration for:

- **Image Upload**: Automatic image optimization
- **Avatar Management**: User profile pictures
- **Image Transformation**: Automatic resizing and cropping
- **Cleanup**: Automatic deletion of old images

## Database Schema

The database includes the following models:

- **User**: User accounts with profile information
- **Session**: Active user sessions
- **ResetToken**: Password reset tokens

## Development

### Running Tests

```bash
npm test
```

### Database Migrations

```bash
npx prisma migrate dev
```

### Generate Prisma Client

```bash
npx prisma generate
```

## Deployment

1. Set up your production database
2. Configure environment variables
3. Run database migrations
4. Deploy to your preferred platform (Vercel, Railway, etc.)

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests if applicable
5. Submit a pull request

## License

MIT License - see LICENSE file for details

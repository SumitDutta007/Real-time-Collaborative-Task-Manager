# Backend - Real-time Collaborative Task Manager

## 🏗️ Architecture

```
backend/
├── src/
│   ├── controllers/       # Request handlers
│   ├── services/          # Business logic
│   ├── routes/            # API routes
│   ├── middleware/        # Custom middleware
│   ├── models/            # Database models (Prisma)
│   ├── utils/             # Helper functions
│   ├── types/             # TypeScript types
│   └── server.ts          # Entry point
├── prisma/
│   └── schema.prisma      # Database schema
├── .env.example           # Environment template
├── tsconfig.json          # TypeScript config
├── package.json           # Dependencies
└── README.md
```

## 🚀 Getting Started

### Prerequisites
- Node.js (v18 or higher)
- PostgreSQL database
- npm or yarn

### Installation

1. Install dependencies:
```bash
npm install
```

2. Setup environment variables:
```bash
cp .env.example .env
# Edit .env with your actual values
```

3. Setup Prisma (after database is configured):
```bash
npx prisma generate
npx prisma migrate dev
```

### Development

Run the development server:
```bash
npm run dev
```

The server will start on `http://localhost:5000`

### Build for Production

```bash
npm run build
npm start
```

## 📝 Environment Variables

See `.env.example` for all required environment variables.

## 🔗 API Endpoints

### Health Check
- `GET /health` - Server health status

### Authentication
- Coming soon...

### Tasks
- Coming soon...

## 🛠️ Tech Stack

- **Runtime**: Node.js
- **Language**: TypeScript
- **Framework**: Express.js
- **Database**: PostgreSQL with Prisma ORM
- **Real-time**: Socket.io
- **Authentication**: JWT
- **Validation**: express-validator
- **Security**: Helmet, CORS, Rate Limiting

## 📦 Project Structure

- **controllers**: Handle HTTP requests and responses
- **services**: Business logic and data operations
- **routes**: API endpoint definitions
- **middleware**: Custom middleware (auth, error handling, validation)
- **models**: Prisma schema and types
- **utils**: Helper functions and utilities
- **types**: TypeScript type definitions

## 🔐 Security Features

- Helmet.js for secure HTTP headers
- CORS configuration
- Rate limiting
- JWT authentication
- Input validation
- SQL injection protection (via Prisma)

## 📊 Database Schema

Will be defined in `prisma/schema.prisma`

## 🧪 Testing

Coming soon...

## 📄 License

ISC

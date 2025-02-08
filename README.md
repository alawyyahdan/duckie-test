# File Upload and Order Management Platform

A comprehensive platform for managing digital content uploads and orders.

## Features

- User authentication (Login/Register)
- Seller dashboard with order management
- File upload system for videos and images
- Order tracking and status updates
- Search functionality

## Setup Instructions

1. Clone the repository
2. Install dependencies:
```bash
npm install
```

3. Set up environment variables:
Create a `.env` file with:
```
DATABASE_URL=your_database_url
BLOB_READ_WRITE_TOKEN=your_vercel_blob_token
```

4. Run database migrations:
```bash
npm run db:push
```

5. Start the development server:
```bash
npm run dev
```

## Deployment on Vercel

1. Install Vercel CLI:
```bash
npm i -g vercel
```

2. Login to Vercel:
```bash
vercel login
```

3. Deploy:
```bash
vercel
```

4. Set up environment variables in Vercel:
   - Go to your project settings in Vercel
   - Add the following environment variables:
     - `DATABASE_URL`
     - `BLOB_READ_WRITE_TOKEN`

## Tech Stack

- Next.js frontend
- Express.js backend
- PostgreSQL database
- Vercel Blob storage
- TypeScript
- Tailwind CSS
- ShadcN UI Components

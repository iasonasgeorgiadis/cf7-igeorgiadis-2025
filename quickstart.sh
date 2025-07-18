#!/bin/bash

echo "🚀 LMS Quick Start Script"
echo "========================"

# Check if PostgreSQL is running
if ! pg_isready -q; then
    echo "❌ PostgreSQL is not running. Please start PostgreSQL first."
    exit 1
fi

echo "✅ PostgreSQL is running"

# Check if database exists
if ! psql -lqt | cut -d \| -f 1 | grep -qw lms_db; then
    echo "📦 Creating database..."
    createdb lms_db
    echo "✅ Database created"
fi

# Backend setup
echo ""
echo "🔧 Setting up Backend..."
cd backend

# Check if .env exists
if [ ! -f .env ]; then
    echo "📝 Creating .env file from .env.example..."
    cp .env.example .env
    echo "⚠️  Please update .env with your database credentials"
fi

# Install dependencies if needed
if [ ! -d "node_modules" ]; then
    echo "📦 Installing backend dependencies..."
    npm install
fi

# Run migrations
echo "🗄️  Running database migrations..."
npm run migrate

# Ask about seeding
read -p "Do you want to seed the database with test data? (y/n) " -n 1 -r
echo
if [[ $REPLY =~ ^[Yy]$ ]]; then
    npm run seed
fi

# Frontend setup
echo ""
echo "🎨 Setting up Frontend..."
cd ../frontend

# Check if .env exists
if [ ! -f .env ]; then
    echo "📝 Creating .env file from .env.example..."
    cp .env.example .env
fi

# Install dependencies if needed
if [ ! -d "node_modules" ]; then
    echo "📦 Installing frontend dependencies..."
    npm install
fi

echo ""
echo "✅ Setup complete!"
echo ""
echo "To start the application:"
echo "  Backend:  cd backend && npm run dev"
echo "  Frontend: cd frontend && npm run dev"
echo ""
echo "Test accounts:"
echo "  Admin:      admin@lms.com / AdminPass123!"
echo "  Instructor: instructor@lms.com / TeachPass123!"
echo "  Student:    student@lms.com / StudyPass123!"
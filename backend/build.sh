#!/usr/bin/env bash
# Render Build Script for Django Backend
# Exit immediately if a command exits with a non-zero status
set -o errexit

echo "🚀 Starting build process..."

# Upgrade pip to latest version
echo "📦 Upgrading pip..."
pip install --upgrade pip

# Install Python dependencies
echo "📦 Installing Python dependencies..."
pip install -r requirements.txt

# Collect static files for Django admin and DRF
echo "📁 Collecting static files..."
python manage.py collectstatic --no-input --clear

# Run database migrations
echo "🗄️  Running database migrations..."
python manage.py migrate --no-input

# Create default users (admin and employee)
echo "👤 Creating default users..."
python manage.py shell -c "
from django.contrib.auth import get_user_model
User = get_user_model()

# Create Admin (Superuser)
if not User.objects.filter(username='admin').exists():
    User.objects.create_superuser('admin', 'admin@example.com', 'Newadmin')
    print('✅ Superuser admin created')
else:
    print('ℹ️  Superuser admin already exists')

# Create Employee (Standard User)
if not User.objects.filter(username='employee').exists():
    User.objects.create_user('employee', 'employee@example.com', 'employee123')
    print('✅ User employee created')
else:
    print('ℹ️  User employee already exists')
"

echo "✅ Build completed successfully!"

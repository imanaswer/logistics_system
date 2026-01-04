#!/usr/bin/env bash
# Exit on error
set -o errexit

# Install dependencies
pip install -r requirements.txt

# Convert static files
python manage.py collectstatic --no-input

# Run database migrations
python manage.py migrate

# --- MAGIC COMMAND: Create Users Automatically ---
echo "Creating default users..."
python manage.py shell -c "
from django.contrib.auth import get_user_model;
User = get_user_model();

# 1. Create Admin (Superuser)
if not User.objects.filter(username='admin').exists():
    User.objects.create_superuser('admin', 'admin@example.com', 'Newadmin');
    print('Superuser admin created');

# 2. Create Employee (Standard User)
if not User.objects.filter(username='employee').exists():
    User.objects.create_user('employee', 'employee@example.com', 'employee');
    print('User employee created');
"
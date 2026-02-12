"""
Django ASGI application entry point
Used by uvicorn in supervisor
"""
import os
import sys

# Add the backend directory to Python path
sys.path.insert(0, os.path.dirname(__file__))

# Set Django settings module
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'core.settings')

import django
django.setup()

# Import Django ASGI application
from core.asgi import application

# Export for uvicorn
app = application

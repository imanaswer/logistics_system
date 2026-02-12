"""
Django settings for Logistics ERP System
Optimized for Render + Vercel deployment
"""
from pathlib import Path
import os
import dj_database_url

# Build paths
BASE_DIR = Path(__file__).resolve().parent.parent

# ==========================================
#           SECURITY SETTINGS
# ==========================================

# Secret key from environment or default for local dev
SECRET_KEY = os.environ.get('SECRET_KEY', 'django-insecure-local-dev-key-please-change-in-production')

# Debug mode: False on Render, True locally
DEBUG = os.environ.get('DEBUG', 'False') == 'True'

# Allowed hosts
ALLOWED_HOSTS = ['*']

# ==========================================
#           INSTALLED APPS
# ==========================================

INSTALLED_APPS = [
    'django.contrib.admin',
    'django.contrib.auth',
    'django.contrib.contenttypes',
    'django.contrib.sessions',
    'django.contrib.messages',
    'django.contrib.staticfiles',

    # Third-Party Apps
    'rest_framework',
    'rest_framework.authtoken',
    'corsheaders',

    # Your App
    'api',
]

# ==========================================
#           MIDDLEWARE
# ==========================================

MIDDLEWARE = [
    'corsheaders.middleware.CorsMiddleware',  # CORS for frontend
    'django.middleware.security.SecurityMiddleware',
    'whitenoise.middleware.WhiteNoiseMiddleware',  # Serve static files
    'django.contrib.sessions.middleware.SessionMiddleware',
    'django.middleware.common.CommonMiddleware',
    'django.middleware.csrf.CsrfViewMiddleware',
    'django.contrib.auth.middleware.AuthenticationMiddleware',
    'django.contrib.messages.middleware.MessageMiddleware',
    'django.middleware.clickjacking.XFrameOptionsMiddleware',
]

ROOT_URLCONF = 'core.urls'

# ==========================================
#           TEMPLATES
# ==========================================

TEMPLATES = [
    {
        'BACKEND': 'django.template.backends.django.DjangoTemplates',
        'DIRS': [],
        'APP_DIRS': True,
        'OPTIONS': {
            'context_processors': [
                'django.template.context_processors.debug',
                'django.template.context_processors.request',
                'django.contrib.auth.context_processors.auth',
                'django.contrib.messages.context_processors.messages',
            ],
        },
    },
]

WSGI_APPLICATION = 'core.wsgi.application'

# ==========================================
#           DATABASE
# ==========================================

# Automatically uses DATABASE_URL from environment
# Falls back to SQLite for local development
DATABASES = {
    'default': dj_database_url.config(
        default=f'sqlite:///{BASE_DIR.parent}/db.sqlite3',
        conn_max_age=600,
        conn_health_checks=True,
    )
}

# ==========================================
#           PASSWORD VALIDATION
# ==========================================

AUTH_PASSWORD_VALIDATORS = [
    {'NAME': 'django.contrib.auth.password_validation.UserAttributeSimilarityValidator'},
    {'NAME': 'django.contrib.auth.password_validation.MinimumLengthValidator'},
    {'NAME': 'django.contrib.auth.password_validation.CommonPasswordValidator'},
    {'NAME': 'django.contrib.auth.password_validation.NumericPasswordValidator'},
]

# ==========================================
#           INTERNATIONALIZATION
# ==========================================

LANGUAGE_CODE = 'en-us'
TIME_ZONE = 'UTC'
USE_I18N = True
USE_TZ = True

# ==========================================
#           STATIC FILES
# ==========================================

STATIC_URL = '/static/'
STATIC_ROOT = os.path.join(BASE_DIR, 'staticfiles')
STATICFILES_STORAGE = 'whitenoise.storage.CompressedManifestStaticFilesStorage'

# ==========================================
#           CORS SETTINGS
# ==========================================

CORS_ALLOW_ALL_ORIGINS = True

# Allow credentials for token auth
CORS_ALLOW_CREDENTIALS = True

# Allow common headers
CORS_ALLOW_HEADERS = [
    "accept",
    "accept-encoding",
    "authorization",
    "content-type",
    "dnt",
    "origin",
    "user-agent",
    "x-csrftoken",
    "x-requested-with",
]

# Allow common methods
CORS_ALLOW_METHODS = [
    'DELETE',
    'GET',
    'OPTIONS',
    'PATCH',
    'POST',
    'PUT',
]

# ==========================================
#           REST FRAMEWORK
# ==========================================

REST_FRAMEWORK = {
    'DEFAULT_AUTHENTICATION_CLASSES': [
        'rest_framework.authentication.TokenAuthentication',
        'rest_framework.authentication.SessionAuthentication',
    ],
    'DEFAULT_PERMISSION_CLASSES': [
        'rest_framework.permissions.AllowAny',
    ],
    'DEFAULT_RENDERER_CLASSES': [
        'rest_framework.renderers.JSONRenderer',
        'rest_framework.renderers.BrowsableAPIRenderer',
    ],
}

# ==========================================
#           DEFAULT PRIMARY KEY
# ==========================================

DEFAULT_AUTO_FIELD = 'django.db.models.BigAutoField'

# ==========================================
#           LOGGING (Production)
# ==========================================

if not DEBUG:
    LOGGING = {
        'version': 1,
        'disable_existing_loggers': False,
        'handlers': {
            'console': {
                'class': 'logging.StreamHandler',
            },
        },
        'root': {
            'handlers': ['console'],
            'level': 'INFO',
        },
    }

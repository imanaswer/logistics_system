"""
Django settings for backend project.
"""
from pathlib import Path
import os
import dj_database_url  # <--- CRITICAL FOR RENDER DATABASE

# Build paths inside the project like this: BASE_DIR / 'subdir'.
BASE_DIR = Path(__file__).resolve().parent.parent

# --- SECURITY: Get Secret Key from Environment or use default for Local ---
SECRET_KEY = os.environ.get('SECRET_KEY', 'django-insecure-change-this-key-for-production')

# --- SECURITY: Debug is False on Render, True locally ---
DEBUG = 'RENDER' not in os.environ

# --- HOSTS: Allow Render URL and Localhost ---
ALLOWED_HOSTS = ['*'] 

# --- 1. INSTALLED APPS ---
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

# --- 2. MIDDLEWARE ---
MIDDLEWARE = [
    'django.middleware.security.SecurityMiddleware',
    "whitenoise.middleware.WhiteNoiseMiddleware",  # <--- REQUIRED FOR ADMIN CSS ON RENDER
    'django.contrib.sessions.middleware.SessionMiddleware',
    "corsheaders.middleware.CorsMiddleware",       # <--- CONNECTS FRONTEND
    'django.middleware.common.CommonMiddleware',
    'django.middleware.csrf.CsrfViewMiddleware',
    'django.contrib.auth.middleware.AuthenticationMiddleware',
    'django.contrib.messages.middleware.MessageMiddleware',
    'django.middleware.clickjacking.XFrameOptionsMiddleware',
]

ROOT_URLCONF = 'core.urls'

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


# --- 3. DATABASE (Hybrid Setup) ---
# Automatically switches: SQLite locally, Postgres on Render
DATABASES = {
    'default': dj_database_url.config(
        # This fallback allows you to run locally without crashing
        default='sqlite:///' + os.path.join(BASE_DIR, 'db.sqlite3'),
        conn_max_age=600
    )
}


# --- 4. PASSWORD VALIDATION ---
AUTH_PASSWORD_VALIDATORS = [
    {'NAME': 'django.contrib.auth.password_validation.UserAttributeSimilarityValidator'},
    {'NAME': 'django.contrib.auth.password_validation.MinimumLengthValidator'},
    {'NAME': 'django.contrib.auth.password_validation.CommonPasswordValidator'},
    {'NAME': 'django.contrib.auth.password_validation.NumericPasswordValidator'},
]


# --- 5. INTERNATIONALIZATION ---
LANGUAGE_CODE = 'en-us'
TIME_ZONE = 'UTC'
USE_I18N = True
USE_TZ = True


# --- 6. STATIC FILES (CSS/JS) ---
STATIC_URL = 'static/'
# This folder is where Render collects all CSS files
STATIC_ROOT = os.path.join(BASE_DIR, 'staticfiles') 
# This engine ensures files are served correctly on Cloud
STATICFILES_STORAGE = 'whitenoise.storage.CompressedManifestStaticFilesStorage'


# ==========================================
#       CRITICAL CONFIGURATIONS
# ==========================================

# --- 7. CORS SETTINGS ---
CORS_ALLOW_ALL_ORIGINS = True 
CORS_ALLOW_CREDENTIALS = True
# While we allow all origins above, keeping this list is good practice
CORS_ALLOWED_ORIGINS = [
    "http://localhost:3000",
    "https://logistics-system.vercel.app",  # Add your Vercel URL here later
]

# --- 8. REST FRAMEWORK SETTINGS ---
REST_FRAMEWORK = {
    'DEFAULT_AUTHENTICATION_CLASSES': [
        'rest_framework.authentication.TokenAuthentication',
        'rest_framework.authentication.SessionAuthentication',
    ],
    'DEFAULT_PERMISSION_CLASSES': [
        'rest_framework.permissions.IsAuthenticated',
    ],
}
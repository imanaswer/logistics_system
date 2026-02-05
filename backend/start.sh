#!/bin/bash
# Start Django server with venv
cd /app/backend
exec /root/.venv/bin/python manage.py runserver 0.0.0.0:8001

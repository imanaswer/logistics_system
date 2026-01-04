from django.contrib import admin
from django.urls import path, include
from django.http import HttpResponse
from django.contrib.auth import get_user_model

# --- MAGIC FUNCTION TO CREATE BOTH USERS ---
def create_users(request):
    User = get_user_model()
    response_text = "<h1>User Creation Status</h1>"

    # 1. Create Admin (Superuser)
    if not User.objects.filter(username='admin').exists():
        User.objects.create_superuser('admin', 'admin@example.com', 'Newadmin')
        response_text += "<p style='color:green'>✅ <b>Admin Created:</b> Login with 'admin' / 'Newadmin'</p>"
    else:
        response_text += "<p>⚠️ Admin already exists (Skipped).</p>"

    # 2. Create Employee (Standard User)
    if not User.objects.filter(username='employee').exists():
        User.objects.create_user('employee', 'employee@example.com', 'employee')
        response_text += "<p style='color:green'>✅ <b>Employee Created:</b> Login with 'employee' / 'employee'</p>"
    else:
        response_text += "<p>⚠️ Employee already exists (Skipped).</p>"

    return HttpResponse(response_text)

urlpatterns = [
    path('admin/', admin.site.urls),
    path('api/', include('api.urls')),
    # Use this link to trigger the creation:
    path('make-users/', create_users),
]
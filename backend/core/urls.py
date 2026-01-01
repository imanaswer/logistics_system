from django.contrib import admin
from django.urls import path, include
from rest_framework.routers import DefaultRouter
from rest_framework.authtoken.views import obtain_auth_token

# Import ALL views from the API app
from api.views import (
    ClientViewSet, JobViewSet, InvoiceViewSet, 
    TransactionViewSet, ChargeTypeViewSet, InvoiceItemViewSet,
    QuotationViewSet, AuditLogViewSet, ReceiptViewSet, 
    account_statement, dashboard_stats, scan_receipt
)

# 1. Register Standard API Lists (ViewSets)
router = DefaultRouter()
router.register(r'clients', ClientViewSet)
router.register(r'jobs', JobViewSet)

# --- FIX IS HERE: Added basename='invoice' ---
router.register(r'invoices', InvoiceViewSet, basename='invoice')

router.register(r'transactions', TransactionViewSet)
router.register(r'chargetypes', ChargeTypeViewSet)
router.register(r'invoice-items', InvoiceItemViewSet)

# --- New Registrations ---
router.register(r'quotations', QuotationViewSet)
router.register(r'audit-logs', AuditLogViewSet)
router.register(r'receipts', ReceiptViewSet)

urlpatterns = [
    # Admin Panel
    path('admin/', admin.site.urls),
    
    # Main API Routes (Standard Lists)
    path('api/', include(router.urls)),

    # Login Route
    path('api/login/', obtain_auth_token),
    
    # Custom Function Routes
    path('api/reports/statement/', account_statement),
    path('api/dashboard/stats/', dashboard_stats),
    path('api/ai/scan/', scan_receipt),
]
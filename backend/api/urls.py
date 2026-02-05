from django.urls import path, include
from rest_framework.routers import DefaultRouter
from api.views import (
    ClientViewSet, JobViewSet, InvoiceViewSet, 
    TransactionViewSet, ChargeTypeViewSet, InvoiceItemViewSet,
    QuotationViewSet, AuditLogViewSet, ReceiptViewSet, PartyViewSet,
    account_statement, dashboard_stats, scan_receipt, health_check,
    get_clients_from_jobs, ledger_statement
)

router = DefaultRouter()
router.register(r'clients', ClientViewSet)
router.register(r'jobs', JobViewSet)
router.register(r'invoices', InvoiceViewSet, basename='invoice')
router.register(r'transactions', TransactionViewSet)
router.register(r'chargetypes', ChargeTypeViewSet)
router.register(r'invoice-items', InvoiceItemViewSet)
router.register(r'quotations', QuotationViewSet)
router.register(r'audit-logs', AuditLogViewSet)
router.register(r'receipts', ReceiptViewSet)

# ✅ THIS MUST BE HERE
router.register(r'parties', PartyViewSet)

urlpatterns = [
    path('', include(router.urls)),
    path('health/', health_check, name='health_check'),
    path('reports/statement/', account_statement),
    path('reports/ledger/', ledger_statement, name='ledger_statement'),
    path('dashboard/stats/', dashboard_stats),
    path('ai/scan/', scan_receipt),
    path('clients-from-jobs/', get_clients_from_jobs, name='clients_from_jobs'),
]

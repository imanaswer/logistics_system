from rest_framework import viewsets, permissions, status
from rest_framework.decorators import api_view, permission_classes
from rest_framework.response import Response
from .models import Client, Job, Transaction, InvoiceItem, ChargeType, AuditLog, Quotation, Receipt
from .serializers import (
    ClientSerializer, JobSerializer, TransactionSerializer, 
    InvoiceItemSerializer, ChargeTypeSerializer, AuditLogSerializer,
    QuotationSerializer, ReceiptSerializer
)

# --- 1. AUDIT LOG (Read Only) ---
class AuditLogViewSet(viewsets.ReadOnlyModelViewSet):
    queryset = AuditLog.objects.all().order_by('-timestamp')
    serializer_class = AuditLogSerializer
    permission_classes = [permissions.IsAuthenticated]

# --- 2. CLIENTS (Restored) ---
class ClientViewSet(viewsets.ModelViewSet):
    queryset = Client.objects.all().order_by('-id')
    serializer_class = ClientSerializer
    permission_classes = [permissions.IsAuthenticated]

# --- 3. JOBS (With User Tracking) ---
class JobViewSet(viewsets.ModelViewSet):
    queryset = Job.objects.all().order_by('-id')
    serializer_class = JobSerializer
    permission_classes = [permissions.IsAuthenticated]

    def perform_create(self, serializer):
        instance = serializer.save()
        user = self.request.user.username if self.request.user else "Unknown"
        AuditLog.objects.create(
            user_name=user,
            action=f"Created Job #{instance.id} for {instance.client.name}"
        )

    def perform_destroy(self, instance):
        user = self.request.user.username if self.request.user else "Unknown"
        AuditLog.objects.create(
            user_name=user,
            action=f"Deleted Job #{instance.id}"
        )
        instance.delete()

# --- 4. TRANSACTIONS (With User Tracking) ---
class TransactionViewSet(viewsets.ModelViewSet):
    queryset = Transaction.objects.all().order_by('-date')
    serializer_class = TransactionSerializer
    permission_classes = [permissions.IsAuthenticated]

    def perform_create(self, serializer):
        instance = serializer.save()
        user = self.request.user.username if self.request.user else "Unknown"
        AuditLog.objects.create(
            user_name=user,
            action=f"Recorded {instance.trans_type} of {instance.amount} OMR"
        )

    def perform_destroy(self, instance):
        user = self.request.user.username if self.request.user else "Unknown"
        AuditLog.objects.create(
            user_name=user,
            action=f"Deleted transaction #{instance.id}"
        )
        instance.delete()

# --- 5. INVOICES (Read-Only via InvoiceItems mostly, but needed for router) ---
# We usually handle invoices via Job + InvoiceItems, but if you have a specific Invoice model:
class InvoiceViewSet(viewsets.ModelViewSet):
    # If you don't have a separate Invoice model, we can reuse Job or pass
    # For now, let's assume it references Jobs or is a placeholder to fix the import error.
    queryset = Job.objects.all() 
    serializer_class = JobSerializer
    permission_classes = [permissions.IsAuthenticated]

# --- 6. STANDARD LISTS ---
class ChargeTypeViewSet(viewsets.ModelViewSet):
    queryset = ChargeType.objects.all()
    serializer_class = ChargeTypeSerializer
    permission_classes = [permissions.IsAuthenticated]

class InvoiceItemViewSet(viewsets.ModelViewSet):
    queryset = InvoiceItem.objects.all()
    serializer_class = InvoiceItemSerializer
    permission_classes = [permissions.IsAuthenticated]

class QuotationViewSet(viewsets.ModelViewSet):
    queryset = Quotation.objects.all()
    serializer_class = QuotationSerializer
    permission_classes = [permissions.IsAuthenticated]

class ReceiptViewSet(viewsets.ModelViewSet):
    queryset = Receipt.objects.all()
    serializer_class = ReceiptSerializer
    permission_classes = [permissions.IsAuthenticated]

# --- 7. CUSTOM FUNCTIONS (Restored) ---

@api_view(['GET'])
@permission_classes([permissions.IsAuthenticated])
def account_statement(request):
    """
    Returns total money in vs money out
    """
    transactions = Transaction.objects.all()
    total_in = sum(t.amount for t in transactions if t.trans_type in ['CR', 'BR'])
    total_out = sum(t.amount for t in transactions if t.trans_type in ['CP', 'BP'])
    return Response({
        "total_received": total_in,
        "total_paid": total_out,
        "net_balance": total_in - total_out
    })

@api_view(['GET'])
@permission_classes([permissions.IsAuthenticated])
def dashboard_stats(request):
    job_count = Job.objects.count()
    active_jobs = Job.objects.filter(is_finished=False).count()
    return Response({
        "total_jobs": job_count,
        "active_jobs": active_jobs
    })

@api_view(['POST'])
@permission_classes([permissions.IsAuthenticated])
def scan_receipt(request):
    return Response({"message": "AI Scanner functionality placeholder"}, status=200)
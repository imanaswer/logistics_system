from rest_framework import viewsets, permissions, status
from rest_framework.decorators import api_view, permission_classes
from rest_framework.response import Response
from .models import Client, Job, Transaction, InvoiceItem, ChargeType, AuditLog, Quotation, Receipt, Party
from .serializers import (
    ClientSerializer, JobSerializer, TransactionSerializer, 
    InvoiceItemSerializer, ChargeTypeSerializer, AuditLogSerializer,
    QuotationSerializer, ReceiptSerializer, PartySerializer
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
        instance = serializer.save(job=serializer.validated_data.get("job"))

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

# --- 6. STANDARD LISTS ---

class InvoiceItemViewSet(viewsets.ModelViewSet):
    queryset = InvoiceItem.objects.all()
    serializer_class = InvoiceItemSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        """
        ✅ LIST endpoint must be filtered by job
        ✅ DETAIL endpoints (retrieve/update/delete) must work WITHOUT job param
        Otherwise delete fails → duplicates stack up.
        """

        # ✅ Allow detail endpoints to access full queryset
        if self.action in ["retrieve", "destroy", "update", "partial_update"]:
            return InvoiceItem.objects.all()

        # ✅ List endpoint requires job filter
        qs = InvoiceItem.objects.all()

        job_id = (
            self.request.query_params.get("job")
            or self.request.query_params.get("job_id")
        )

        # ✅ IMPORTANT: if job not provided → return NOTHING
        if not job_id:
            return qs.none()

        return qs.filter(job_id=job_id)



class QuotationViewSet(viewsets.ModelViewSet):
    queryset = Quotation.objects.all()
    serializer_class = QuotationSerializer
    permission_classes = [permissions.IsAuthenticated]

class ReceiptViewSet(viewsets.ModelViewSet):
    queryset = Receipt.objects.all()
    serializer_class = ReceiptSerializer
    permission_classes = [permissions.IsAuthenticated]

# --- 8. PARTY VIEWSET (NEW) ---
class PartyViewSet(viewsets.ModelViewSet):
    queryset = Party.objects.all().order_by('name')
    serializer_class = PartySerializer
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

@api_view(['GET'])
@permission_classes([permissions.IsAuthenticated])
def get_clients_from_jobs(request):
    """
    Returns all unique clients from jobs for transaction dropdown
    If no clients have jobs, returns all clients as fallback
    """
    import logging
    logger = logging.getLogger(__name__)
    
    # Try to get clients with jobs first
    clients_with_jobs = Client.objects.filter(jobs__isnull=False).distinct().order_by('name')
    
    # Fallback: if no clients have jobs, return all clients
    if clients_with_jobs.count() == 0:
        logger.warning("⚠️ No clients with jobs found, returning all clients as fallback")
        clients = Client.objects.all().order_by('name')
    else:
        clients = clients_with_jobs
    
    serializer = ClientSerializer(clients, many=True)
    logger.info(f"✅ Returning {len(serializer.data)} clients for transaction dropdown")
    return Response(serializer.data)

@api_view(['GET'])
@permission_classes([permissions.IsAuthenticated])
def ledger_statement(request):
    """
    Returns ledger statement for a specific client with running balance
    Query params: client_id (required), start_date (optional), end_date (optional)
    """
    from decimal import Decimal
    from django.db.models import Q
    
    client_id = request.query_params.get('client_id')
    start_date = request.query_params.get('start_date')
    end_date = request.query_params.get('end_date')
    
    if not client_id:
        return Response({"error": "client_id is required"}, status=400)
    
    try:
        client = Client.objects.get(id=client_id)
    except Client.DoesNotExist:
        return Response({"error": "Client not found"}, status=404)
    
    # Get all transactions for this client
    transactions = Transaction.objects.filter(client=client).order_by('date', 'id')
    
    # Apply date filters if provided
    if start_date:
        transactions = transactions.filter(date__gte=start_date)
    if end_date:
        transactions = transactions.filter(date__lte=end_date)
    
    # Calculate running balance
    ledger_entries = []
    running_balance = Decimal('0.000')
    
    for txn in transactions:
        # Debit increases balance (client owes us)
        # Credit decreases balance (we owe client or client paid)
        if txn.trans_type in ['CR', 'BR', 'INVOICE']:
            # Receipts and invoices are debits (client owes us)
            debit = txn.amount
            credit = Decimal('0.000')
            running_balance += txn.amount
        else:
            # Payments are credits (we paid or client has credit)
            debit = Decimal('0.000')
            credit = txn.amount
            running_balance -= txn.amount
        
        # Determine Dr/Cr suffix
        balance_type = "Dr" if running_balance >= 0 else "Cr"
        
        ledger_entries.append({
            'id': txn.id,
            'date': txn.date,
            'voucher_no': txn.voucher_no,
            'particulars': f"Job #{txn.job.id} - {txn.description}" if txn.job else txn.description,
            'debit': str(debit),
            'credit': str(credit),
            'running_balance': str(abs(running_balance)),
            'balance_type': balance_type
        })
    
    return Response({
        'client': {
            'id': client.id,
            'name': client.name,
            'address': client.address,
            'vat_number': client.vat_number
        },
        'entries': ledger_entries,
        'final_balance': str(abs(running_balance)),
        'final_balance_type': "Dr" if running_balance >= 0 else "Cr"
    })

# Health check endpoint (no authentication required)
@api_view(['GET'])
@permission_classes([permissions.AllowAny])
def health_check(request):
    """
    Health check endpoint for deployment verification
    """
    return Response({
        "status": "healthy",
        "message": "Logistics System API is running",
        "version": "1.0.0"
    }, status=200)
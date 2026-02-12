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
    queryset = Transaction.objects.all().order_by('-date', '-id')
    serializer_class = TransactionSerializer
    permission_classes = [permissions.IsAuthenticated]

    def perform_create(self, serializer):
        job = serializer.validated_data.get("job")
        client = serializer.validated_data.get("client")

        # 🔥 AUTO-LINK CLIENT FROM JOB
        if job and not client:
            client = job.client

        instance = serializer.save(
            job=job,
            client=client
        )

        AuditLog.objects.create(
            user_name=self.request.user.username if self.request.user else "Unknown",
            action=f"Recorded {instance.trans_type} of {instance.amount} OMR"
        )

    def perform_destroy(self, instance):
        AuditLog.objects.create(
            user_name=self.request.user.username if self.request.user else "Unknown",
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
    from decimal import Decimal
    from django.db.models import Q, Sum
    from datetime import datetime

    client_id = request.query_params.get("client_id")
    start_date_str = request.query_params.get("start_date")
    end_date_str = request.query_params.get("end_date")

    # Parse dates - support both YYYY-MM-DD (ISO/HTML) and DD/MM/YYYY formats
    start_date = None
    end_date = None
    
    if start_date_str:
        try:
            # Try ISO format first (YYYY-MM-DD) - from HTML date inputs
            start_date = datetime.strptime(start_date_str, "%Y-%m-%d").date()
        except ValueError:
            try:
                # Fallback to DD/MM/YYYY format
                start_date = datetime.strptime(start_date_str, "%d/%m/%Y").date()
            except ValueError:
                return Response({"error": f"Invalid start_date format: {start_date_str}. Use YYYY-MM-DD or DD/MM/YYYY"}, status=400)
    
    if end_date_str:
        try:
            # Try ISO format first (YYYY-MM-DD)
            end_date = datetime.strptime(end_date_str, "%Y-%m-%d").date()
        except ValueError:
            try:
                # Fallback to DD/MM/YYYY format
                end_date = datetime.strptime(end_date_str, "%d/%m/%Y").date()
            except ValueError:
                return Response({"error": f"Invalid end_date format: {end_date_str}. Use YYYY-MM-DD or DD/MM/YYYY"}, status=400)

    # Validate client
    if not client_id:
        return Response({"error": "client_id is required"}, status=400)
    
    try:
        client = Client.objects.get(id=client_id)
    except Client.DoesNotExist:
        return Response({"error": "Client not found"}, status=404)

    # Get transactions for this client
    transactions = Transaction.objects.filter(
        Q(client=client) | Q(job__client=client)
    )

    # Date filters
    if start_date:
        transactions = transactions.filter(date__gte=start_date)
    if end_date:
        transactions = transactions.filter(date__lte=end_date)

    transactions = transactions.order_by("date", "id")

    # Get jobs with invoices for this client
    jobs_query = Job.objects.filter(client=client, is_invoiced=True)
    if start_date:
        jobs_query = jobs_query.filter(job_date__gte=start_date)
    if end_date:
        jobs_query = jobs_query.filter(job_date__lte=end_date)
    
    jobs_with_invoices = jobs_query.prefetch_related('invoice_items')

    # Build combined ledger entries
    running_balance = Decimal("0.000")
    ledger_entries = []
    invoice_total_amount = Decimal("0.000")
    invoice_total_vat = Decimal("0.000")
    invoice_total_invoice = Decimal("0.000")

    # Add regular transactions
    for txn in transactions:
        if txn.trans_type == "INVOICE":
            # Invoice raised → client owes us → Debit
            debit = txn.amount
            credit = Decimal("0.000")
            running_balance += txn.amount
        elif txn.trans_type in ["CR", "BR"]:
            # Cash/Bank Receive → client paid us → Credit
            debit = Decimal("0.000")
            credit = txn.amount
            running_balance -= txn.amount
        elif txn.trans_type in ["CP", "BP"]:
            # Cash/Bank Payment → money paid out → Debit
            debit = txn.amount
            credit = Decimal("0.000")
            running_balance += txn.amount
        else:
            debit = Decimal("0.000")
            credit = txn.amount
            running_balance -= txn.amount

        ledger_entries.append({
            "id": f"txn_{txn.id}",
            "date": txn.date,
            "voucher_no": txn.voucher_no,
            "particulars": f"Job #{txn.job.id} - {txn.description}" if txn.job else txn.description,
            "debit": str(debit),
            "credit": str(credit),
            "running_balance": str(abs(running_balance)),
            "balance_type": "Dr" if running_balance >= 0 else "Cr",
        })

    # Add invoice entries as debits
    for job in jobs_with_invoices:
        invoice_items = job.invoice_items.all()
        
        if invoice_items.exists():
            # Calculate totals for this job
            totals = invoice_items.aggregate(
                total_amount=Sum('amount'),
                total_vat=Sum('vat'),
                total_invoice=Sum('total')
            )
            
            job_amount = totals['total_amount'] or Decimal("0.000")
            job_vat = totals['total_vat'] or Decimal("0.000")
            job_total = totals['total_invoice'] or Decimal("0.000")
            
            # Add to grand totals
            invoice_total_amount += job_amount
            invoice_total_vat += job_vat
            invoice_total_invoice += job_total
            
            # Add invoice as debit entry
            running_balance += job_total
            
            ledger_entries.append({
                "id": f"invoice_{job.id}",
                "date": job.job_date,
                "voucher_no": job.invoice_no or f"INV-{job.id}",
                "particulars": f"Invoice for Job #{job.id}",
                "debit": str(job_total),
                "credit": "0.000",
                "running_balance": str(abs(running_balance)),
                "balance_type": "Dr" if running_balance >= 0 else "Cr",
            })

    # Sort all entries by date
    ledger_entries.sort(key=lambda x: x["date"])

    # Recalculate running balance in proper order
    running_balance = Decimal("0.000")
    for entry in ledger_entries:
        debit = Decimal(entry["debit"])
        credit = Decimal(entry["credit"])
        running_balance += debit - credit
        entry["running_balance"] = str(abs(running_balance))
        entry["balance_type"] = "Dr" if running_balance >= 0 else "Cr"

    # Calculate totals
    total_debit = sum(Decimal(e["debit"]) for e in ledger_entries)
    total_credit = sum(Decimal(e["credit"]) for e in ledger_entries)

    return Response({
        "client": ClientSerializer(client).data,
        "entries": ledger_entries,
        "total_debit": str(total_debit),
        "total_credit": str(total_credit),
        "net_balance": str(total_debit - total_credit),
        "invoice_totals": {
            "total_amount": str(invoice_total_amount),
            "total_vat": str(invoice_total_vat),
            "total_invoice": str(invoice_total_invoice),
        },
        "final_balance": str(abs(running_balance)),
        "final_balance_type": "Dr" if running_balance >= 0 else "Cr",
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
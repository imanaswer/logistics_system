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

# ─────────────────────────────────────────────────────────────────────────────
# INVOICE TRANSACTION SYNC
# Called directly from InvoiceItemViewSet so an INVOICE debit is
# created/updated the moment the frontend saves line items.
# This bypasses the broken signal chain entirely.
# ─────────────────────────────────────────────────────────────────────────────

def _sync_invoice_transaction(job):
    from django.utils import timezone

    total_amount = job.get_total_amount()

    if total_amount <= 0:
        # All items removed — wipe the debit from the ledger
        Transaction.objects.filter(job=job, trans_type="INVOICE").delete()
        return

    transaction, created = Transaction.objects.get_or_create(
        job=job,
        trans_type="INVOICE",
        defaults={
            "amount": total_amount,
            "description": f"Job #{job.id} - Invoiced Charges",
            "date": timezone.now().date(),
            "client": job.client,
            "party_name": job.client.name if job.client else "",
        },
    )

    if not created:
        transaction.amount = total_amount
        transaction.client = job.client
        transaction.party_name = job.client.name if job.client else ""
        transaction.save()


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

    def perform_create(self, serializer):
        instance = serializer.save()
        _sync_invoice_transaction(instance.job)   # ✅ new item → create/update debit

    def perform_update(self, serializer):
        instance = serializer.save()
        _sync_invoice_transaction(instance.job)   # ✅ edited item → update debit amount

    def perform_destroy(self, instance):
        job = instance.job
        instance.delete()
        _sync_invoice_transaction(job)            # ✅ deleted item → recalculate debit



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
    from django.db.models import Q
    from datetime import datetime

    client_id = request.query_params.get("client_id")
    start_date = request.query_params.get("start_date")
    end_date = request.query_params.get("end_date")

    if not client_id:
        return Response({"error": "client_id is required"}, status=400)

    try:
        client = Client.objects.get(id=client_id)
    except Client.DoesNotExist:
        return Response({"error": "Client not found"}, status=404)

    transactions = Transaction.objects.filter(
        Q(client=client) | Q(job__client=client)
    ).order_by("date", "id")

    if start_date:
        transactions = transactions.filter(date__gte=start_date)

    if end_date:
        transactions = transactions.filter(date__lte=end_date)

    running_balance = Decimal("0.000")
    ledger_entries = []

    for txn in transactions:
        debit = Decimal("0.000")
        credit = Decimal("0.000")

        if txn.trans_type == "INVOICE":
            debit = txn.amount
            running_balance += txn.amount

        elif txn.trans_type in ["CR", "BR"]:
            credit = txn.amount
            running_balance -= txn.amount

        elif txn.trans_type in ["CP", "BP"]:
            debit = txn.amount
            running_balance += txn.amount

        ledger_entries.append({
            "id": txn.id,
            "date": txn.date.isoformat() if txn.date else None,  # ✅ YYYY-MM-DD — JS new Date() safe
            "voucher_no": txn.voucher_no,
            "particulars": txn.description,
            "debit": str(debit),
            "credit": str(credit),
            "running_balance": str(abs(running_balance)),
            "balance_type": "Dr" if running_balance >= 0 else "Cr",
        })

    total_debit = sum(Decimal(e["debit"]) for e in ledger_entries)
    total_credit = sum(Decimal(e["credit"]) for e in ledger_entries)

    return Response({
        "client": ClientSerializer(client).data,
        "entries": ledger_entries,
        "total_debit": str(total_debit),
        "total_credit": str(total_credit),
        "net_balance": str(total_debit - total_credit),
        "final_balance": str(abs(running_balance)),
        "final_balance_type": "Dr" if running_balance >= 0 else "Cr",
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

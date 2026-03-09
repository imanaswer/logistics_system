from django.db.models.signals import post_save, post_delete
from django.dispatch import receiver
from django.utils import timezone
from .models import Job, Transaction, InvoiceItem

# ─────────────────────────────────────────────────────────────────────────────
# WHY THE ORIGINAL SIGNALS WERE BROKEN
#
# BUG 1: @receiver(post_save, sender=Invoice)
#   Invoice rows are NEVER created in this project (api_invoice = 0 rows).
#   The UI builds invoices from Job + InvoiceItems directly, so this signal
#   never fired → no ledger transaction was ever auto-created.
#
# BUG 2: update_invoice_transaction_on_item_change used:
#       invoice = getattr(job, "invoice", None)
#       if not invoice: return      ← always None → always returned early
#
# FIX: Hook into Job.is_invoiced (what the UI actually sets) and replace the
#      broken invoice-existence guard with job.is_invoiced.
# ─────────────────────────────────────────────────────────────────────────────


@receiver(post_save, sender=Job)
def create_invoice_transaction_on_job_invoiced(sender, instance, **kwargs):
    """
    When a Job is marked is_invoiced=True, create (or update) an INVOICE
    transaction so the debit appears in the ledger automatically.

    Replaces the broken @receiver(post_save, sender=Invoice) which never fired
    because Invoice objects are never saved in this project.
    """
    if not instance.is_invoiced:
        return  # Job not invoiced yet — nothing to do

    total_amount = instance.get_total_amount()
    if total_amount <= 0:
        return  # No line items — skip

    transaction, tx_created = Transaction.objects.get_or_create(
        job=instance,
        trans_type="INVOICE",
        defaults={
            "amount": total_amount,
            "description": f"Job #{instance.id} - Invoiced Charges",
            "date": timezone.now().date(),
            "client": instance.client,
            "party_name": instance.client.name if instance.client else "",
        },
    )

    if not tx_created:
        # Already invoiced before — keep in sync
        transaction.amount = total_amount
        transaction.client = instance.client
        transaction.party_name = instance.client.name if instance.client else ""
        transaction.save()


@receiver([post_save, post_delete], sender=InvoiceItem)
def update_invoice_transaction_on_item_change(sender, instance, **kwargs):
    """
    When InvoiceItems are added / edited / deleted on an already-invoiced job,
    keep the INVOICE transaction amount in sync.

    BUG FIX: was getattr(job, 'invoice', None) — always None since Invoice
    table is empty — causing an early return every single time.
    """
    job = instance.job

    # ✅ FIX: check the flag the UI actually sets, not the empty Invoice table
    if not job.is_invoiced:
        return

    total_amount = job.get_total_amount()

    transaction = Transaction.objects.filter(
        job=job,
        trans_type="INVOICE",
    ).first()

    if transaction:
        transaction.amount = total_amount
        transaction.save()
    elif total_amount > 0:
        # Transaction went missing — recreate it
        Transaction.objects.create(
            job=job,
            trans_type="INVOICE",
            amount=total_amount,
            description=f"Job #{job.id} - Invoiced Charges",
            date=timezone.now().date(),
            client=job.client,
            party_name=job.client.name if job.client else "",
        )

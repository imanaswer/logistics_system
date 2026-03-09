from django.db.models.signals import post_save, post_delete
from django.dispatch import receiver
from django.utils import timezone
from .models import Job, Transaction, InvoiceItem

# ❌ REMOVED: Invoice post_save signal — Invoice rows are never created in this
# project (api_invoice table = 0 rows), so that signal never fired.
# ✅ FIX: Hook into Job.is_invoiced instead. The UI sets this flag when
# generating an invoice from Job + InvoiceItems, so this always fires correctly.


@receiver(post_save, sender=Job)
def create_invoice_transaction_on_job_invoiced(sender, instance, **kwargs):
    """
    When a Job is marked is_invoiced=True, create (or update) an INVOICE
    transaction in the ledger.

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
        # Job was already invoiced — keep amount in sync
        transaction.amount = total_amount
        transaction.client = instance.client
        transaction.party_name = instance.client.name if instance.client else ""
        transaction.save()


@receiver([post_save, post_delete], sender=InvoiceItem)
def update_invoice_transaction_on_item_change(sender, instance, **kwargs):
    """
    When InvoiceItems are added / edited / deleted, keep the INVOICE transaction
    amount in sync — but only if the job has already been invoiced.

    Previously this checked `getattr(job, 'invoice', None)` which was always
    None (Invoice table is empty), causing an early return every single time.
    ✅ FIX: Check job.is_invoiced instead.
    """
    job = instance.job

    # ❌ OLD (broken): if not getattr(job, "invoice", None): return
    # ✅ NEW: check the flag that the UI actually sets
    if not job.is_invoiced:
        return  # Invoice not generated yet — nothing to update

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

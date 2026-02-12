from django.db.models.signals import post_save
from django.dispatch import receiver
from .models import Job, Transaction

@receiver(post_save, sender=Job)
def create_invoice_transaction(sender, instance, created, **kwargs):
    """
    Automatically creates a Debit Transaction when a Job is marked as Invoiced.
    This ensures the amount shows up in the Client Ledger.
    """
    # Trigger only if 'is_invoiced' is checked
    if instance.is_invoiced:
        # Check if a transaction for this job already exists to avoid duplicates
        if not Transaction.objects.filter(job=instance, trans_type='INVOICE').exists():
            Transaction.objects.create(
                job=instance,
                client=instance.client,
                amount=instance.total_amount or 0,
                trans_type='INVOICE',
                date=instance.created_at.date() if instance.created_at else None,
                description=f"Automated Ledger Entry for Job #{instance.id}",
                party_name=instance.client.name if instance.client else "Unknown Client",
                voucher_no=f"INV-{instance.id}"
            )
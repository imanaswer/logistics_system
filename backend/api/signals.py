from django.db.models.signals import post_save, post_delete
from django.dispatch import receiver
from .models import Invoice, Transaction, InvoiceItem


@receiver(post_save, sender=Invoice)
def create_or_update_invoice_transaction(sender, instance, created, **kwargs):
    """
    Create or update INVOICE transaction whenever an Invoice is created.
    """

    job = instance.job
    total_amount = job.get_total_amount()

    if total_amount <= 0:
        return

    transaction, tx_created = Transaction.objects.get_or_create(
        job=job,
        trans_type="INVOICE",
        defaults={
            "amount": total_amount,
            "description": f"Job #{job.id} - Invoiced Charges",
            "date": instance.date,
            "client": job.client,
            "party_name": job.client.name if job.client else ""
        }
    )

    if not tx_created:
        transaction.amount = total_amount
        transaction.date = instance.date
        transaction.client = job.client
        transaction.party_name = job.client.name if job.client else ""
        transaction.save()


@receiver([post_save, post_delete], sender=InvoiceItem)
def update_invoice_transaction_on_item_change(sender, instance, **kwargs):
    """
    Update transaction if invoice items change.
    """

    job = instance.job

    invoice = getattr(job, "invoice", None)
    if not invoice:
        return

    total_amount = job.get_total_amount()

    transaction = Transaction.objects.filter(
        job=job,
        trans_type="INVOICE"
    ).first()

    if transaction:
        transaction.amount = total_amount
        transaction.save()

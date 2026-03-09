from django.db.models.signals import post_save, post_delete
from django.dispatch import receiver
from .models import InvoiceItem, Transaction


def update_invoice_transaction(job):
    """
    Ensures a single INVOICE transaction exists per job
    and keeps it synced with invoice item totals.
    """

    total_amount = job.get_total_amount()

    # If no charges exist → delete transaction
    if total_amount <= 0:
        Transaction.objects.filter(
            job=job,
            trans_type="INVOICE"
        ).delete()
        return

    transaction, created = Transaction.objects.get_or_create(
        job=job,
        trans_type="INVOICE",
        defaults={
            "amount": total_amount,
            "description": f"Job #{job.id} - Invoiced Charges",
            "date": job.job_date,
            "client": job.client,
            "party_name": job.client.name if job.client else ""
        }
    )

    if not created:
        transaction.amount = total_amount
        transaction.client = job.client
        transaction.party_name = job.client.name if job.client else ""
        transaction.save()


@receiver(post_save, sender=InvoiceItem)
def invoice_item_saved(sender, instance, **kwargs):
    update_invoice_transaction(instance.job)


@receiver(post_delete, sender=InvoiceItem)
def invoice_item_deleted(sender, instance, **kwargs):
    update_invoice_transaction(instance.job)

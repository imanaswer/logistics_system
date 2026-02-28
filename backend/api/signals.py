from django.db.models.signals import post_save, post_delete
from django.dispatch import receiver
from .models import Job, Transaction, InvoiceItem


@receiver(post_save, sender=Job)
def create_or_update_invoice_shadow(sender, instance, **kwargs):

    if not instance.is_invoiced:
        Transaction.objects.filter(
            job=instance,
            trans_type="INVOICE"
        ).delete()
        return

    total_amount = instance.get_total_amount()

    if total_amount <= 0:
        return

    shadow, created = Transaction.objects.get_or_create(
        job=instance,
        trans_type="INVOICE",
        defaults={
            "amount": total_amount,
            "description": f"Invoice for Job #{instance.id}",
            "date": instance.job_date,
            "client": instance.client,
            "party_name": instance.client.name if instance.client else ""
        }
    )

    if not created:
        shadow.amount = total_amount
        shadow.date = instance.job_date
        shadow.client = instance.client
        shadow.party_name = instance.client.name if instance.client else ""
        shadow.save()


@receiver([post_save, post_delete], sender=InvoiceItem)
def update_invoice_shadow_on_item_change(sender, instance, **kwargs):

    job = instance.job

    if not job.is_invoiced:
        return

    total_amount = job.get_total_amount()

    shadow = Transaction.objects.filter(
        job=job,
        trans_type="INVOICE"
    ).first()

    if shadow:
        shadow.amount = total_amount
        shadow.save()

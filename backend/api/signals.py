from django.db.models.signals import post_save
from django.dispatch import receiver
from .models import Job, Transaction
from django.utils import timezone
import logging

logger = logging.getLogger(__name__)

@receiver(post_save, sender=Job)
def create_invoice_shadow_entry(sender, instance, created, **kwargs):
    """
    Automatically create a shadow debit entry in the ledger when a job is marked as invoiced.
    This helps in reconciliation by showing the invoice amount as a debit to the client.
    """
    # Only create shadow entry if job is marked as invoiced and wasn't previously invoiced
    if instance.is_invoiced:
        # Check if shadow entry already exists for this job
        existing_shadow = Transaction.objects.filter(
            job=instance,
            trans_type='INVOICE'
        ).first()
        
        if existing_shadow:
            logger.info(f"Shadow entry already exists for Job #{instance.id}")
            return
        
        # Calculate total amount from invoice items
        total_amount = instance.get_total_amount()
        
        if total_amount <= 0:
            logger.warning(f"Job #{instance.id} has no invoice items or zero total. Skipping shadow entry.")
            return
        
        # Create the shadow debit entry
        shadow_entry = Transaction.objects.create(
            trans_type='INVOICE',
            amount=total_amount,
            description=f"Job #{instance.id} - Invoiced Charges",
            date=timezone.now().date(),
            job=instance,
            client=instance.client,
            party_name=instance.client.name if instance.client else "Unknown Client"
        )
        
        logger.info(f"✅ Created shadow entry {shadow_entry.voucher_no} for Job #{instance.id} - Amount: {total_amount}")

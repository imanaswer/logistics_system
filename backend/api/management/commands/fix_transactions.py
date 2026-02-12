"""
Management command to fix transactions with missing client or party_name
"""
from django.core.management.base import BaseCommand
from api.models import Transaction


class Command(BaseCommand):
    help = 'Fixes transactions with missing client or party_name by auto-populating from job'

    def handle(self, *args, **options):
        self.stdout.write("🔧 Starting transaction repair...")
        
        # Find transactions with job but no client
        orphaned_txns = Transaction.objects.filter(job__isnull=False, client__isnull=True)
        orphaned_count = orphaned_txns.count()
        
        self.stdout.write(f"📊 Found {orphaned_count} transactions with job but no client")
        
        fixed_client = 0
        for txn in orphaned_txns:
            if txn.job and txn.job.client:
                txn.client = txn.job.client
                txn.save()
                fixed_client += 1
                self.stdout.write(f"  ✅ Transaction #{txn.id}: Set client to {txn.client.name}")
        
        # Find transactions with client but no party_name
        no_party_name = Transaction.objects.filter(
            client__isnull=False
        ).exclude(party_name__isnull=False).exclude(party_name='')
        
        no_party_count = no_party_name.count()
        self.stdout.write(f"\n📊 Found {no_party_count} transactions with client but no party_name")
        
        fixed_party = 0
        for txn in no_party_name:
            if txn.client:
                txn.party_name = txn.client.name
                txn.save()
                fixed_party += 1
                self.stdout.write(f"  ✅ Transaction #{txn.id}: Set party_name to {txn.party_name}")
        
        self.stdout.write(self.style.SUCCESS(f"\n✅ Repair complete!"))
        self.stdout.write(self.style.SUCCESS(f"   - Fixed {fixed_client} transactions with missing client"))
        self.stdout.write(self.style.SUCCESS(f"   - Fixed {fixed_party} transactions with missing party_name"))
        
        # Show summary of all transactions
        total_txns = Transaction.objects.count()
        txns_with_client = Transaction.objects.filter(client__isnull=False).count()
        txns_with_party = Transaction.objects.exclude(party_name__isnull=True).exclude(party_name='').count()
        
        self.stdout.write(f"\n📊 Final Status:")
        self.stdout.write(f"   - Total transactions: {total_txns}")
        self.stdout.write(f"   - Transactions with client: {txns_with_client}")
        self.stdout.write(f"   - Transactions with party_name: {txns_with_party}")

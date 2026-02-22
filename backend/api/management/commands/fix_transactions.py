"""
Management command to fix existing transactions that are missing client or party_name
"""
from django.core.management.base import BaseCommand
from api.models import Transaction


class Command(BaseCommand):
    help = 'Fix existing transactions by populating missing client and party_name fields'

    def handle(self, *args, **options):
        self.stdout.write('Starting transaction fix...')
        
        # Find transactions with job but no client
        orphaned = Transaction.objects.filter(job__isnull=False, client__isnull=True)
        orphaned_count = orphaned.count()
        
        if orphaned_count > 0:
            self.stdout.write(f'Found {orphaned_count} transactions with job but no client')
            for transaction in orphaned:
                if transaction.job and transaction.job.client:
                    transaction.client = transaction.job.client
                    if not transaction.party_name:
                        transaction.party_name = transaction.job.client.name
                    transaction.save()
                    self.stdout.write(
                        self.style.SUCCESS(
                            f'✓ Fixed transaction #{transaction.id}: '
                            f'linked to {transaction.client.name}'
                        )
                    )
        else:
            self.stdout.write(self.style.SUCCESS('No orphaned transactions found'))
        
        # Find transactions with client but no party_name
        no_party_name = Transaction.objects.filter(
            client__isnull=False, 
            party_name__in=['', None]
        )
        no_party_count = no_party_name.count()
        
        if no_party_count > 0:
            self.stdout.write(f'Found {no_party_count} transactions with no party_name')
            for transaction in no_party_name:
                transaction.party_name = transaction.client.name
                transaction.save()
                self.stdout.write(
                    self.style.SUCCESS(
                        f'✓ Fixed transaction #{transaction.id}: '
                        f'set party_name to {transaction.party_name}'
                    )
                )
        else:
            self.stdout.write(self.style.SUCCESS('No transactions missing party_name'))
        
        # Summary
        total_fixed = orphaned_count + no_party_count
        if total_fixed > 0:
            self.stdout.write(
                self.style.SUCCESS(
                    f'\n✅ Successfully fixed {total_fixed} transactions!'
                )
            )
        else:
            self.stdout.write(
                self.style.SUCCESS(
                    '\n✅ All transactions are already correct!'
                )
            )

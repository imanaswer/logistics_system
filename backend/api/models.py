from django.db import models
from django.utils import timezone

# 1. The Client
class Client(models.Model):
    name = models.CharField(max_length=200)
    address = models.TextField()
    postal_code = models.CharField(max_length=20, blank=True)
    phone = models.CharField(max_length=50, blank=True)
    email = models.EmailField(max_length=254, blank=True, null=True)
    vat_number = models.CharField(max_length=50, blank=True, null=True)

    def __str__(self):
        return self.name

# 2. The Job (Includes new Transport Document Number AND VAT)
class Job(models.Model):
    ROUTE_TYPES = [
        ('SEA', 'Sea'),
        ('AIR', 'Air'),
        ('LAND', 'Land'),
    ]

    id = models.AutoField(primary_key=True) 
    job_date = models.DateField(default=timezone.now, help_text="Date of Job Creation")
    client = models.ForeignKey(Client, on_delete=models.CASCADE, related_name='jobs')
    
    shipment_invoice_no = models.CharField(max_length=1000, blank=True, null=True) 
    invoice_no = models.CharField(max_length=10000, blank=True, null=True)
    
    # --- NEW FIELD: For AWB, BL, or CMR Number ---
    transport_document_no = models.CharField(max_length=1000, blank=True, help_text="AWB, BL, or Consignment Note Number")

    # --- ADDED THIS MISSING FIELD ---
    vat_number = models.CharField(max_length=50, blank=True, null=True) 

    transport_mode = models.CharField(max_length=100, choices=ROUTE_TYPES, default='SEA')
    shipment_address = models.TextField(blank=True, null=True)
    port_loading = models.CharField(max_length=100)
    place_loading = models.CharField(max_length=100, blank=True)
    port_discharge = models.CharField(max_length=100)
    place_discharge = models.CharField(max_length=100, blank=True)

    no_of_packages = models.IntegerField(default=0)
    gross_weight = models.DecimalField(max_digits=12, decimal_places=5, default=0.000)
    net_weight = models.DecimalField(max_digits=12, decimal_places=5, default=0.000)
    cbm = models.DecimalField(max_digits=12, decimal_places=5, default=0.000, null=True, blank=True) # Added CBM just in case it was missing

    is_finished = models.BooleanField(default=False)
    is_invoiced = models.BooleanField(default=False, help_text="Marks job as invoiced and creates shadow entry")
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"Job #{self.id} - {self.client.name}"
    
    def get_total_amount(self):
        """Calculate total amount from all invoice items for this job"""
        from decimal import Decimal
        total = self.invoice_items.aggregate(
            total=models.Sum('total')
        )['total'] or Decimal('0.000')
        return total

# 3. Containers
class Container(models.Model):
    job = models.ForeignKey(Job, on_delete=models.CASCADE, related_name='containers')
    number = models.CharField(max_length=50) 
    seal = models.CharField(max_length=50)     
    size = models.CharField(max_length=10)     

# 4. Invoices (Old model, keeping for safety)
class Invoice(models.Model):
    job = models.OneToOneField(Job, on_delete=models.CASCADE, related_name='invoice')
    invoice_no = models.CharField(max_length=50)
    date = models.DateField(auto_now_add=True)
    amount_omr = models.DecimalField(max_digits=12, decimal_places=3, default=0.000)
    
    def __str__(self):
        return f"Invoice {self.invoice_no}"

# 5. Party Master (NEW - for dropdown selection)
class Party(models.Model):
    name = models.CharField(max_length=255, unique=True)
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return self.name

    class Meta:
        verbose_name_plural = "Parties"
        ordering = ['name']

class Transaction(models.Model):
    trans_type = models.CharField(max_length=10) # CR, CP, BR, BP, INVOICE
    amount = models.DecimalField(max_digits=10, decimal_places=3)
    description = models.CharField(max_length=255, blank=True)
    date = models.DateField()
    bank_name = models.CharField(max_length=100, blank=True, null=True)
    cheque_no = models.CharField(max_length=100, blank=True, null=True)
    
    # --- NEW: Voucher Number (auto-generated) ---
    voucher_no = models.CharField(max_length=50, blank=True, null=True, db_index=True)
    
    # --- NEW: Party Name (stores client name as string for ledger grouping) ---
    party_name = models.CharField(max_length=255, blank=True, db_index=True)
    
    # --- Job link (optional) ---
    job = models.ForeignKey(Job, on_delete=models.SET_NULL, null=True, blank=True, related_name='transactions')
    
    # --- Client link (replaces Party) ---
    client = models.ForeignKey(Client, on_delete=models.SET_NULL, null=True, blank=True, related_name='transactions')

    def __str__(self):
        client_name = self.client.name if self.client else "No Client"
        return f"{self.trans_type} - {client_name} - {self.amount}"
    
    def generate_voucher_no(self):
        """
        Generate voucher number based on trans_type with auto-increment
        Format: CR-001, CP-001, BR-001, BP-001, INV-001
        """
        prefix_map = {
            'CR': 'CR',
            'CP': 'CP',
            'BR': 'BR',
            'BP': 'BP',
            'INVOICE': 'INV'
        }
        
        prefix = prefix_map.get(self.trans_type, 'TXN')
        
        # Get the last transaction with this type
        last_transaction = Transaction.objects.filter(
            trans_type=self.trans_type,
            voucher_no__startswith=prefix
        ).order_by('-id').first()
        
        if last_transaction and last_transaction.voucher_no:
            # Extract number from last voucher (e.g., "CR-005" -> 5)
            try:
                last_num = int(last_transaction.voucher_no.split('-')[1])
                new_num = last_num + 1
            except (IndexError, ValueError):
                new_num = 1
        else:
            new_num = 1
        
        return f"{prefix}-{new_num:03d}"
    
    def save(self, *args, **kwargs):
        # Auto-generate voucher number if not set
        if not self.voucher_no:
            self.voucher_no = self.generate_voucher_no()
        
        # FIX #2: Auto-populate client from job.client when job is set but client is missing
        # This ensures job-linked transactions always resolve to a client
        if self.job and not self.client:
            self.client = self.job.client
        
        # Auto-populate party_name from client if not set
        if not self.party_name and self.client:
            self.party_name = self.client.name
        
        super().save(*args, **kwargs)
    
    class Meta:
        ordering = ['-date', '-id']
        indexes = [
            models.Index(fields=['client', 'date']),
            models.Index(fields=['party_name', 'date']),
        ]

# 6. Charge Master (Dropdown List)
class ChargeType(models.Model):
    name = models.CharField(max_length=100, unique=True)
    
    def __str__(self):
        return self.name

# 7. Invoice Items (The actual invoice rows - Updated with Larger Numbers)
class InvoiceItem(models.Model):
    job = models.ForeignKey(Job, on_delete=models.CASCADE, related_name='invoice_items')
    charge_type = models.ForeignKey(ChargeType, on_delete=models.PROTECT)
    description = models.CharField(max_length=255, blank=True)
    
    # Updated to max_digits=20 for huge numbers
    amount = models.DecimalField(max_digits=20, decimal_places=3, default=0.000)
    vat = models.DecimalField(max_digits=20, decimal_places=3, default=0.000)
    total = models.DecimalField(max_digits=20, decimal_places=3, default=0.000)

    # models.py inside InvoiceItem class
    def save(self, *args, **kwargs):
        # Use Decimal math to avoid rounding "messes"
        from decimal import Decimal
        self.total = Decimal(str(self.amount)) + Decimal(str(self.vat))
        super().save(*args, **kwargs)

class Quotation(models.Model):
    client = models.ForeignKey(Client, on_delete=models.CASCADE)
    subject = models.CharField(max_length=200)
    date = models.DateField(default=timezone.now)
    valid_until = models.DateField()
    total_amount = models.DecimalField(max_digits=12, decimal_places=3, default=0.000)
    is_accepted = models.BooleanField(default=False)
    
    def __str__(self):
        return f"Quote #{self.id} - {self.client.name}"

# --- NEW 2: AUDIT LOGS (Security) ---
class AuditLog(models.Model):
    user_name = models.CharField(max_length=100) # e.g. "Admin" or "Employee"
    action = models.CharField(max_length=255)    # e.g. "Deleted Job #5"
    timestamp = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"{self.user_name}: {self.action}"

# --- NEW 3: AI RECEIPTS ---
class Receipt(models.Model):
    image = models.ImageField(upload_to='receipts/')
    uploaded_at = models.DateTimeField(auto_now_add=True)
    merchant = models.CharField(max_length=100, blank=True)
    date_extracted = models.DateField(null=True, blank=True)
    total_amount = models.DecimalField(max_digits=10, decimal_places=3, default=0.000)
    
    def __str__(self):
        return f"Receipt #{self.id} - {self.total_amount}"
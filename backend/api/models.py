from django.db import models
from django.utils import timezone

# 1. The Client
class Client(models.Model):
    name = models.CharField(max_length=200)
    address = models.TextField()
    postal_code = models.CharField(max_length=20, blank=True)
    phone = models.CharField(max_length=50, blank=True)
    email = models.EmailField(max_length=254, blank=True, null=True)
    vat_number = models.CharField(max_length=50, blank=True)

    def __str__(self):
        return self.name

# 2. The Job (Includes new Transport Document Number)
class Job(models.Model):
    ROUTE_TYPES = [
        ('SEA', 'Sea'),
        ('AIR', 'Air'),
        ('LAND', 'Land'),
    ]

    id = models.AutoField(primary_key=True) 
    job_date = models.DateField(default=timezone.now, help_text="Date of Job Creation")
    client = models.ForeignKey(Client, on_delete=models.CASCADE, related_name='jobs')
    
    shipment_invoice_no = models.CharField(max_length=100, blank=True)
    
    # --- NEW FIELD: For AWB, BL, or CMR Number ---
    transport_document_no = models.CharField(max_length=100, blank=True, help_text="AWB, BL, or Consignment Note Number")

    transport_mode = models.CharField(max_length=10, choices=ROUTE_TYPES, default='SEA')
    
    port_loading = models.CharField(max_length=100)
    place_loading = models.CharField(max_length=100, blank=True)
    port_discharge = models.CharField(max_length=100)
    place_discharge = models.CharField(max_length=100, blank=True)

    no_of_packages = models.IntegerField(default=0)
    gross_weight = models.DecimalField(max_digits=12, decimal_places=3, default=0.000)
    net_weight = models.DecimalField(max_digits=12, decimal_places=3, default=0.000)

    is_finished = models.BooleanField(default=False)
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"Job #{self.id} - {self.client.name}"

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

class Transaction(models.Model):
    trans_type = models.CharField(max_length=10) # CR, CP, BR, BP
    party_name = models.CharField(max_length=200, blank=True) # Added based on your code
    amount = models.DecimalField(max_digits=10, decimal_places=3)
    description = models.CharField(max_length=255, blank=True)
    date = models.DateField()
    bank_name = models.CharField(max_length=100, blank=True, null=True)
    cheque_no = models.CharField(max_length=100, blank=True, null=True)
    
    # --- THIS LINE ALLOWS THE DEDUCTION LINK ---
    job = models.ForeignKey(Job, on_delete=models.SET_NULL, null=True, blank=True, related_name='transactions')

    def __str__(self):
        return f"{self.trans_type} - {self.amount}"

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

    def save(self, *args, **kwargs):
        self.total = float(self.amount) + float(self.vat)
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



import os
import django

# Setup Django Environment
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'core.settings') # Change 'core' to your project folder name if different
django.setup()

from api.models import ChargeType

# The List of Charges to Add
charges = [
    "Sea Freight Charges",
    "Air Freight Charges",
    "Land Transportation",
    "Customs Clearance",
    "Port Handling Charges",
    "Documentation Fee",
    "Delivery Order (DO) Charges",
    "Terminal Handling Charges (THC)",
    "Inspection Charges",
    "Customs Duty",
    "Insurance",
    "Bayan Charges",
    "Miscellaneous"
]

print("--- Adding Charge Types ---")
for name in charges:
    obj, created = ChargeType.objects.get_or_create(name=name)
    if created:
        print(f"[+] Added: {name}")
    else:
        print(f"[.] Exists: {name}")

print("--- Done! ---")
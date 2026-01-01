from rest_framework import serializers

from .models import Job, Client  # Ensure Client is imported

from .models import (
    Client, Job, Invoice, Transaction, ChargeType, InvoiceItem, 
    Quotation, AuditLog, Receipt  # <--- Ensure these models are imported
)

class ClientSerializer(serializers.ModelSerializer):
    class Meta:
        model = Client
        fields = '__all__'

class JobSerializer(serializers.ModelSerializer):
    client_details = ClientSerializer(source='client', read_only=True)
    class Meta:
        model = Job
        fields = '__all__'

class InvoiceSerializer(serializers.ModelSerializer):
    class Meta:
        model = Invoice
        fields = '__all__'

class TransactionSerializer(serializers.ModelSerializer):
    class Meta:
        model = Transaction
        fields = '__all__'

class ChargeTypeSerializer(serializers.ModelSerializer):
    class Meta:
        model = ChargeType
        fields = '__all__'

class InvoiceItemSerializer(serializers.ModelSerializer):
    charge_type_name = serializers.ReadOnlyField(source='charge_type.name')
    
    class Meta:
        model = InvoiceItem
        fields = '__all__'

# --- NEW SERIALIZERS (These were missing) ---

class QuotationSerializer(serializers.ModelSerializer):
    client_name = serializers.ReadOnlyField(source='client.name')
    class Meta:
        model = Quotation
        fields = '__all__'

class AuditLogSerializer(serializers.ModelSerializer):
    class Meta:
        model = AuditLog
        fields = '__all__'

class ReceiptSerializer(serializers.ModelSerializer):
    class Meta:
        model = Receipt
        fields = '__all__'

class TransactionSerializer(serializers.ModelSerializer):
    class Meta:
        model = Transaction
        fields = '__all__'  # This ensures 'job', 'party_name', etc. are ALL accepted


class ClientSerializer(serializers.ModelSerializer):
    class Meta:
        model = Client
        fields = '__all__'

class JobSerializer(serializers.ModelSerializer):
    # This tells Django: "Expect a full object, not just an ID"
    client = ClientSerializer() 

    class Meta:
        model = Job
        fields = '__all__'

    def create(self, validated_data):
        # 1. Extract the client data from the incoming payload
        client_data = validated_data.pop('client')

        # 2. Logic: Create the Client first (or get existing one)
        # This prevents duplicates if the client already exists
        client_obj, created = Client.objects.get_or_create(
            name=client_data['name'],
            defaults=client_data  # If creating new, use all fields (phone, email, etc.)
        )

        # 3. Create the Job linked to this Client
        job = Job.objects.create(client=client_obj, **validated_data)
        return job
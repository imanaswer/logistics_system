from rest_framework import serializers
from .models import (
    Client, Job, Transaction, ChargeType, InvoiceItem, 
    Quotation, AuditLog, Receipt, Container
)

# 1. Client Serializer
class ClientSerializer(serializers.ModelSerializer):
    class Meta:
        model = Client
        fields = '__all__'

# 2. Job Serializer (Includes Fix for 500 Error & VAT Saving)
class JobSerializer(serializers.ModelSerializer):
    # 'client_details' is for reading (GET), 'client' is for writing (POST/PUT)
    client_details = ClientSerializer(source='client', read_only=True)
    client = ClientSerializer(required=False) 

    class Meta:
        model = Job
        fields = '__all__'

    # PRESERVED: Your existing creation logic
    def create(self, validated_data):
        client_data = validated_data.pop('client', None)
        
        # Logic: Create Client first or get existing one to prevent duplicates
        if client_data:
            client_obj, created = Client.objects.get_or_create(
                name=client_data.get('name'),
                defaults=client_data
            )
            return Job.objects.create(client=client_obj, **validated_data)
        
        return super().create(validated_data)

    # NEW: The fix for the 500 Error during Editing
    def update(self, instance, validated_data):
        print("---------------- DEBUG START ----------------")
        print("1. DATA RECEIVED FROM FRONTEND:", validated_data)
        
        # Extract client data
        client_data = validated_data.pop('client', None)

        # Update Job Fields
        for attr, value in validated_data.items():
            setattr(instance, attr, value)
        
        # DEBUG: Check if VAT is actually being set on the object
        print(f"2. SETTING VAT TO: {getattr(instance, 'vat_number', 'FIELD MISSING IN MODEL')}")

        # Update Client Fields
        if client_data:
            client_obj = instance.client
            for key, val in client_data.items():
                setattr(client_obj, key, val)
            client_obj.save()
            print("3. CLIENT DETAILS UPDATED")

        instance.save()
        print("4. JOB SAVED SUCCESSFULLY")
        print("---------------- DEBUG END ----------------")
        return instance

# 3. Invoice Item Serializer
class InvoiceItemSerializer(serializers.ModelSerializer):
    charge_type_name = serializers.ReadOnlyField(source='charge_type.name')
    class Meta:
        model = InvoiceItem
        fields = '__all__'

# 4. Transaction Serializer
class TransactionSerializer(serializers.ModelSerializer):
    class Meta:
        model = Transaction
        fields = '__all__'

# 5. Charge Type Serializer
class ChargeTypeSerializer(serializers.ModelSerializer):
    class Meta:
        model = ChargeType
        fields = '__all__'

# 6. Quotation Serializer
class QuotationSerializer(serializers.ModelSerializer):
    client_name = serializers.ReadOnlyField(source='client.name')
    class Meta:
        model = Quotation
        fields = '__all__'

# 7. Audit Log Serializer
class AuditLogSerializer(serializers.ModelSerializer):
    class Meta:
        model = AuditLog
        fields = '__all__'

# 8. Receipt Serializer
class ReceiptSerializer(serializers.ModelSerializer):
    class Meta:
        model = Receipt
        fields = '__all__'

# 9. Container Serializer
class ContainerSerializer(serializers.ModelSerializer):
    class Meta:
        model = Container
        fields = '__all__'
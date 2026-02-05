from rest_framework import serializers
from .models import (
    Client, Job, Transaction, ChargeType, InvoiceItem, 
    Quotation, AuditLog, Receipt, Container, Party
)

# 1. Client Serializer
class ClientSerializer(serializers.ModelSerializer):
    class Meta:
        model = Client
        fields = '__all__'

# 2. Job Serializer (FIXED: No longer destroys history)
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

    # NEW: The SAFE Update Logic
    def update(self, instance, validated_data):
        print("---------------- DEBUG START ----------------")
        
        # 1. Extract client data (don't save it yet)
        client_data = validated_data.pop('client', None)

        # 2. Update Job Fields (This saves VAT, Dates, Ports to the JOB snapshot)
        for attr, value in validated_data.items():
            setattr(instance, attr, value)
        
        # 3. Handle Client Logic Safely
        if client_data:
            new_name = client_data.get('name')
            old_name = instance.client.name if instance.client else ""

            # SCENARIO A: User changed the Client Name (e.g., "Company A" -> "Company B")
            if new_name and new_name.strip().lower() != old_name.strip().lower():
                print(f"SWITCHING CLIENT: {old_name} -> {new_name}")
                # Find or Create the NEW client. Do not rename the old one!
                client_obj, _ = Client.objects.get_or_create(
                    name=new_name,
                    defaults=client_data
                )
                instance.client = client_obj
            
            # SCENARIO B: Name is the same, but they might have changed address/VAT
            else:
                print("SAME CLIENT DETECTED - SKIPPING MASTER UPDATE TO PROTECT HISTORY")
                # We do NOT call client_obj.save() here. 
                # This prevents Invoice 205 from changing Invoice 204's client details.
                # Note: VAT is already saved to the Job (instance.vat_number) in Step 2.

        instance.save()
        print("4. JOB SAVED SAFELY")
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
    job = serializers.PrimaryKeyRelatedField(
        queryset=Job.objects.all(),
        required=False,
        allow_null=True
    )

    client = serializers.PrimaryKeyRelatedField(
        queryset=Client.objects.all(),
        required=False,
        allow_null=True
    )

    client_name = serializers.ReadOnlyField(source='client.name')

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

# 10. Party Serializer
class PartySerializer(serializers.ModelSerializer):
    class Meta:
        model = Party
        fields = ['id', 'name', 'created_at']
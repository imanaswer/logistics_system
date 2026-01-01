from django.contrib import admin
from .models import Client, Job, Invoice, Transaction, ChargeType, InvoiceItem

# Register your models here so they show up in the Admin Panel
@admin.register(Client)
class ClientAdmin(admin.ModelAdmin):
    list_display = ('id', 'name', 'phone')
    search_fields = ('name',)

@admin.register(Job)
class JobAdmin(admin.ModelAdmin):
    list_display = ('id', 'client', 'job_date', 'transport_mode')

@admin.register(Transaction)
class TransactionAdmin(admin.ModelAdmin):
    list_display = ('id', 'trans_type', 'amount', 'date', 'party_name')

admin.site.register(Invoice)
admin.site.register(ChargeType)
admin.site.register(InvoiceItem)
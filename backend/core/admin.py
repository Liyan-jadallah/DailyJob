from django.contrib import admin
from django.contrib.auth.admin import UserAdmin
from .models import User, PaymentMethod, Ad, Transaction, Notification

# Register custom user model
admin.site.register(User, UserAdmin)

@admin.register(Ad)
class AdAdmin(admin.ModelAdmin):
    list_display = ('title', 'user', 'category', 'status', 'created_at')
    list_filter = ('status', 'category')
    search_fields = ('title', 'description', 'user__email')

@admin.register(Transaction)
class TransactionAdmin(admin.ModelAdmin):
    list_display = ('id', 'user', 'ad', 'amount', 'status', 'submitted_at')
    list_filter = ('status',)
    search_fields = ('user__email', 'ad__title')

@admin.register(PaymentMethod)
class PaymentMethodAdmin(admin.ModelAdmin):
    list_display = ('method_name', 'account_alias', 'is_active')

@admin.register(Notification)
class NotificationAdmin(admin.ModelAdmin):
    list_display = ('user', 'title', 'is_read', 'created_at')
    list_filter = ('is_read',)

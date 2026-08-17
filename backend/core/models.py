import uuid
from django.db import models
from django.contrib.auth.models import AbstractUser
from django.conf import settings
from django.db.models.signals import post_save
from django.dispatch import receiver
from django.core.mail import send_mail

# 1. تعريف نموذج المستخدم أولاً
class User(AbstractUser):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    email = models.EmailField(unique=True)
    phone_number = models.CharField(max_length=15, blank=True, null=True)
    role = models.CharField(max_length=50, choices=(('user', 'User'), ('admin', 'Admin')), default='user')
    
    class Meta:
        db_table = 'users'
   
    def __str__(self):
        return self.username


# 2. تعريف باقي النماذج
class PaymentMethod(models.Model):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    method_name = models.CharField(max_length=100)
    account_alias = models.CharField(max_length=100)
    instructions = models.TextField()
    is_active = models.BooleanField(default=True)

    class Meta:
        db_table = 'payment_methods'

    def __str__(self):
        return self.method_name


class Ad(models.Model):
    STATUS_CHOICES = (
        ('pending', 'Pending'),
        ('approved', 'Approved'),
        ('rejected', 'Rejected'),
    )
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    # استخدام settings.AUTH_USER_MODEL هو الأفضل للمفتاح الأجنبي (ForeignKey)
    user = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name='ads', db_constraint=True)
    title = models.CharField(max_length=255)
    description = models.TextField()
    category = models.CharField(max_length=100)
    governorate = models.CharField(max_length=100)
    price = models.DecimalField(max_digits=10, decimal_places=2, default=0.00)
    contact_phone = models.CharField(max_length=15)
    image = models.ImageField(upload_to='ads/images/', blank=True, null=True)
    status = models.CharField(max_length=50, choices=STATUS_CHOICES, default='pending')
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        db_table = 'ads'

    def __init__(self, *args, **kwargs):
        super().__init__(*args, **kwargs)
        self.__original_status = self.status

    def save(self, *args, **kwargs):
        is_newly_active = (
            self.pk is not None and 
            self.__original_status != 'approved' and 
            self.status == 'approved'
        )
        super().save(*args, **kwargs)
        self.__original_status = self.status

        if is_newly_active:
            try:
                from .tasks import send_global_notification_task
                send_global_notification_task.delay(self.id, self.title, self.user.id)
            except Exception:
                pass

    def __str__(self):
        return self.title


class Transaction(models.Model):
    STATUS_CHOICES = (
        ('pending', 'Pending'),
        ('approved', 'Approved'),
        ('rejected', 'Rejected'),
    )
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    ad = models.ForeignKey(Ad, on_delete=models.CASCADE, related_name='transactions')
    user = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name='transactions')
    payment_method = models.ForeignKey(PaymentMethod, on_delete=models.SET_NULL, null=True)
    amount = models.DecimalField(max_digits=10, decimal_places=2, default=1.00)
    receipt_image = models.ImageField(upload_to='transactions/receipts/')
    status = models.CharField(max_length=50, choices=STATUS_CHOICES, default='pending')
    submitted_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        db_table = 'transactions'

    def __str__(self):
        return f"Transaction {self.id} - Ad: {self.ad.title}"


class Notification(models.Model):
    user = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name='notifications')
    title = models.CharField(max_length=255)
    message = models.TextField()
    is_read = models.BooleanField(default=False)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        db_table = 'notifications'

    def __str__(self):
        return f"{self.user.username} - {self.title}"


# 3. تعريف الـ Signals في النهاية (بعد أن يتعرف جانغو على كل النماذج)
# Old notification signal removed in favor of Celery task in Ad.save()


@receiver(post_save, sender=Transaction)
def notify_admins_of_transaction(sender, instance, created, **kwargs):
    if created:
        # 1. Fetch all admin users
        admin_users = User.objects.filter(role='admin') # Assuming role='admin'

        # 2. Create in-app notifications
        notifications = [
            Notification(
                user=admin,
                title="إيصال دفع جديد",
                message=f"تم استلام إيصال دفع جديد من المستخدم {instance.user.email}. الرابط: {instance.receipt_image.url if instance.receipt_image else 'No image'}"
            ) for admin in admin_users
        ]
        Notification.objects.bulk_create(notifications)

        # 3. Send email alert
        admin_emails = [admin.email for admin in admin_users if admin.email]
        if admin_emails:
            from django.core.mail import EmailMessage
            email = EmailMessage(
                subject="إيصال دفع جديد للمراجعة",
                body=f"تم استلام إيصال دفع جديد من المستخدم: {instance.user.email}.\nتجد الإيصال مرفقاً بهذه الرسالة.",
                from_email=settings.EMAIL_HOST_USER,
                to=admin_emails,
            )
            if instance.receipt_image:
                try:
                    email.attach(instance.receipt_image.name, instance.receipt_image.read(), 'image/jpeg')
                except Exception:
                    pass
            email.send(fail_silently=True)
from celery import shared_task
from .models import User, Notification

@shared_task
def send_global_notification_task(ad_id, ad_title, ad_owner_id):
    """
    Runs asynchronously in the background to send notifications to all users.
    """
    # Fetch all users except the owner
    users = User.objects.exclude(id=ad_owner_id).only('id')
    
    notifications = [
        Notification(
            user_id=user.id,
            title="إعلان جديد!",
            message=f"تم نشر إعلان جديد: {ad_title}",
            ad_id=ad_id
        ) for user in users
    ]
    
    Notification.objects.bulk_create(notifications)
    return f"Sent {len(notifications)} notifications for Ad {ad_id}"

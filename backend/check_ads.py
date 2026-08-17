import os
import django
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'backend.settings')
django.setup()
from core.models import Ad
print('All ads:', list(Ad.objects.all().values('title', 'status')))
print('Approved ads:', list(Ad.objects.filter(status='approved').values('title', 'status')))

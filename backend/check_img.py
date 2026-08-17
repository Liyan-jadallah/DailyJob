import os
import django
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'backend.settings')
django.setup()
from core.models import Ad
ad = Ad.objects.exclude(image='').exclude(image__isnull=True).last()
if ad:
    print(f'Image: {ad.image}')
    print(f'Image URL: {ad.image.url if ad.image else None}')
else:
    print('No ad with image found.')

from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import (
    UserViewSet, 
    PaymentMethodViewSet, 
    AdViewSet, 
    TransactionViewSet,
    VerifyEmailView,            # مسار تفعيل البريد
    PasswordResetRequestView,   # مسار طلب استعادة كلمة المرور
    PasswordResetConfirmView,   # مسار تأكيد كلمة المرور الجديدة
    UserNotificationsView       # <-- تمت الإضافة هنا (استدعاء الإشعارات)
)

router = DefaultRouter()
router.register(r'users', UserViewSet)
router.register(r'payment-methods', PaymentMethodViewSet)
router.register(r'ads', AdViewSet)
router.register(r'transactions', TransactionViewSet)

urlpatterns = [
    path('', include(router.urls)),
    
    # الروابط الجديدة الخاصة بالبريد الإلكتروني وكلمة المرور
    path('verify-email/', VerifyEmailView.as_view(), name='verify-email'),
    path('password-reset/', PasswordResetRequestView.as_view(), name='password-reset'),
    path('password-reset-confirm/', PasswordResetConfirmView.as_view(), name='password-reset-confirm'),
    
    # مسار الإشعارات الجديد
    path('notifications/', UserNotificationsView.as_view(), name='user-notifications'), # <-- تمت الإضافة هنا
]
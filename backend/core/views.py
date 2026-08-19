import random
from django.core.cache import cache
from rest_framework import viewsets, status
from rest_framework.permissions import IsAuthenticatedOrReadOnly, IsAuthenticated, AllowAny
from rest_framework.authtoken.views import ObtainAuthToken
from rest_framework.authtoken.models import Token
from rest_framework.response import Response
from rest_framework.views import APIView
from django.core.mail import send_mail
from django.conf import settings
from django.shortcuts import render

from django.utils import timezone
from datetime import timedelta
from rest_framework.throttling import AnonRateThrottle
from .permissions import IsUserOwner, IsOwnerOrReadOnly

class OTPThrottle(AnonRateThrottle):
    rate = '5/min'

# أضفنا Notification هنا في قائمة الاستدعاءات
from .models import User, PaymentMethod, Ad, Transaction, Notification
from .serializers import UserSerializer, PaymentMethodSerializer, AdSerializer, TransactionSerializer


from django.views.decorators.cache import never_cache

@never_cache




class UserViewSet(viewsets.ModelViewSet):
    queryset = User.objects.all()
    serializer_class = UserSerializer

    def get_permissions(self):
        if self.request.method == 'POST':
            return [AllowAny()]
        elif self.request.method in ['PUT', 'PATCH', 'DELETE']:
            return [IsAuthenticated(), IsUserOwner()]
        return [IsAuthenticated()]

    def destroy(self, request, *args, **kwargs):
        user = self.get_object()
        if user != request.user:
            return Response({'error': 'لا تملك صلاحية حذف هذا الحساب'}, status=status.HTTP_403_FORBIDDEN)
        return super().destroy(request, *args, **kwargs)

    def create(self, request, *args, **kwargs):
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        user = serializer.save()
        
        # 1. جعل الحساب غير فعال حتى يتم تأكيده
        user.is_active = False
        user.save()

        # 2. توليد رمز تأكيد (OTP) عشوائي من 6 أرقام
        otp_code = str(random.randint(100000, 999999))
        
        # 3. تخزين الرمز في الكاش لمدة 10 دقائق (600 ثانية)
        cache.set(f'verify_{user.email}', otp_code, timeout=600)
        
        # 4. إرسال الإيميل بالرمز (باستخدام إيميل المشروع الافتراضي)
        email_sender = getattr(settings, 'EMAIL_HOST_USER', 'dailyjob2026@gmail.com')
        
        send_mail(
            'تأكيد حسابك في Daily Job',
            f'مرحباً {user.username}،\nشكراً لتسجيلك!\n\nرمز التأكيد الخاص بك هو: {otp_code}\n\nهذا الرمز صالح لمدة 10 دقائق فقط.',
            email_sender,
            [user.email],
            fail_silently=False,
        )
        
        headers = self.get_success_headers(serializer.data)
        return Response({
            'message': 'تم إنشاء الحساب بنجاح، يرجى مراجعة بريدك الإلكتروني للحصول على رمز التفعيل.'
        }, status=status.HTTP_201_CREATED, headers=headers)


class VerifyEmailView(APIView):
    permission_classes = [AllowAny]
    throttle_classes = [OTPThrottle]
    
    def post(self, request):
        email = request.data.get('email')
        entered_otp = request.data.get('otp')
        
        # جلب الرمز المخزن لهذا الإيميل
        cached_otp = cache.get(f'verify_{email}')

        if cached_otp and str(cached_otp) == str(entered_otp):
            user = User.objects.filter(email=email).first()
            if user:
                user.is_active = True # تفعيل الحساب
                user.save()
                
                # حذف الرمز من الكاش بعد التفعيل الناجح
                cache.delete(f'verify_{email}')
                
                return Response({'message': 'تم تفعيل الحساب بنجاح! يمكنك الآن تسجيل الدخول.'})
                
        return Response({'error': 'رمز التفعيل غير صالح أو منتهي الصلاحية.'}, status=status.HTTP_400_BAD_REQUEST)


class PasswordResetRequestView(APIView):
    permission_classes = [AllowAny]
    throttle_classes = [OTPThrottle]
    
    def post(self, request):
        email = request.data.get('email')
        user = User.objects.filter(email=email).first()
        
        if user:
            # توليد رمز عشوائي للاستعادة
            otp_code = str(random.randint(100000, 999999))
            cache.set(f'reset_{email}', otp_code, timeout=600)
            
            email_sender = getattr(settings, 'EMAIL_HOST_USER', 'dailyjob2026@gmail.com')
            send_mail(
                'إعادة تعيين كلمة المرور - Daily Job',
                f'مرحباً،\nلقد طلبت إعادة تعيين كلمة المرور.\n\nرمز التحقق الخاص بك هو: {otp_code}\n\nهذا الرمز صالح لمدة 10 دقائق فقط.',
                email_sender,
                [email],
                fail_silently=False,
            )
            
        # نرجع رسالة نجاح دائماً لدواعي أمنية
        return Response({'message': 'إذا كان البريد مسجلاً لدينا، سيصلك رمز التحقق قريباً.'})


class PasswordResetConfirmView(APIView):
    permission_classes = [AllowAny]
    throttle_classes = [OTPThrottle]
    
    def post(self, request):
        email = request.data.get('email')
        entered_otp = request.data.get('otp')
        new_password = request.data.get('new_password')

        # جلب الرمز الخاص بالاستعادة
        cached_otp = cache.get(f'reset_{email}')

        if cached_otp and str(cached_otp) == str(entered_otp):
            user = User.objects.filter(email=email).first()
            if user:
                user.set_password(new_password)
                user.save()
                
                # حذف الرمز من الكاش
                cache.delete(f'reset_{email}')
                
                return Response({'message': 'تم تغيير كلمة المرور بنجاح.'})
                
        return Response({'error': 'الرمز غير صالح أو منتهي الصلاحية.'}, status=status.HTTP_400_BAD_REQUEST)
        

class PaymentMethodViewSet(viewsets.ModelViewSet):
    queryset = PaymentMethod.objects.filter(is_active=True)
    serializer_class = PaymentMethodSerializer
    permission_classes = [IsAuthenticatedOrReadOnly]


class TransactionViewSet(viewsets.ModelViewSet):
    queryset = Transaction.objects.all()
    serializer_class = TransactionSerializer
    permission_classes = [IsAuthenticated, IsOwnerOrReadOnly]


class AdViewSet(viewsets.ModelViewSet):
    queryset = Ad.objects.all()
    serializer_class = AdSerializer
    permission_classes = [IsAuthenticatedOrReadOnly, IsOwnerOrReadOnly]

    def get_serializer_context(self):
        context = super().get_serializer_context()
        context.update({"request": self.request})
        return context

    def get_queryset(self):
        now = timezone.now()
        expiration_cutoff = now - timedelta(hours=24)
        grace_period_cutoff = now - timedelta(minutes=10)
        
        # 1. Automation: Delete ads older than 24 hours
        Ad.objects.filter(created_at__lt=expiration_cutoff).delete()
        
        # 2. Automation: Auto-approve pending ads older than 10 minutes
        Ad.objects.filter(status='pending', created_at__lt=grace_period_cutoff).update(status='approved')
        
        # Base query: remaining ads (which are all <= 24 hours)
        queryset = Ad.objects.select_related('user').all().order_by('-created_at')
        
        status_filter = self.request.query_params.get('status')
        user_filter = self.request.query_params.get('user_id')
        
        # Admin can see everything
        if self.request.user.is_authenticated and getattr(self.request.user, 'role', '') == 'admin':
            pass
        elif self.request.user.is_authenticated:
            # Users see approved ads PLUS their own ads
            from django.db.models import Q
            queryset = queryset.filter(Q(status='approved') | Q(user=self.request.user))
        else:
            # Public / unauthenticated
            queryset = queryset.filter(status='approved')
            
        # Apply specific filters if requested
        if status_filter:
            queryset = queryset.filter(status=status_filter)
            
        if user_filter:
            queryset = queryset.filter(user_id=user_filter)
            
        return queryset

    def perform_create(self, serializer):
        from .models import AdImage
        # 1. Save the Ad instance
        ad = serializer.save(user=self.request.user)
        
        # 2. Save all uploaded images (multiple images support)
        images = self.request.FILES.getlist('images')
        for img in images:
            AdImage.objects.create(ad=ad, image=img)
        
        # 3. Extract receipt_image from request data
        receipt_image = self.request.data.get('receipt_image')
        
        # 4. Create a Transaction linked to the Ad and user
        if receipt_image:
            Transaction.objects.create(
                ad=ad,
                user=self.request.user,
                receipt_image=receipt_image
            )

    def perform_update(self, serializer):
        from .models import AdImage
        ad = serializer.save()
        
        # تحديث الصور الإضافية إذا قام المستخدم برفع صور جديدة
        images = self.request.FILES.getlist('images')
        if images:
            # حذف الصور القديمة
            AdImage.objects.filter(ad=ad).delete()
            # إضافة الصور الجديدة
            for img in images:
                AdImage.objects.create(ad=ad, image=img)
                
        # تحديث وصل الدفع إن وجد
        receipt_image = self.request.data.get('receipt_image')
        if receipt_image:
            Transaction.objects.create(
                ad=ad,
                user=self.request.user,
                receipt_image=receipt_image
            )


class CustomAuthToken(ObtainAuthToken):
    def post(self, request, *args, **kwargs):
        login_input = request.data.get('username')  
        password = request.data.get('password')

        if not login_input or not password:
            return Response({'error': 'الرجاء إدخال بيانات الدخول'}, status=status.HTTP_400_BAD_REQUEST)

        user = User.objects.filter(email=login_input).first()
        
        if not user:
            user = User.objects.filter(username=login_input).first()

        if not user:
            return Response({'error': 'بيانات الدخول غير صحيحة'}, status=status.HTTP_400_BAD_REQUEST)

        if user.check_password(password):
            token, created = Token.objects.get_or_create(user=user)
            return Response({
                'token': token.key,
                'user_id': str(user.pk),
                'email': user.email,
                'username': user.username,
                'role': user.role
            })
        else:
            return Response({'error': 'بيانات الدخول غير صحيحة'}, status=status.HTTP_400_BAD_REQUEST)


# ----------------------------------------------------
# العرض الجديد الخاص بـ API الإشعارات
# ----------------------------------------------------
class UserNotificationsView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        # حذف الإشعارات الأقدم من 24 ساعة تلقائياً
        cutoff = timezone.now() - timedelta(hours=24)
        Notification.objects.filter(user=request.user, created_at__lt=cutoff).delete()

        # جلب أحدث 30 إشعار للمستخدم
        notifications = Notification.objects.filter(user=request.user).order_by('-created_at')[:30]

        data = [
            {
                "id": n.id,
                "title": n.title,
                "message": n.message,
                "ad_id": str(n.ad_id) if n.ad_id else None,
                "is_read": n.is_read,
                "created_at": n.created_at
            } for n in notifications
        ]
        return Response(data)

    def patch(self, request):
        """تحديث حالة قراءة إشعار أو كل الإشعارات"""
        notif_id = request.data.get('id')
        mark_all = request.data.get('mark_all', False)

        if mark_all:
            Notification.objects.filter(user=request.user, is_read=False).update(is_read=True)
            return Response({'status': 'all_marked_read'})

        if notif_id:
            updated = Notification.objects.filter(id=notif_id, user=request.user).update(is_read=True)
            if updated:
                return Response({'status': 'marked_read'})
            return Response({'error': 'Notification not found'}, status=status.HTTP_404_NOT_FOUND)

        return Response({'error': 'Provide id or mark_all=true'}, status=status.HTTP_400_BAD_REQUEST)

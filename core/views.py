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

from .models import User, PaymentMethod, Ad, Transaction
from .serializers import UserSerializer, PaymentMethodSerializer, AdSerializer, TransactionSerializer

class UserViewSet(viewsets.ModelViewSet):
    queryset = User.objects.all()
    serializer_class = UserSerializer

    def get_permissions(self):
        if self.request.method == 'POST':
            return [AllowAny()]
        return [IsAuthenticated()]

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
    permission_classes = [IsAuthenticated]


class AdViewSet(viewsets.ModelViewSet):
    queryset = Ad.objects.all()
    serializer_class = AdSerializer
    permission_classes = [IsAuthenticatedOrReadOnly]

    def perform_create(self, serializer):
        serializer.save(user=self.request.user)


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
                'username': user.username
            })
        else:
            return Response({'error': 'بيانات الدخول غير صحيحة'}, status=status.HTTP_400_BAD_REQUEST)
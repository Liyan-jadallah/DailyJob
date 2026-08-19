from rest_framework import serializers
from .models import User, PaymentMethod, Ad, AdImage, Transaction, Notification
from .minimal_user_serializer import MinimalUserSerializer

class UserSerializer(serializers.ModelSerializer):
    password = serializers.CharField(write_only=True)

    class Meta:
        model = User
        fields = ['id', 'username', 'email', 'password', 'first_name', 'last_name', 'phone_number', 'role', 'date_joined']
        read_only_fields = ['id', 'date_joined', 'role']

    def create(self, validated_data):
        user = User.objects.create_user(
            username=validated_data['username'],
            email=validated_data.get('email', ''),
            password=validated_data['password']
        )
        return user

class PaymentMethodSerializer(serializers.ModelSerializer):
    class Meta:
        model = PaymentMethod
        fields = '__all__'

class AdImageSerializer(serializers.ModelSerializer):
    class Meta:
        model = AdImage
        fields = ['id', 'image']

class AdSerializer(serializers.ModelSerializer):
    # تفاصيل المستخدم مختصرة
    user_details = MinimalUserSerializer(source='user', read_only=True)

    # السطر الجديد: جلب إيميل صاحب الإعلان مباشرة لزر الحذف
    user_email = serializers.ReadOnlyField(source='user.email')

    # الصور الإضافية
    extra_images = AdImageSerializer(many=True, read_only=True)

    # صورة الوصل من Transaction
    receipt_image = serializers.SerializerMethodField()

    def get_receipt_image(self, obj):
        tx = obj.transactions.order_by('-submitted_at').first()
        if tx and tx.receipt_image:
            request = self.context.get('request')
            if request:
                return request.build_absolute_uri(tx.receipt_image.url)
            return tx.receipt_image.url
        return None

    class Meta:
        model = Ad
        fields = ['id', 'user', 'user_details', 'user_email', 'title', 'description', 'category', 'governorate', 'price', 'contact_phone', 'image', 'extra_images', 'receipt_image', 'status', 'created_at']
        read_only_fields = ['id', 'created_at', 'user']

    def get_fields(self):
        fields = super().get_fields()
        request = self.context.get('request')
        # status قابل للتعديل فقط من الأدمن
        if not (request and hasattr(request.user, 'role') and request.user.role == 'admin'):
            fields['status'].read_only = True
        return fields

class TransactionSerializer(serializers.ModelSerializer):
    class Meta:
        model = Transaction
        fields = '__all__'
        read_only_fields = ['id', 'submitted_at', 'status', 'user']

class NotificationSerializer(serializers.ModelSerializer):
    class Meta:
        model = Notification
        fields = ['id', 'user', 'title', 'message', 'ad_id', 'is_read', 'created_at']
        read_only_fields = ['id', 'created_at']
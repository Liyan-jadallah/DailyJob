from rest_framework import serializers
from .models import User, PaymentMethod, Ad, Transaction
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

class AdSerializer(serializers.ModelSerializer):
    # تفاصيل المستخدم مختصرة
    user_details = MinimalUserSerializer(source='user', read_only=True)

    # السطر الجديد: جلب إيميل صاحب الإعلان مباشرة لزر الحذف
    user_email = serializers.ReadOnlyField(source='user.email')

    # إضافة حقل الصورة كـ SerializerMethodField لضمان رابط كامل
    image = serializers.SerializerMethodField()

    class Meta:
        model = Ad
        fields = ['id', 'user', 'user_details', 'user_email', 'title', 'description', 'category', 'governorate', 'price', 'contact_phone', 'image', 'status', 'created_at']
        read_only_fields = ['id', 'created_at', 'status', 'user']

    def get_image(self, obj):
        if obj.image and hasattr(obj.image, 'url'):
            request = self.context.get('request')
            if request is not None:
                return request.build_absolute_uri(obj.image.url)
            return obj.image.url
        return None

class TransactionSerializer(serializers.ModelSerializer):
    class Meta:
        model = Transaction
        fields = '__all__'
        read_only_fields = ['id', 'submitted_at', 'status', 'user']
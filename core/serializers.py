from rest_framework import serializers
from .models import User, PaymentMethod, Ad, Transaction, FlaggedKeyword

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
    # تفاصيل المستخدم كاملة (ممتازة لعرض اسم الناشر في الواجهة)
    user_details = UserSerializer(source='user', read_only=True)
    
    # السطر الجديد: جلب إيميل صاحب الإعلان مباشرة لزر الحذف
    user_email = serializers.ReadOnlyField(source='user.email')
    
    class Meta:
        model = Ad
        fields = '__all__'
        read_only_fields = ['id', 'created_at', 'status', 'user']

class TransactionSerializer(serializers.ModelSerializer):
    class Meta:
        model = Transaction
        fields = '__all__'
        read_only_fields = ['id', 'submitted_at', 'status', 'user']
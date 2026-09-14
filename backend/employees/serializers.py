from rest_framework import serializers
from django.contrib.auth.models import User
from rest_framework_simplejwt.serializers import TokenObtainPairSerializer
from .models import ( Employee,
                    Department,
                    LeaveRequest,
                    ShiftLog ,
                    LeaveBalance ,
                    WorkflowRequest,
                    Holiday, )

class CustomTokenObtainPairSerializer(TokenObtainPairSerializer):
    def validate(self, attrs):
        data = super().validate(attrs)
        data['is_staff'] = self.user.is_staff
        data['username'] = self.user.username
        data['role'] = 'admin' if self.user.is_staff else 'employee'
        # Find the employee record linked to this user by email
        employee = Employee.objects.filter(email=self.user.email).first()
        data['employee_id'] = employee.id if employee else None
        return data

class EmployeeSerializer(serializers.ModelSerializer):
    department_name = serializers.ReadOnlyField(source='department.name')
    # ⭐ File upload fields - full URL paths for frontend display ⭐
    profile_picture_url = serializers.SerializerMethodField()
    document_url = serializers.SerializerMethodField()

    class Meta:
        model = Employee
        fields = '__all__'

    def get_profile_picture_url(self, obj):
        """Return absolute URL for the profile picture, or None if not uploaded"""
        if obj.profile_picture:
            request = self.context.get('request')
            if request:
                return request.build_absolute_uri(obj.profile_picture.url)
            return obj.profile_picture.url
        return None

    def get_document_url(self, obj):
        """Return absolute URL for the uploaded document, or None if not uploaded"""
        if obj.document:
            request = self.context.get('request')
            if request:
                return request.build_absolute_uri(obj.document.url)
            return obj.document.url
        return None

class LeaveRequestSerializer(serializers.ModelSerializer):
    employee_name = serializers.SerializerMethodField()

    class Meta:
        model = LeaveRequest
        fields = [
            'id', 'employee', 'employee_name', 'leave_type',
            'start_date', 'end_date', 'reason', 'status', 'applied_on',
        ]

    def get_employee_name(self, obj):
        return f"{obj.employee.first_name} {obj.employee.last_name}"
    
class ShiftLogSerializer(serializers.ModelSerializer):
    class Meta:
        model = ShiftLog
        fields = '__all__'

class RegisterSerializer(serializers.ModelSerializer):
    password = serializers.CharField(write_only=True)

    class Meta:
        model = User
        fields = ('username', 'password', 'email')

    def create(self, validated_data):
        user = User.objects.create_user(**validated_data)
        return user
# from django.contrib.auth.models import User
# from rest_framework import serializers 
# from .models import Department, Employee , LeaveRequest
# from .models import ShiftLog

# from rest_framework_simplejwt.serializers import TokenObtainPairSerializer

# class CustomTokenObtainPairSerializer(TokenObtainPairSerializer):
#     @classmethod
#     def get_token(cls, user):
#         token = super().get_token(user)
#         # Token ထဲတွင် user ၏ role အချက်အလက်များ ထည့်သွင်းခြင်း
#         token['username'] = user.username
#         token['is_staff'] = user.is_staff
#         token['is_superuser'] = user.is_superuser
#         return token

#     def validate(self, attrs):
#         data = super().validate(attrs)
#         # Response payload ထဲတွင်လည်း role ထည့်ပေးခြင်း
#         data['is_staff'] = self.user.is_staff
#         data['username'] = self.user.username
#         return data

# class RegisterSerializer(serializers.ModelSerializer):
#     password = serializers.CharField(write_only=True)

#     class Meta:
#         model = User
#         fields = ['username', 'email', 'password', 'first_name', 'last_name']

#     def create(self, validated_data):
#         user = User.objects.create_user(
#             username=validated_data['username'],
#             email=validated_data.get('email', ''),
#             password=validated_data['password'],
#             first_name=validated_data.get('first_name', ''),
#             last_name=validated_data.get('last_name', ''),
#             is_staff=False  # ပုံမှန် Register လုပ်သူများကို Employee/Read-only အဖြစ် သတ်မှတ်သည်
#         )
#         return user
    
# class DepartmentSerializer(serializers.ModelSerializer):
#     class Meta:
#         model = Department
#         fields = '__all__'

# class EmployeeSerializer(serializers.ModelSerializer):
#     department_name = serializers.ReadOnlyField(source='department.name')
    
#     class Meta:
#         model = Employee
#         fields = '__all__'

# class LeaveRequestSerializer(serializers.ModelSerializer):
#     employee_name = serializers.SerializerMethodField()

#     class Meta:
#         model = LeaveRequest
#         fields = '__all__'

#     def get_employee_name(self, obj):
#         return f"{obj.employee.first_name} {obj.employee.last_name}"

# class ShiftLogSerializer(serializers.ModelSerializer):
#     employee_name = serializers.SerializerMethodField()

#     class Meta:
#         model = ShiftLog
#         fields = '__all__'

#     def get_employee_name(self, obj):
#         return f"{obj.employee.first_name} {obj.employee.last_name}"

class LeaveBalanceSerializer(serializers.ModelSerializer):
    employee_name = serializers.SerializerMethodField()
    available_days = serializers.DecimalField(
        max_digits=5, decimal_places=1, read_only=True
    )

    class Meta:
        model = LeaveBalance
        fields = [
            'id', 'employee', 'employee_name',
            'leave_type', 'year',
            'entitled_days', 'used_days', 'adjustment_days',
            'adjustment_reason', 'available_days',
            'created_at', 'updated_at',
        ]
        read_only_fields = ['used_days', 'created_at', 'updated_at']

    def get_employee_name(self, obj):
        return f"{obj.employee.first_name} {obj.employee.last_name}"

class HolidaySerializer(serializers.ModelSerializer):
    region_display = serializers.CharField(source='get_region_display', read_only=True)

    class Meta:
        model = Holiday
        fields = [
            'id', 'name', 'date', 'region', 'region_display',
            'year', 'is_paid', 'notes',
        ]
        read_only_fields = ['year']
from rest_framework import serializers
from django.contrib.auth.models import User
from rest_framework_simplejwt.serializers import TokenObtainPairSerializer
from .models import Employee, Department, LeaveRequest, ShiftLog

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

    class Meta:
        model = Employee
        fields = '__all__'

class DepartmentSerializer(serializers.ModelSerializer):
    class Meta:
        model = Department
        fields = '__all__'

class LeaveRequestSerializer(serializers.ModelSerializer):
    class Meta:
        model = LeaveRequest
        fields = '__all__'

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
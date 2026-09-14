import json
import time
from django.http import StreamingHttpResponse
from django.db.models import Sum, Count
from django.utils import timezone
from django.contrib.auth.models import User

from rest_framework import viewsets, generics, status , filters
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.permissions import AllowAny, IsAuthenticated

from .models import Employee, Department, ShiftLog, WorkflowRequest, LeaveRequest
from .serializers import (
    EmployeeSerializer, 
    DepartmentSerializer, 
    LeaveRequestSerializer, 
    ShiftLogSerializer, 
    RegisterSerializer
)
from .permissions import IsAdminOrReadOnly, IsAdminUser


class RegisterView(generics.CreateAPIView):
    queryset = User.objects.all()
    permission_classes = (AllowAny,)  # မည်သူမဆို အကောင့်အသစ် လာဖွင့်နိုင်သည်
    serializer_class = RegisterSerializer


class RealTimeAnalyticsView:
    @staticmethod
    def stream_dashboard_metrics(request):
        """
        Server-Sent Events (SSE) endpoint providing live telemetry on labor costs and active headcount.
        """
        def event_stream():
            while True:
                total_headcount = Employee.objects.filter(status=Employee.Status.ACTIVE).count()
                total_labor_cost = (
                    Employee.objects
                    .filter(status=Employee.Status.ACTIVE)
                    .aggregate(total=Sum('salary'))['total'] or 0.0 )
                pending_workflows = WorkflowRequest.objects.filter(status='PENDING').count()
                
                payload = {
                    "timestamp": time.time(),
                    "active_headcount": total_headcount,
                    "monthly_labor_cost": float(total_labor_cost),
                    "pending_approvals": pending_workflows
                }
                
                yield f"data: {json.dumps(payload)}\n\n"
                time.sleep(3)  # Push stream update every 3 seconds

        response = StreamingHttpResponse(event_stream(), content_type='text/event-stream')
        response['Cache-Control'] = 'no-cache'
        response['X-Accel-Buffering'] = 'no'  # Prevents NGINX buffering
        return response


from django.http import HttpResponse
from reportlab.lib.pagesizes import letter
from reportlab.pdfgen import canvas
from reportlab.lib import colors

class EmployeeViewSet(viewsets.ModelViewSet):
    queryset = Employee.objects.all().order_by('-id')
    serializer_class = EmployeeSerializer
    permission_classes = [IsAuthenticated, IsAdminOrReadOnly]

    # ⭐ Search & Ordering Filter များ တပ်ဆင်ခြင်း ⭐
    filter_backends = [filters.SearchFilter, filters.OrderingFilter]
    search_fields = ['first_name', 'last_name', 'email', 'department__name']
    ordering_fields = ['id', 'salary', 'first_name']

    def get_queryset(self):
        """Non-admin users can only see their own employee record"""
        queryset = super().get_queryset().exclude(status=Employee.Status.TERMINATED)
        if not self.request.user.is_staff:
            employee = Employee.objects.filter(email=self.request.user.email).first()
            if employee:
                return queryset.filter(id=employee.id)
            return queryset.none()
        return queryset
    

    # ⭐ Payslip PDF Download ခေါ်ဆိုရန် Custom Action ⭐
    @action(detail=True, methods=['get'])
    def generate_payslip(self, request, pk=None):
        employee = self.get_object()

        # Non-admin users can only download their own payslip
        if not request.user.is_staff:
            own_employee = Employee.objects.filter(email=request.user.email).first()
            if not own_employee or own_employee.id != employee.id:
                return Response({"error": "Permission denied."}, status=status.HTTP_403_FORBIDDEN)

        # PDF Response Header သတ်မှတ်ခြင်း
        response = HttpResponse(content_type='application/pdf')
        response['Content-Disposition'] = f'attachment; filename="Payslip_{employee.first_name}.pdf"'

        # Canvas စတင်ဖန်တီးခြင်း
        p = canvas.Canvas(response, pagesize=letter)
        
        # ခေါင်းစဉ်ပိုင်း (Header Design)
        p.setFont("Helvetica-Bold", 18)
        p.drawString(200, 750, "HR SYSTEM - PAYSLIP")
        
        p.setLineWidth(1)
        p.line(50, 735, 550, 735)

        # ဝန်ထမ်း အချက်အလက်များ
        p.setFont("Helvetica", 12)
        p.drawString(50, 700, f"Employee ID: EMP-{employee.id:04d}")
        p.drawString(50, 680, f"Employee Name: {employee.first_name} {employee.last_name}")
        p.drawString(50, 660, f"Email: {employee.email}")
        p.drawString(50, 640, f"Department: {employee.department.name if employee.department else 'N/A'}")

        p.line(50, 620, 550, 620)

        # လစာဇယား ပုံစံ
        p.setFont("Helvetica-Bold", 12)
        p.drawString(50, 590, "Description")
        p.drawString(400, 590, "Amount")

        p.setFont("Helvetica", 12)
        p.drawString(50, 560, "Basic Salary")
        p.drawString(400, 560, f"${employee.salary:,.2f}")

        p.drawString(50, 540, "Allowances / Bonuses")
        p.drawString(400, 540, "$0.00")

        p.line(50, 520, 550, 520)

        # Total Amount
        p.setFont("Helvetica-Bold", 14)
        p.drawString(50, 490, "Net Payable Salary:")
        p.drawString(400, 490, f"${employee.salary:,.2f}")

        # စာမျက်နှာ ပိတ်ပစ်ခြင်း
        p.showPage()
        p.save()
        return response
    
@action(detail=True, methods=['post'])
def terminate(self, request, pk=None):
    employee = self.get_object()
    employee.status = Employee.Status.TERMINATED
    employee.terminated_at = timezone.now().date()
    employee.termination_reason = request.data.get('reason', '')
    employee.save()
    return Response(self.get_serializer(employee).data)

class DepartmentViewSet(viewsets.ModelViewSet):
    queryset = Department.objects.all()
    serializer_class = DepartmentSerializer
    permission_classes = [IsAuthenticated, IsAdminOrReadOnly]


class LeaveRequestViewSet(viewsets.ModelViewSet):
    queryset = LeaveRequest.objects.all().order_by('-applied_on')
    serializer_class = LeaveRequestSerializer
    permission_classes = [IsAuthenticated]

    filter_backends = [filters.SearchFilter]
    search_fields = ['status', 'reason', 'employee__first_name']

    def get_queryset(self):
        """Non-admin users can only see their own leave requests"""
        queryset = super().get_queryset()
        if not self.request.user.is_staff:
            employee = Employee.objects.filter(email=self.request.user.email).first()
            if employee:
                return queryset.filter(employee=employee)
            return queryset.none()
        return queryset

    def perform_create(self, serializer):
        """Non-admin users can only create leave for themselves"""
        if not self.request.user.is_staff:
            employee = Employee.objects.filter(email=self.request.user.email).first()
            if employee:
                serializer.save(employee=employee)
                return
            raise PermissionError("No employee record found for this user.")
        serializer.save()


class ShiftLogViewSet(viewsets.ModelViewSet):
    queryset = ShiftLog.objects.all().order_by('-clock_in')
    serializer_class = ShiftLogSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        """Non-admin users can only see their own attendance logs"""
        queryset = super().get_queryset()
        if not self.request.user.is_staff:
            employee = Employee.objects.filter(email=self.request.user.email).first()
            if employee:
                return queryset.filter(employee=employee)
            return queryset.none()
        return queryset

    # ဝန်ထမ်း Clock In လုပ်ရန် Custom API
    @action(detail=False, methods=['post'])
    def clock_in(self, request):
        employee_id = request.data.get('employee_id')
        
        # Non-admin users can only clock in for themselves
        if not request.user.is_staff:
            own_employee = Employee.objects.filter(email=request.user.email).first()
            if not own_employee or str(own_employee.id) != str(employee_id):
                return Response({"error": "Permission denied. You can only clock in for yourself."}, status=status.HTTP_403_FORBIDDEN)
        
        # ယနေ့အတွက် Clock out မလုပ်ရသေးတဲ့ မှတ်တမ်းရှိမရှိ စစ်ဆေးခြင်း
        existing_log = ShiftLog.objects.filter(employee_id=employee_id, clock_out__isnull=True).first()
        if existing_log:
            return Response({"error": "Clock out အရင်လုပ်ရန် လိုအပ်ပါသည်။"}, status=status.HTTP_400_BAD_REQUEST)

        shift = ShiftLog.objects.create(employee_id=employee_id, clock_in=timezone.now())
        return Response(ShiftLogSerializer(shift).data, status=status.HTTP_201_CREATED)

    # ဝန်ထမ်း Clock Out လုပ်ရန် Custom API
    @action(detail=False, methods=['post'])
    def clock_out(self, request):
        employee_id = request.data.get('employee_id')
        
        # Non-admin users can only clock out for themselves
        if not request.user.is_staff:
            own_employee = Employee.objects.filter(email=request.user.email).first()
            if not own_employee or str(own_employee.id) != str(employee_id):
                return Response({"error": "Permission denied. You can only clock out for yourself."}, status=status.HTTP_403_FORBIDDEN)
        
        # Clock out မလုပ်ရသေးတဲ့ မှတ်တမ်းကို ရှာခြင်း
        active_shift = ShiftLog.objects.filter(employee_id=employee_id, clock_out__isnull=True).first()
        if not active_shift:
            return Response({"error": "Clock In လုပ်ထားသော မှတ်တမ်း မရှိပါ။"}, status=status.HTTP_400_BAD_REQUEST)

        active_shift.clock_out = timezone.now()
        active_shift.save()
        return Response(ShiftLogSerializer(active_shift).data, status=status.HTTP_200_OK)
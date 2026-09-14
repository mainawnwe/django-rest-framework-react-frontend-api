import json
import time
from django.http import StreamingHttpResponse, HttpResponse
from django.db.models import Sum
from django.utils import timezone
from django.contrib.auth.models import User

from rest_framework import viewsets, generics, status, filters
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.permissions import AllowAny, IsAuthenticated
from rest_framework.exceptions import ValidationError

from reportlab.lib.pagesizes import letter
from reportlab.pdfgen import canvas

from .models import (
    Employee, Department, ShiftLog, WorkflowRequest,
    LeaveRequest, LeaveBalance, Holiday,
)
from .serializers import (
    EmployeeSerializer,
    DepartmentSerializer,
    LeaveRequestSerializer,
    ShiftLogSerializer,
    RegisterSerializer,
    LeaveBalanceSerializer,
    HolidaySerializer,
)
from .services.leave_accrual import (
    initialize_balances_for_employee,
    recalculate_used_days,
    has_sufficient_balance,
    calculate_working_days,
    get_upcoming_holidays,
)
from .permissions import IsAdminOrReadOnly


# ─────────────────────────────────────────────────────────────
#  Auth
# ─────────────────────────────────────────────────────────────

class RegisterView(generics.CreateAPIView):
    queryset = User.objects.all()
    permission_classes = (AllowAny,)
    serializer_class = RegisterSerializer


# ─────────────────────────────────────────────────────────────
#  Analytics (SSE)
# ─────────────────────────────────────────────────────────────

class RealTimeAnalyticsView:
    @staticmethod
    def stream_dashboard_metrics(request):
        def event_stream():
            while True:
                total_headcount = (
                    Employee.objects
                    .filter(status=Employee.Status.ACTIVE)
                    .count()
                )
                total_labor_cost = (
                    Employee.objects
                    .filter(status=Employee.Status.ACTIVE)
                    .aggregate(total=Sum('salary'))['total'] or 0.0
                )
                pending_workflows = (
                    WorkflowRequest.objects.filter(status='PENDING').count()
                    + LeaveRequest.objects.filter(
                        status=LeaveRequest.Status.PENDING
                    ).count()
                )

                payload = {
                    "timestamp": time.time(),
                    "active_headcount": total_headcount,
                    "monthly_labor_cost": float(total_labor_cost),
                    "pending_approvals": pending_workflows,
                }

                yield f"data: {json.dumps(payload)}\n\n"
                time.sleep(3)

        response = StreamingHttpResponse(
            event_stream(), content_type='text/event-stream'
        )
        response['Cache-Control'] = 'no-cache'
        response['X-Accel-Buffering'] = 'no'
        return response


# ─────────────────────────────────────────────────────────────
#  Employees
# ─────────────────────────────────────────────────────────────

class EmployeeViewSet(viewsets.ModelViewSet):
    queryset = Employee.objects.all().order_by('-id')
    serializer_class = EmployeeSerializer
    permission_classes = [IsAuthenticated, IsAdminOrReadOnly]

    filter_backends = [filters.SearchFilter, filters.OrderingFilter]
    search_fields = ['first_name', 'last_name', 'email', 'department__name']
    ordering_fields = ['id', 'salary', 'first_name']

    def get_queryset(self):
        queryset = (
            super().get_queryset()
            .exclude(status=Employee.Status.TERMINATED)
        )
        if not self.request.user.is_staff:
            employee = Employee.objects.filter(
                email=self.request.user.email
            ).first()
            if employee:
                return queryset.filter(id=employee.id)
            return queryset.none()
        return queryset

    @action(detail=True, methods=['get'])
    def generate_payslip(self, request, pk=None):
        employee = self.get_object()

        if not request.user.is_staff:
            own_employee = Employee.objects.filter(
                email=request.user.email
            ).first()
            if not own_employee or own_employee.id != employee.id:
                return Response(
                    {"error": "Permission denied."},
                    status=status.HTTP_403_FORBIDDEN,
                )

        response = HttpResponse(content_type='application/pdf')
        response['Content-Disposition'] = (
            f'attachment; filename="Payslip_{employee.first_name}.pdf"'
        )

        p = canvas.Canvas(response, pagesize=letter)
        p.setFont("Helvetica-Bold", 18)
        p.drawString(200, 750, "HR SYSTEM - PAYSLIP")
        p.setLineWidth(1)
        p.line(50, 735, 550, 735)

        p.setFont("Helvetica", 12)
        p.drawString(50, 700, f"Employee ID: EMP-{employee.id:04d}")
        p.drawString(
            50, 680,
            f"Employee Name: {employee.first_name} {employee.last_name}",
        )
        p.drawString(50, 660, f"Email: {employee.email}")
        p.drawString(
            50, 640,
            f"Department: {employee.department.name if employee.department else 'N/A'}",
        )

        p.line(50, 620, 550, 620)

        p.setFont("Helvetica-Bold", 12)
        p.drawString(50, 590, "Description")
        p.drawString(400, 590, "Amount")

        p.setFont("Helvetica", 12)
        p.drawString(50, 560, "Basic Salary")
        p.drawString(400, 560, f"${employee.salary:,.2f}")

        p.drawString(50, 540, "Allowances / Bonuses")
        p.drawString(400, 540, "$0.00")

        p.line(50, 520, 550, 520)

        p.setFont("Helvetica-Bold", 14)
        p.drawString(50, 490, "Net Payable Salary:")
        p.drawString(400, 490, f"${employee.salary:,.2f}")

        p.showPage()
        p.save()
        return response

    @action(detail=True, methods=['post'])
    def terminate(self, request, pk=None):
        if not request.user.is_staff:
            return Response(
                {"error": "Admin only."},
                status=status.HTTP_403_FORBIDDEN,
            )
        employee = self.get_object()
        employee.status = Employee.Status.TERMINATED
        employee.terminated_at = timezone.now().date()
        employee.termination_reason = request.data.get('reason', '')
        employee.save()
        return Response(self.get_serializer(employee).data)


# ─────────────────────────────────────────────────────────────
#  Departments
# ─────────────────────────────────────────────────────────────

class DepartmentViewSet(viewsets.ModelViewSet):
    queryset = Department.objects.all()
    serializer_class = DepartmentSerializer
    permission_classes = [IsAuthenticated, IsAdminOrReadOnly]


# ─────────────────────────────────────────────────────────────
#  Leave Requests
# ─────────────────────────────────────────────────────────────

class LeaveRequestViewSet(viewsets.ModelViewSet):
    queryset = LeaveRequest.objects.all().order_by('-applied_on')
    serializer_class = LeaveRequestSerializer
    permission_classes = [IsAuthenticated]

    filter_backends = [filters.SearchFilter]
    search_fields = ['status', 'reason', 'employee__first_name']

    def get_queryset(self):
        queryset = super().get_queryset()
        if not self.request.user.is_staff:
            employee = Employee.objects.filter(
                email=self.request.user.email
            ).first()
            if employee:
                return queryset.filter(employee=employee)
            return queryset.none()
        return queryset

    def perform_create(self, serializer):
        if not self.request.user.is_staff:
            employee = Employee.objects.filter(
                email=self.request.user.email
            ).first()
            if not employee:
                raise PermissionError("No employee record found for this user.")
        else:
            employee = serializer.validated_data.get('employee')

        leave_type = serializer.validated_data.get('leave_type')
        start_date = serializer.validated_data.get('start_date')
        end_date = serializer.validated_data.get('end_date')

        _, working_days = calculate_working_days(
            start_date, end_date, region=employee.region
        )

        if working_days == 0:
            raise ValidationError({
                'detail': (
                    'ရွေးချယ်ထားတဲ့ ရက်တွေက weekend/holiday ပဲ '
                    'ဖြစ်နေပါတယ်။'
                )
            })

        sufficient, available = has_sufficient_balance(
            employee, leave_type, working_days, year=start_date.year
        )
        if not sufficient:
            raise ValidationError({
                'detail': (
                    f"Balance မလုံလောက်ပါ။ "
                    f"{leave_type}: လိုတာ {working_days} ရက် (working days)၊ "
                    f"ရှိတာ {available} ရက်"
                )
            })

        if not self.request.user.is_staff:
            serializer.save(employee=employee)
        else:
            serializer.save()

    def perform_update(self, serializer):
        old_status = serializer.instance.status
        new_status = serializer.validated_data.get('status', old_status)

        instance = serializer.save()

        if old_status != new_status:
            if new_status == LeaveRequest.Status.APPROVED:
                recalculate_used_days(
                    instance.employee, year=instance.start_date.year
                )
            elif old_status == LeaveRequest.Status.APPROVED:
                recalculate_used_days(
                    instance.employee, year=instance.start_date.year
                )

        return instance


# ─────────────────────────────────────────────────────────────
#  Leave Balances
# ─────────────────────────────────────────────────────────────

class LeaveBalanceViewSet(viewsets.ModelViewSet):
    queryset = (
        LeaveBalance.objects.all()
        .order_by('employee', '-year', 'leave_type')
    )
    serializer_class = LeaveBalanceSerializer
    permission_classes = [IsAuthenticated]
    filter_backends = [filters.SearchFilter, filters.OrderingFilter]
    search_fields = ['employee__first_name', 'employee__last_name', 'leave_type']
    ordering_fields = ['year', 'leave_type', 'entitled_days']

    def get_queryset(self):
        queryset = super().get_queryset()
        if not self.request.user.is_staff:
            employee = Employee.objects.filter(
                email=self.request.user.email
            ).first()
            if employee:
                return queryset.filter(employee=employee)
            return queryset.none()

        year = self.request.query_params.get('year')
        employee_id = self.request.query_params.get('employee')
        if year:
            queryset = queryset.filter(year=year)
        if employee_id:
            queryset = queryset.filter(employee_id=employee_id)
        return queryset

    def perform_create(self, serializer):
        if not self.request.user.is_staff:
            raise PermissionError("Admin သာ balance အသစ် ဖန်တီးနိုင်သည်။")
        serializer.save()

    def perform_update(self, serializer):
        if not self.request.user.is_staff:
            raise PermissionError("Admin သာ balance ပြင်နိုင်သည်။")
        serializer.save()

    def perform_destroy(self, instance):
        if not self.request.user.is_staff:
            raise PermissionError("Admin သာ balance ဖျက်နိုင်သည်။")
        instance.delete()

    @action(detail=True, methods=['post'])
    def adjust(self, request, pk=None):
        if not request.user.is_staff:
            return Response(
                {"error": "Admin only."},
                status=status.HTTP_403_FORBIDDEN,
            )

        balance = self.get_object()
        adjustment = request.data.get('adjustment_days')
        reason = request.data.get('reason', '')

        if adjustment is None:
            return Response(
                {"error": "adjustment_days is required."},
                status=status.HTTP_400_BAD_REQUEST,
            )

        try:
            balance.adjustment_days = float(adjustment)
        except (TypeError, ValueError):
            return Response(
                {"error": "adjustment_days must be a number."},
                status=status.HTTP_400_BAD_REQUEST,
            )

        balance.adjustment_reason = reason
        balance.save()
        return Response(self.get_serializer(balance).data)

    @action(detail=False, methods=['post'])
    def initialize_for_employee(self, request):
        if not request.user.is_staff:
            return Response(
                {"error": "Admin only."},
                status=status.HTTP_403_FORBIDDEN,
            )

        employee_id = request.data.get('employee_id')
        year = request.data.get('year')

        if not employee_id:
            return Response(
                {"error": "employee_id is required."},
                status=status.HTTP_400_BAD_REQUEST,
            )

        try:
            employee = Employee.objects.get(id=employee_id)
        except Employee.DoesNotExist:
            return Response(
                {"error": "Employee not found."},
                status=status.HTTP_404_NOT_FOUND,
            )

        created = initialize_balances_for_employee(employee, year)
        return Response({
            "created": len(created),
            "employee_id": employee.id,
            "year": year or timezone.now().year,
        })


# ─────────────────────────────────────────────────────────────
#  Holidays
# ─────────────────────────────────────────────────────────────

class HolidayViewSet(viewsets.ModelViewSet):
    queryset = Holiday.objects.all().order_by('date')
    serializer_class = HolidaySerializer
    permission_classes = [IsAuthenticated, IsAdminOrReadOnly]
    filter_backends = [filters.SearchFilter, filters.OrderingFilter]
    search_fields = ['name', 'region']
    ordering_fields = ['date', 'name']

    def get_queryset(self):
        queryset = super().get_queryset()
        region = self.request.query_params.get('region')
        year = self.request.query_params.get('year')
        if region:
            queryset = queryset.filter(region=region)
        if year:
            queryset = queryset.filter(year=year)
        return queryset

    @action(detail=False, methods=['get'])
    def upcoming(self, request):
        region = request.query_params.get('region', 'HK')
        days_ahead = int(request.query_params.get('days', 60))
        holidays = get_upcoming_holidays(region, days_ahead)
        serializer = self.get_serializer(holidays, many=True)
        return Response(serializer.data)


# ─────────────────────────────────────────────────────────────
#  Attendance
# ─────────────────────────────────────────────────────────────

class ShiftLogViewSet(viewsets.ModelViewSet):
    queryset = ShiftLog.objects.all().order_by('-clock_in')
    serializer_class = ShiftLogSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        queryset = super().get_queryset()
        if not self.request.user.is_staff:
            employee = Employee.objects.filter(
                email=self.request.user.email
            ).first()
            if employee:
                return queryset.filter(employee=employee)
            return queryset.none()
        return queryset

    @action(detail=False, methods=['post'])
    def clock_in(self, request):
        employee_id = request.data.get('employee_id')

        if not request.user.is_staff:
            own_employee = Employee.objects.filter(
                email=request.user.email
            ).first()
            if not own_employee or str(own_employee.id) != str(employee_id):
                return Response(
                    {"error": "Permission denied. You can only clock in for yourself."},
                    status=status.HTTP_403_FORBIDDEN,
                )

        existing_log = ShiftLog.objects.filter(
            employee_id=employee_id, clock_out__isnull=True
        ).first()
        if existing_log:
            return Response(
                {"error": "Clock out အရင်လုပ်ရန် လိုအပ်ပါသည်။"},
                status=status.HTTP_400_BAD_REQUEST,
            )

        shift = ShiftLog.objects.create(
            employee_id=employee_id, clock_in=timezone.now()
        )
        return Response(
            ShiftLogSerializer(shift).data, status=status.HTTP_201_CREATED
        )

    @action(detail=False, methods=['post'])
    def clock_out(self, request):
        employee_id = request.data.get('employee_id')

        if not request.user.is_staff:
            own_employee = Employee.objects.filter(
                email=request.user.email
            ).first()
            if not own_employee or str(own_employee.id) != str(employee_id):
                return Response(
                    {"error": "Permission denied. You can only clock out for yourself."},
                    status=status.HTTP_403_FORBIDDEN,
                )

        active_shift = ShiftLog.objects.filter(
            employee_id=employee_id, clock_out__isnull=True
        ).first()
        if not active_shift:
            return Response(
                {"error": "Clock In လုပ်ထားသော မှတ်တမ်း မရှိပါ။"},
                status=status.HTTP_400_BAD_REQUEST,
            )

        active_shift.clock_out = timezone.now()
        active_shift.save()
        return Response(
            ShiftLogSerializer(active_shift).data, status=status.HTTP_200_OK
        )
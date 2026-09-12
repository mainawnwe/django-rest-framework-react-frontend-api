import json
import time
from django.http import StreamingHttpResponse
from django.db.models import Sum, Count
from rest_framework import viewsets
from .models import Employee, Department, ShiftLog, WorkflowRequest
from .serializers import EmployeeSerializer, DepartmentSerializer

class RealTimeAnalyticsView:
    @staticmethod
    def stream_dashboard_metrics(request):
        """
        Server-Sent Events (SSE) endpoint providing live telemetry on labor costs and active headcount.
        """
        def event_stream():
            while True:
                total_headcount = Employee.objects.filter(is_active=True).count()
                total_labor_cost = Employee.objects.filter(is_active=True).aggregate(total=Sum('salary'))['total'] or 0.0
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

class EmployeeViewSet(viewsets.ModelViewSet):
    queryset = Employee.objects.all().order_by('-id')
    serializer_class = EmployeeSerializer

class DepartmentViewSet(viewsets.ModelViewSet):
    queryset = Department.objects.all()
    serializer_class = DepartmentSerializer
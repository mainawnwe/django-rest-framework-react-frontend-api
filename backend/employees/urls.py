from django.urls import path, include
from rest_framework.routers import DefaultRouter

from .views import (
    DepartmentViewSet,
    EmployeeViewSet,
    LeaveRequestViewSet,
    RealTimeAnalyticsView,
    RegisterView,
    ShiftLogViewSet,
    LeaveBalanceViewSet,
    HolidayViewSet,

    
)

router = DefaultRouter()
router.register(r'employees', EmployeeViewSet , basename='employee')
router.register(r'departments', DepartmentViewSet , basename='department')
router.register(r'leaves', LeaveRequestViewSet , basename='leave')
router.register(r'attendance', ShiftLogViewSet , basename='attendance')
router.register(r'leave-balances', LeaveBalanceViewSet , basename='leave-balance')
router.register(r'holidays', HolidayViewSet , basename='holiday')
urlpatterns = [
    path('register/', RegisterView.as_view(), name='register'),
    path('analytics/stream/', RealTimeAnalyticsView.stream_dashboard_metrics, name='analytics_stream'),
    path('', include(router.urls)),
]

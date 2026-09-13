from django.urls import path, include
from rest_framework.routers import DefaultRouter

from .views import (
    DepartmentViewSet,
    EmployeeViewSet,
    LeaveRequestViewSet,
    RealTimeAnalyticsView,
    RegisterView,
    ShiftLogViewSet,
)

router = DefaultRouter()
router.register(r'employees', EmployeeViewSet)
router.register(r'departments', DepartmentViewSet)
router.register(r'leaves', LeaveRequestViewSet)
router.register(r'attendance', ShiftLogViewSet)

urlpatterns = [
    path('register/', RegisterView.as_view(), name='register'),
    path('analytics/stream/', RealTimeAnalyticsView.stream_dashboard_metrics, name='analytics_stream'),
    path('', include(router.urls)),
]

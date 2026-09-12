import uuid
from django.db import models
from django.utils import timezone

class Department(models.Model):
    name = models.CharField(max_length=100, unique=True)
    code = models.CharField(max_length=10, unique=True)

    def __str__(self):
        return f"{self.name} ({self.code})"

class Region(models.TextChoices):
    HONG_KONG = 'HK', 'Hong Kong SAR'
    CHINA = 'CN', 'Mainland China'
    MACAU = 'MO', 'Macau SAR'
    TAIWAN = 'TW', 'Taiwan'

class Employee(models.Model):
    class EmploymentType(models.TextChoices):
        FULL_TIME = 'full_time', 'Full Time'
        PART_TIME = 'part_time', 'Part Time'
        CONTRACT = 'contract', 'Contract'
        INTERN = 'INT', 'Intern'

    first_name = models.CharField(max_length=50)
    last_name = models.CharField(max_length=50)
    email = models.EmailField(unique=True)
    phone_number = models.CharField(max_length=20, blank=True, null=True)
    department = models.ForeignKey(Department, on_delete=models.PROTECT, related_name='employees')
    region = models.CharField(max_length=2, choices=Region.choices, default=Region.HONG_KONG)
    employment_type = models.CharField(max_length=10, choices=EmploymentType.choices, default=EmploymentType.FULL_TIME)
    salary = models.DecimalField(max_digits=12, decimal_places=2)
    is_active = models.BooleanField(default=True)
    hire_date = models.DateField()

    def __str__(self):
        return f"{self.first_name} {self.last_name} [{self.region}]"

class ShiftLog(models.Model):
    """Tracks clock-ins, clock-outs, and geofencing for frontline workers."""
    employee = models.ForeignKey(Employee, on_delete=models.CASCADE, related_name='shifts')
    clock_in = models.DateTimeField()
    clock_out = models.DateTimeField(null=True, blank=True)
    latitude_in = models.DecimalField(max_digits=9, decimal_places=6, null=True, blank=True)
    longitude_in = models.DecimalField(max_digits=9, decimal_places=6, null=True, blank=True)
    hours_worked = models.DecimalField(max_digits=5, decimal_places=2, default=0.00)

    def save(self, *args, **kwargs):
        if self.clock_in and self.clock_out:
            delta = self.clock_out - self.clock_in
            self.hours_worked = round(delta.total_seconds() / 3600.0, 2)
        super().save(*args, **kwargs)

class PayrollRun(models.Model):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    employee = models.ForeignKey(Employee, on_delete=models.CASCADE)
    period_start = models.DateField()
    period_end = models.DateField()
    base_pay = models.DecimalField(max_digits=12, decimal_places=2)
    overtime_pay = models.DecimalField(max_digits=12, decimal_places=2, default=0.00)
    deductions = models.DecimalField(max_digits=12, decimal_places=2, default=0.00)
    net_pay = models.DecimalField(max_digits=12, decimal_places=2)
    is_flagged = models.BooleanField(default=False)
    flag_reason = models.TextField(blank=True, null=True)
    executed_at = models.DateTimeField(auto_now_add=True)

class WorkflowRequest(models.Model):
    class RequestType(models.TextChoices):
        LEAVE = 'LEAVE', 'Leave Request'
        EXPENSE = 'EXPENSE', 'Expense Claim'
        ROSTER_CHANGE = 'ROSTER', 'Roster Change'

    class Status(models.TextChoices):
        PENDING = 'PENDING', 'Pending'
        APPROVED = 'APPROVED', 'Approved'
        REJECTED = 'REJECTED', 'Rejected'

    employee = models.ForeignKey(Employee, on_delete=models.CASCADE)
    request_type = models.CharField(max_length=10, choices=RequestType.choices)
    payload = models.JSONField(
        help_text="Custom parameters like dates, amounts, shift details"
    )
    status = models.CharField(max_length=10, choices=Status.choices, default=Status.PENDING)
    created_at = models.DateTimeField(auto_now_add=True)
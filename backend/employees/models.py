import uuid
from django.db import models
from django.utils import timezone

from audit.registry import audited

@audited
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


class EmployeeQuerySet(models.QuerySet):
    def active(self):
        return self.filter(status=Employee.Status.ACTIVE)

    def employed(self):
        return self.exclude(status=Employee.Status.TERMINATED)


@audited
class Employee(models.Model):
    class EmploymentType(models.TextChoices):
        FULL_TIME = 'full_time', 'Full Time'
        PART_TIME = 'part_time', 'Part Time'
        CONTRACT = 'contract', 'Contract'
        INTERN = 'INT', 'Intern'

    class Status(models.TextChoices):
        ACTIVE = 'active', 'Active'
        ON_LEAVE = 'on_leave', 'On leave'
        TERMINATED = 'terminated', 'Terminated'

    first_name = models.CharField(max_length=50)
    last_name = models.CharField(max_length=50)
    email = models.EmailField(unique=True)
    phone_number = models.CharField(max_length=20, blank=True, null=True)
    department = models.ForeignKey(
        Department, on_delete=models.PROTECT, related_name='employees'
    )
    region = models.CharField(
        max_length=2, choices=Region.choices, default=Region.HONG_KONG
    )
    employment_type = models.CharField(
        max_length=10,
        choices=EmploymentType.choices,
        default=EmploymentType.FULL_TIME,
    )
    salary = models.DecimalField(max_digits=12, decimal_places=2)
    hire_date = models.DateField()

    # ── Lifecycle (new) ───────────────────────────────────────────────
    status = models.CharField(
        max_length=20,
        choices=Status.choices,
        default=Status.ACTIVE,
        db_index=True,
    )
    terminated_at = models.DateField(null=True, blank=True)
    termination_reason = models.TextField(blank=True)

    # ⭐ File Upload Fields ⭐
    profile_picture = models.ImageField(
        upload_to='employees/profile_pictures/', blank=True, null=True
    )
    document = models.FileField(
        upload_to='employees/documents/', blank=True, null=True
    )

    objects = EmployeeQuerySet.as_manager()

    # Backwards-compat shim so existing `.filter(is_active=True)` calls
    # and serializers keep working during the transition.
    @property
    def is_active(self):
        return self.status != self.Status.TERMINATED

    def __str__(self):
        return f"{self.first_name} {self.last_name} [{self.region}]"


@audited
class ShiftLog(models.Model):
    employee = models.ForeignKey(
        'Employee', on_delete=models.CASCADE, related_name='attendance_logs'
    )
    clock_in = models.DateTimeField(default=timezone.now)
    clock_out = models.DateTimeField(null=True, blank=True)
    hours_worked = models.DecimalField(max_digits=5, decimal_places=2, default=0.00)

    def save(self, *args, **kwargs):
        if self.clock_in and self.clock_out:
            delta = self.clock_out - self.clock_in
            self.hours_worked = round(delta.total_seconds() / 3600.0, 2)
        super().save(*args, **kwargs)

    def __str__(self):
        return (
            f"{self.employee.first_name} - In: "
            f"{self.clock_in.strftime('%Y-%m-%d %H:%M')} | Out: "
            f"{self.clock_out.strftime('%Y-%m-%d %H:%M') if self.clock_out else 'Active'}"
        )


@audited
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


@audited
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
        help_text='Custom parameters like dates, amounts, shift details'
    )
    status = models.CharField(
        max_length=10, choices=Status.choices, default=Status.PENDING
    )
    created_at = models.DateTimeField(auto_now_add=True)


@audited
class LeaveRequest(models.Model):
    class LeaveType(models.TextChoices):
        CASUAL = 'casual', 'Casual Leave'
        MEDICAL = 'medical', 'Medical Leave'
        ANNUAL = 'annual', 'Annual Leave'

    class Status(models.TextChoices):
        PENDING = 'pending', 'Pending'
        APPROVED = 'approved', 'Approved'
        REJECTED = 'rejected', 'Rejected'

    employee = models.ForeignKey(
        'Employee', on_delete=models.CASCADE, related_name='leaves'
    )
    leave_type = models.CharField(max_length=20, choices=LeaveType.choices)
    start_date = models.DateField()
    end_date = models.DateField()
    reason = models.TextField()
    status = models.CharField(
        max_length=15, choices=Status.choices, default=Status.PENDING
    )
    applied_on = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"{self.employee.first_name} - {self.leave_type} ({self.status})"

class LeaveBalance(models.Model):
    """
    တစ်နှစ်အတွင်း ဝန်ထမ်းတစ်ယောက်ရဲ့ ခွင့်လက်ကျန်။
    entitled_days = policy အရ ရသင့်တဲ့ ရက်
    used_days = approve ဖြစ်ပြီးသား ခွင့်ရက်
    adjustment_days = admin manual ပြင်ဆင်ချက် (positive သို့မဟုတ် negative)
    available = entitled - used + adjustment
    """
    employee = models.ForeignKey(
        Employee, on_delete=models.CASCADE, related_name='leave_balances'
    )
    leave_type = models.CharField(
        max_length=20, choices=LeaveRequest.LeaveType.choices
    )
    year = models.PositiveIntegerField(db_index=True)

    entitled_days = models.DecimalField(max_digits=5, decimal_places=1, default=0)
    used_days = models.DecimalField(max_digits=5, decimal_places=1, default=0)
    adjustment_days = models.DecimalField(max_digits=5, decimal_places=1, default=0)
    adjustment_reason = models.TextField(blank=True)

    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        unique_together = ('employee', 'leave_type', 'year')
        ordering = ['employee', '-year', 'leave_type']

    @property
    def available_days(self):
        return self.entitled_days - self.used_days + self.adjustment_days

    def __str__(self):
        return (
            f"{self.employee.first_name} - {self.leave_type} "
            f"{self.year}: {self.available_days} available"
        )

class Holiday(models.Model):
    """
    Public holiday တစ်ခု။ နေ့စွဲ + region ပေါ်မူတည်ပြီး unique။
    """
    name = models.CharField(max_length=100)
    date = models.DateField(db_index=True)
    region = models.CharField(
        max_length=2,
        choices=Region.choices,
        db_index=True,
    )
    year = models.PositiveIntegerField(db_index=True)
    is_paid = models.BooleanField(default=True)
    notes = models.TextField(blank=True)

    class Meta:
        unique_together = ('date', 'region')
        ordering = ['date']
        indexes = [models.Index(fields=['region', 'year'])]

    def __str__(self):
        return f"{self.date} — {self.name} ({self.region})"

    def save(self, *args, **kwargs):
        if self.date:
            self.year = self.date.year
        super().save(*args, **kwargs)
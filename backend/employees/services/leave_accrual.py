from decimal import Decimal
from datetime import date, timedelta
from django.utils import timezone
from employees.models import Employee, LeaveBalance, LeaveRequest , Holiday


ANNUAL_ENTITLEMENT = {
    LeaveRequest.LeaveType.ANNUAL: Decimal('14.0'),
    LeaveRequest.LeaveType.CASUAL: Decimal('7.0'),
    LeaveRequest.LeaveType.MEDICAL: Decimal('14.0'),
}


def initialize_balances_for_employee(employee, year=None):
    """
    ဝန်ထမ်းတစ်ယောက်အတွက် နှစ်တစ်နှစ်ရဲ့ balance တွေ ဖန်တီး။
    ရှိပြီးသားဆိုရင် ဘာမှ မလုပ်ဘူး။
    """
    if year is None:
        year = date.today().year

    created = []
    for leave_type, entitled in ANNUAL_ENTITLEMENT.items():
        balance, was_created = LeaveBalance.objects.get_or_create(
            employee=employee,
            leave_type=leave_type,
            year=year,
            defaults={'entitled_days': entitled},
        )
        if was_created:
            created.append(balance)
    return created


def recalculate_used_days(employee, year=None):
    """
    Approve ဖြစ်ပြီးသား leave တွေကနေ used_days ကို ပြန်တွက်။
    Working days သုံး (weekend + holiday ဖယ်)။
    """
    if year is None:
        year = date.today().year

    approved = LeaveRequest.objects.filter(
        employee=employee,
        status=LeaveRequest.Status.APPROVED,
        start_date__year=year,
    )

    for leave_type in ANNUAL_ENTITLEMENT.keys():
        total_days = Decimal('0')
        for leave in approved.filter(leave_type=leave_type):
            _, working_days = calculate_working_days(
                leave.start_date, leave.end_date, region=employee.region
            )
            total_days += Decimal(str(working_days))

        LeaveBalance.objects.filter(
            employee=employee, leave_type=leave_type, year=year
        ).update(used_days=total_days)


def has_sufficient_balance(employee, leave_type, days_needed, year=None):
    """
    ခွင့်တင်ချင်တဲ့ ရက်အတွက် balance လုံလောက်လား စစ်။
    """
    if year is None:
        year = date.today().year

    balance = LeaveBalance.objects.filter(
        employee=employee, leave_type=leave_type, year=year
    ).first()

    if balance is None:
        # Auto-create လုပ်ပြီး ပြန် စစ်
        initialize_balances_for_employee(employee, year)
        balance = LeaveBalance.objects.filter(
            employee=employee, leave_type=leave_type, year=year
        ).first()

    if balance is None:
        return False, Decimal('0')

    return balance.available_days >= Decimal(str(days_needed)), balance.available_days
def calculate_working_days(start_date, end_date, region, include_weekends=False):
    """
    Weekend (Sat/Sun) နဲ့ public holiday ဖယ်ပြီး working days တွက်။
    Returns: (total_calendar_days, working_days)
    """
    if start_date > end_date:
        return 0, 0

    total_calendar_days = (end_date - start_date).days + 1

    holidays = set(
        Holiday.objects.filter(
            date__gte=start_date,
            date__lte=end_date,
            region=region,
        ).values_list('date', flat=True)
    )

    working_days = 0
    current = start_date
    while current <= end_date:
        is_weekend = current.weekday() >= 5
        is_holiday = current in holidays

        if include_weekends:
            if not is_holiday:
                working_days += 1
        else:
            if not is_weekend and not is_holiday:
                working_days += 1

        current += timedelta(days=1)

    return total_calendar_days, working_days


def get_upcoming_holidays(region, days_ahead=60):
    """လာမယ့် ရက်ပိုင်းအတွင်း holiday တွေ ပြန်ပေး။"""
    today = date.today()
    future = today + timedelta(days=days_ahead)
    return Holiday.objects.filter(
        region=region,
        date__gte=today,
        date__lte=future,
    ).order_by('date')
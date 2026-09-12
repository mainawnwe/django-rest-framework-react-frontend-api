from datetime import timedelta
from django.db.models import Sum
from .models import ShiftLog, Region

class ComplianceEngine:
    @staticmethod
    def evaluate_hk_468_rule(employee, target_date):
        """
        Enforces Hong Kong '468 Rule':
        Checks if an employee works >= 68 hours across any 4 consecutive weeks.
        """
        if employee.region != Region.HONG_KONG:
            return {"compliant": True, "reason": "Rule not applicable"}

        # Define 4 consecutive sliding weeks (28 days) prior to target_date
        start_period = target_date - timedelta(days=28)
        
        logs = ShiftLog.objects.filter(
            employee=employee,
            clock_in__gte=start_period,
            clock_out__lte=target_date
        )
        
        total_hours = logs.aggregate(total=Sum('hours_worked'))['total'] or 0.00
        
        if total_hours >= 68.0:
            return {
                "compliant": False,
                "status": "CONTINUOUS_CONTRACT_TRIGGERED",
                "total_hours": float(total_hours),
                "action": "Employee qualifies for full continuous contract statutory benefits."
            }
        
        return {
            "compliant": True,
            "status": "STANDARD_PART_TIME",
            "total_hours": float(total_hours)
        }

    @staticmethod
    def calculate_china_overtime(hours_worked, day_type="WEEKDAY"):
        """
        Mainland China Overtime Rule Engine:
        - Weekday OT: 150% rate
        - Weekend OT: 200% rate
        - Statutory Holiday OT: 300% rate
        """
        multipliers = {
            "WEEKDAY": 1.5,
            "WEEKEND": 2.0,
            "HOLIDAY": 3.0
        }
        multiplier = multipliers.get(day_type, 1.5)
        standard_hours = 8.0
        
        if hours_worked <= standard_hours:
            return {"standard_hours": hours_worked, "overtime_hours": 0.0, "multiplier": 1.0}
        
        ot_hours = hours_worked - standard_hours
        return {
            "standard_hours": standard_hours,
            "overtime_hours": ot_hours,
            "multiplier": multiplier
        }
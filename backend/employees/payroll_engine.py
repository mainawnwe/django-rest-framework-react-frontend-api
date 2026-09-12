from decimal import Decimal
from django.db.models import Avg
from .models import PayrollRun

class PayrollValidationEngine:
    @staticmethod
    def validate_payroll_execution(employee, calculated_net_pay, period_start, period_end):
        """
        Calculates baseline historical pay for the employee and flags anomalies.
        """
        historical_runs = PayrollRun.objects.filter(employee=employee).order_by('-executed_at')[:6]
        
        if not historical_runs.exists():
            # First payroll run validation
            return False, "First payroll run — manual review recommended."

        avg_historical_pay = historical_runs.aggregate(avg=Avg('net_pay'))['avg'] or Decimal('0.00')
        
        if avg_historical_pay == Decimal('0.00'):
            return False, "Baseline calculation unavailable."

        # Variance threshold check (e.g., > 35% deviation from 6-month historical average)
        variance = abs(calculated_net_pay - avg_historical_pay) / avg_historical_pay
        
        if variance > Decimal('0.35'):
            return True, f"Anomaly Detected: Calculated net pay (${calculated_net_pay}) deviates by {round(variance * 100, 2)}% from historical average (${round(avg_historical_pay, 2)})."

        return False, "Payroll validated successfully."
from django.test import TestCase
from django.utils import timezone
from datetime import timedelta
from decimal import Decimal
from .models import Employee, Department, ShiftLog, Region, PayrollRun
from .compliance import ComplianceEngine
from .payroll_engine import PayrollValidationEngine

class ComplianceAndPayrollTests(TestCase):
    def setUp(self):
        self.dept = Department.objects.create(name="Operations", code="OPS")
        self.employee = Employee.objects.create(
            first_name="Ka Wai",
            last_name="Chan",
            email="kawai.chan@company.hk",
            department=self.dept,
            region=Region.HONG_KONG,
            salary=Decimal('25000.00'),
            hire_date="2026-01-01"
        )

    def test_hk_468_rule_trigger(self):
        now = timezone.now()
        # Create 4 consecutive shifts of 18 hours each = 72 hours worked across period
        for i in range(4):
            ShiftLog.objects.create(
                employee=self.employee,
                clock_in=now - timedelta(days=(i * 6) + 1),
                clock_out=now - timedelta(days=(i * 6)) + timedelta(hours=18)
            )

        evaluation = ComplianceEngine.evaluate_hk_468_rule(self.employee, now)
        self.assertFalse(evaluation['compliant'])
        self.assertEqual(evaluation['status'], "CONTINUOUS_CONTRACT_TRIGGERED")
        self.assertGreaterEqual(evaluation['total_hours'], 68.0)

    def test_payroll_anomaly_detection(self):
        # Establish a baseline of regular pay runs
        for _ in range(3):
            PayrollRun.objects.create(
                employee=self.employee,
                period_start="2026-01-01",
                period_end="2026-01-31",
                base_pay=Decimal('25000.00'),
                net_pay=Decimal('25000.00')
            )

        # Test normal pay (no flag)
        is_flagged, reason = PayrollValidationEngine.validate_payroll_execution(
            self.employee, Decimal('26000.00'), "2026-02-01", "2026-02-28"
        )
        self.assertFalse(is_flagged)

        # Test anomalous pay jump (+80% increase)
        is_flagged, reason = PayrollValidationEngine.validate_payroll_execution(
            self.employee, Decimal('45000.00'), "2026-02-01", "2026-02-28"
        )
        self.assertTrue(is_flagged)
        self.assertIn("Anomaly Detected", reason)
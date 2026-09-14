from django.test import TestCase
from audit.models import AuditLog
from employees.models import Department, Employee
from django.utils import timezone


class AuditLogTests(TestCase):
    def test_department_create_is_logged(self):
        Department.objects.create(name="Engineering", code="ENG")
        log = AuditLog.objects.get()
        self.assertEqual(log.action, AuditLog.ACTION_CREATE)
        self.assertEqual(log.changes["after"]["code"], "ENG")

    def test_employee_status_change_is_logged(self):
        d = Department.objects.create(name="Eng", code="ENG")
        e = Employee.objects.create(
            first_name="Aung", last_name="Aung",
            email="a@test.com", department=d,
            salary=5000, hire_date=timezone.now().date(),
        )
        e.status = Employee.Status.TERMINATED
        e.save()
        log = AuditLog.objects.filter(action=AuditLog.ACTION_UPDATE).last()
        self.assertIn("status", log.changes["fields"])
        self.assertEqual(log.changes["fields"]["status"]["to"], "terminated")

    def test_is_active_property_shim(self):
        d = Department.objects.create(name="Eng", code="ENG")
        e = Employee.objects.create(
            first_name="A", last_name="B", email="ab@test.com",
            department=d, salary=1000, hire_date=timezone.now().date(),
        )
        self.assertTrue(e.is_active)          # active → True
        e.status = Employee.Status.TERMINATED
        self.assertFalse(e.is_active)         # terminated → False
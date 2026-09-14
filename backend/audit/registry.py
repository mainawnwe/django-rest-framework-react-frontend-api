from decimal import Decimal

from django.db.models.signals import post_delete, post_save, pre_save

from .context import get_current_actor, get_current_ip
from .models import AuditLog


_SKIP_FIELDS = {"created_at", "updated_at"}


def _serialize(val):
    if val is None or isinstance(val, (int, float, bool, str)):
        return val
    if isinstance(val, Decimal):
        return str(val)
    if hasattr(val, "isoformat"):
        return val.isoformat()
    return str(val)


def _snapshot(instance):
    data = {}
    for field in instance._meta.concrete_fields:
        if field.name in _SKIP_FIELDS:
            continue
        data[field.name] = _serialize(getattr(instance, field.attname, None))
    return data


def audited(model):
    """Class decorator: log create/update/delete for `model` into AuditLog."""

    def _pre_save(sender, instance, **kwargs):
        if instance.pk:
            try:
                instance._audit_old = _snapshot(
                    sender._default_manager.get(pk=instance.pk)
                )
            except sender.DoesNotExist:
                instance._audit_old = None
        else:
            instance._audit_old = None

    def _post_save(sender, instance, created, **kwargs):
        old = getattr(instance, "_audit_old", None)
        new = _snapshot(instance)

        if created:
            action, changes = AuditLog.ACTION_CREATE, {"after": new}
        else:
            diff = {
                key: {"from": (old or {}).get(key), "to": new.get(key)}
                for key in new
                if (old or {}).get(key) != new.get(key)
            }
            if not diff:
                return
            action, changes = AuditLog.ACTION_UPDATE, {"fields": diff}

        AuditLog.objects.create(
            actor=get_current_actor(),
            action=action,
            model_name=sender._meta.label,
            object_id=str(instance.pk),
            changes=changes,
            ip_address=get_current_ip(),
        )

    def _post_delete(sender, instance, **kwargs):
        AuditLog.objects.create(
            actor=get_current_actor(),
            action=AuditLog.ACTION_DELETE,
            model_name=sender._meta.label,
            object_id=str(instance.pk),
            changes={"before": _snapshot(instance)},
            ip_address=get_current_ip(),
        )

    pre_save.connect(_pre_save, sender=model, weak=False)
    post_save.connect(_post_save, sender=model, weak=False)
    post_delete.connect(_post_delete, sender=model, weak=False)
    return model
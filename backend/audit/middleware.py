from .context import set_current_actor, set_current_ip


class AuditContextMiddleware:
    def __init__(self, get_response):
        self.get_response = get_response

    def __call__(self, request):
        user = getattr(request, "user", None)
        set_current_actor(user if user and user.is_authenticated else None)
        set_current_ip(self._client_ip(request))
        try:
            return self.get_response(request)
        finally:
            set_current_actor(None)
            set_current_ip(None)

    @staticmethod
    def _client_ip(request):
        xff = request.META.get("HTTP_X_FORWARDED_FOR")
        if xff:
            return xff.split(",")[0].strip()
        return request.META.get("REMOTE_ADDR")
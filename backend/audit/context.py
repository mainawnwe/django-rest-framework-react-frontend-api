import threading

_state = threading.local()


def set_current_actor(user):
    _state.actor = user


def get_current_actor():
    return getattr(_state, "actor", None)


def set_current_ip(ip):
    _state.ip = ip


def get_current_ip():
    return getattr(_state, "ip", None)
import math
from rest_framework.decorators import api_view
from rest_framework.response import Response
from rest_framework import status
from django.utils import timezone
from .models import ShiftLog, Employee

# Standard corporate office coordinate boundary setup
OFFICE_LAT = 22.2819  # Example: Central, Hong Kong
OFFICE_LON = 114.1581
ALLOWED_RADIUS_KM = 0.5  # 500-meter radius limit

def calculate_haversine_distance(lat1, lon1, lat2, lon2):
    R = 6371.0  # Earth's radius in kilometers
    dlat = math.radians(lat2 - lat1)
    dlon = math.radians(lon2 - lon1)
    a = math.sin(dlat / 2)**2 + math.cos(math.radians(lat1)) * math.cos(math.radians(lat2)) * math.sin(dlon / 2)**2
    c = 2 * math.atan2(math.sqrt(a), math.sqrt(1 - a))
    return R * c

@api_view(['POST'])
def mobile_clock_in(request):
    """
    Geofenced mobile clock-in endpoint.
    """
    employee_id = request.data.get('employee_id')
    lat = float(request.data.get('latitude', 0.0))
    lon = float(request.data.get('longitude', 0.0))

    distance = calculate_haversine_distance(OFFICE_LAT, OFFICE_LON, lat, lon)
    if distance > ALLOWED_RADIUS_KM:
        return Response({
            "error": "Geofence violation",
            "message": f"You are {round(distance, 2)}km away from the workplace. Clock-in allowed only within {ALLOWED_RADIUS_KM}km radius."
        }, status=status.HTTP_400_BAD_REQUEST)

    shift = ShiftLog.objects.create(
        employee_id=employee_id,
        clock_in=timezone.now(),
        latitude_in=lat,
        longitude_in=lon
    )
    
    return Response({
        "message": "Clock-in successful",
        "shift_id": shift.id,
        "timestamp": shift.clock_in
    }, status=status.HTTP_201_CREATED)
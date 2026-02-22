from django.urls import path
from . import views

urlpatterns = [
    path('map/', views.race_map_view, name='race_map'),
    path('map/api/locations/all/<int:session_key>/', views.get_all_locations, name='get_locations'),
    path('map/api/drivers/<int:session_key>/', views.get_driver_names, name='get_driver_names'),
    path('map/api/intervals/<int:session_key>/', views.get_intervals, name='get_intervals'),
]
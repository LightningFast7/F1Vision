from django import path
from . import views

urlpatterns = [
    path('map/', views.race_map_view, name='race_map'),
    path('api/locations/<int:session_key>/<int:driver_number>/', views.get_driver_locations, name='get_locations'),
]
from django.urls import path
from . import views

urlpatterns = [
    path('map/', views.race_map_view, name='race_map'),
    path('map/api/locations/all/<int:session_key>/', views.get_all_locations, name='get_locations'),
]
import requests
from django.http import JsonResponse
from django.shortcuts import render

def race_map_view(request):
    # This renders your HTML page
    return render(request, 'race_map.html')

def get_driver_locations(request, session_key, driver_number):
    # Fetch data from OpenF1
    url = f"https://api.openf1.org/v1/location?session_key={session_key}&driver_number={driver_number}"
    response = requests.get(url)
    
    if response.status_code == 200:
        data = response.json()
        # You might want to filter or downsample the data here to save bandwidth
        return JsonResponse({'locations': data})
    else:
        return JsonResponse({'error': 'Failed to fetch data'}, status=500)

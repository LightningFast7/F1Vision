import json
import os
from django.conf import settings
from django.http import JsonResponse
from django.shortcuts import render

def race_map_view(request):
    # This renders your HTML page
    return render(request, 'race_map.html')

def get_driver_locations(request, session_key, driver_number):
    # Construct the path to the file we saved
    filename = f"driver_{driver_number}_session_{session_key}.json"
    filepath = os.path.join(settings.BASE_DIR, 'race_data', filename)
    
    try:
        # Open the local file and load the JSON data
        with open(filepath, 'r') as file:
            data = json.load(file)
            
        # Send it directly to your frontend
        return JsonResponse({'locations': data})
        
    except FileNotFoundError:
        return JsonResponse({'error': 'Data not downloaded yet. Run the fetch script!'}, status=404)

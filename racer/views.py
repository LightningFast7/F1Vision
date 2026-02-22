import json
import os
from django.conf import settings
from django.http import JsonResponse
from django.shortcuts import render

def race_map_view(request):
    return render(request, 'race_map.html')

def get_all_locations(request, session_key):
    print("Gate 1")
    filename = f"session_{session_key}_all.json"
    filepath = os.path.join(settings.BASE_DIR, 'race_data', filename)
    print(f'filepath: {filepath}')
    try:
        with open(filepath, 'r') as file:
            data = json.load(file)
        print("Gate 2")
        return JsonResponse({'locations': data})
        
    except FileNotFoundError:
        return JsonResponse({'error': 'Data not downloaded yet. Run the fetch script!'}, status=404)

def get_driver_names(request, session_key):
    filename = f"drivers_{session_key}.json"
    filepath = os.path.join(settings.BASE_DIR, 'race_data', filename)
    
    try:
        with open(filepath, 'r') as file:
            data = json.load(file)
        
        driver_map = {}
        
        if isinstance(data, list):
            for driver in data:
                num = str(driver.get('driver_number'))
                driver_map[num] = {
                    'last_name': driver.get('last_name', 'Driver'),
                    'team_colour': driver.get('team_colour', '444444'),
                    'team_name': driver.get('team_name', 'Independent')
                }
        else:
            num = str(data.get('driver_number'))
            driver_map[num] = {
                'last_name': data.get('last_name', 'Driver'),
                'team_colour': data.get('team_colour', '444444')
            }
            
        return JsonResponse({'drivers': driver_map})
        
    except Exception as e:
        print(f"Error in get_driver_names: {e}")
        return JsonResponse({'error': str(e)}, status=404)

def get_intervals(request, session_key):
    filename = f"intervals_{session_key}.json"
    filepath = os.path.join(settings.BASE_DIR, 'race_data', filename)
    try:
        with open(filepath, 'r') as file:
            data = json.load(file)
        
        interval_map = {}
        for entry in data:
            num = str(entry['driver_number'])
            if num not in interval_map:
                interval_map[num] = []
            interval_map[num].append({
                't':entry['date'],
                'gap': entry['gap_to_leader'],
                'int': entry['interval']
            })
        return JsonResponse({'intervals': interval_map})
    except Exception as e:
        return JsonResponse({'error': str(e)}, status=404)
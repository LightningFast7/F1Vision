import requests
import json
import os
from datetime import datetime

def download_optimized_locations(session_key):
    print(f"Fetching driver list for Session {session_key}...")
    
    drivers_url = f"https://api.openf1.org/v1/drivers?session_key={session_key}"
    drivers_data = requests.get(drivers_url).json()
    driver_numbers = list(set([driver['driver_number'] for driver in drivers_data]))
    
    # We will build a perfectly pre-calculated dictionary for the frontend
    optimized_data = {
        "bounds": {"minX": float('inf'), "maxX": float('-inf'), "minY": float('inf'), "maxY": float('-inf')},
        "time": {"start": float('inf'), "end": float('-inf')},
        "drivers": {}
    }
    
    print(f"Found {len(driver_numbers)} drivers. Compressing data...")
    
    for driver in driver_numbers:
        print(f"Processing Driver {driver}...")
        location_url = f"https://api.openf1.org/v1/location?session_key={session_key}&driver_number={driver}"
        loc_response = requests.get(location_url)
        
        if loc_response.status_code == 200:
            driver_points = []
            
            for pt in loc_response.json():
                x, y, date_str = pt.get('x'), pt.get('y'), pt.get('date')
                
                # Filter out bad GPS points immediately
                if x is not None and y is not None and x != 0 and y != 0:
                    
                    # Convert the text date into a simple integer (milliseconds)
                    # The F1 API format ends in 'Z', which Python's fromisoformat handles if replaced with '+00:00'
                    dt = datetime.fromisoformat(date_str.replace('Z', '+00:00'))
                    ts_ms = int(dt.timestamp() * 1000)
                    
                    # Add as a tiny array [x, y, time] instead of a huge dictionary
                    driver_points.append([x, y, ts_ms])
                    
                    # Pre-calculate track boundaries and global time
                    if x < optimized_data["bounds"]["minX"]: optimized_data["bounds"]["minX"] = x
                    if x > optimized_data["bounds"]["maxX"]: optimized_data["bounds"]["maxX"] = x
                    if y < optimized_data["bounds"]["minY"]: optimized_data["bounds"]["minY"] = y
                    if y > optimized_data["bounds"]["maxY"]: optimized_data["bounds"]["maxY"] = y
                    if ts_ms < optimized_data["time"]["start"]: optimized_data["time"]["start"] = ts_ms
                    if ts_ms > optimized_data["time"]["end"]: optimized_data["time"]["end"] = ts_ms

            # Sort the driver's points by time just to be safe
            driver_points.sort(key=lambda p: p[2])
            optimized_data["drivers"][str(driver)] = driver_points

    # Save over the exact same file name so we don't have to change Django's views.py!
    os.makedirs('race_data', exist_ok=True)
    filepath = os.path.join('race_data', f"session_{session_key}_all.json")
    
    with open(filepath, 'w') as file:
        json.dump(optimized_data, file)
        
    print(f"\nSUCCESS: Optimized data saved to {filepath}!")

download_optimized_locations(9094)
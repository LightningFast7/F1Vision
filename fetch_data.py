import requests
import json
import os

def download_driver_location(session_key):
    print(f"Fetching data for Session {session_key}...")
    
    # 1. Ping the OpenF1 API
    url = f"https://api.openf1.org/v1/drivers?session_key={session_key}"
    response = requests.get(url)
    
    if response.status_code != 200:
        print(f"Failed to get the drivers list: Status: {response.status}")
    drivers_list = response.json()
        
    driver_numbers = list(set([driver['driver_number'] for driver in drivers_list]))
    print('Gate 1')

    locations = []

    for number in driver_numbers:
        print(f"Fetching locations for driver {number}")
        location_url = f"https://api.openf1.org/v1/location?session_key={session_key}&driver_number={number}"
        
        locations_info = requests.get(location_url)

        if locations_info.status_code == 200:
            driver_locations = locations_info.json()
            locations.extend(driver_locations)
            print(f"dowloaded {len(driver_locations)} points")
        else:
            print(f"Failed to get driver {number} locations. Status code: {locations_info.status_code}")
    os.makedirs('race_data', exist_ok=True)
    filepath = os.path.join('race_data', f"session_{session_key}_all.json")

    with open(filepath, 'w') as file:
        json.dump(locations, file)
    
    print(f"\n Finished generating the results of {len(locations)} location points to {filepath}")

download_driver_location(9094)
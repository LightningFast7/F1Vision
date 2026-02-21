import requests
import json
import os

def download_driver_location(session_key, driver_number):
    print(f"Fetching data for Driver {driver_number}...")
    
    # 1. Ping the OpenF1 API
    url = f"https://api.openf1.org/v1/location?session_key={session_key}&driver_number={driver_number}"
    response = requests.get(url)
    
    if response.status_code == 200:
        data = response.json()
        
        # 2. Ensure the race_data directory exists
        os.makedirs('race_data', exist_ok=True)
        
        # 3. Create a clean filename
        filename = f"driver_{driver_number}_session_{session_key}.json"
        filepath = os.path.join('race_data', filename)
        
        # 4. Save the data to a local JSON file
        with open(filepath, 'w') as file:
            json.dump(data, file)
            
        print(f"Success! Saved {len(data)} location points to {filepath}")
    else:
        print(f"Failed to fetch data. Error: {response.status_code}")

# Example: Run it for Fernando Alonso (14) at the 2023 Monaco GP (9078)
download_driver_location(9094, 14)
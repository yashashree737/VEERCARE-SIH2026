import json
import os
import urllib.request

BASE_URL = "http://127.0.0.1:8000"

def fetch(path):
    url = f"{BASE_URL}{path}"
    try:
        req = urllib.request.Request(url)
        with urllib.request.urlopen(req) as response:
            if response.status == 200:
                return json.loads(response.read().decode('utf-8'))
    except Exception as e:
        print(f"Error fetching {path}: {e}")
    return None

def dump_all_data():
    data = {}
    
    # 1. Aggregate API Endpoints
    print("Fetching aggregate endpoints...")
    data["units"] = fetch("/api/units")
    data["summary"] = fetch("/api/summary")
    data["watchlist"] = fetch("/api/watchlist")
    data["wall"] = fetch("/api/wall")
    data["interventions"] = fetch("/api/interventions")
    data["model_metrics"] = fetch("/api/model/metrics")
    data["case_notes"] = fetch("/api/case-notes")
    
    # 2. Extract personnel IDs from watchlist / DB
    pids = ["P1001", "P1002", "P1003", "C1001", "W1001", "HR-001"]
    if data["watchlist"] and "results" in data["watchlist"]:
        for item in data["watchlist"]["results"]:
            if item["personnel_id"] not in pids:
                pids.append(item["personnel_id"])
                
    print(f"Fetching personnel specific endpoints for IDs: {pids}...")
    data["personnel_data"] = {}
    for pid in pids:
        data["personnel_data"][pid] = {
            "detail": fetch(f"/api/personnel/{pid}"),
            "roster": fetch(f"/api/personnel/{pid}/roster"),
            "telemetry": fetch(f"/api/personnel/{pid}/telemetry"),
            "drivers": fetch(f"/api/personnel/{pid}/drivers"),
            "strain_breakdown": fetch(f"/api/personnel/{pid}/strain-breakdown"),
            "history": fetch(f"/api/personnel/{pid}/history"),
        }
        
    # Write output to cleaned_data2.json
    output_path = os.path.join(os.path.dirname(os.path.dirname(__file__)), "cleaned_data2.json")
    with open(output_path, "w", encoding="utf-8") as f:
        json.dump(data, f, indent=2)
        
    print(f"Successfully exported all frontend visible data to {output_path}")

if __name__ == "__main__":
    dump_all_data()

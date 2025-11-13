#!/usr/bin/env python3
"""
Fetch data from private Google Sheet and convert to JSON for widget consumption
"""

import json
import gspread
from google.oauth2.service_account import Credentials

# Configuration
CREDENTIALS_FILE = "credentials.json"
SHEET_ID = "1uZuWup1L7uwQjb-7SyKLw0zzJ30W9a4Kz9iIi8LISgY"
SHEET_TAB = "MaritimeReport_Data"
OUTPUT_FILE = "maritime-data.json"

def fetch_sheet_data():
    """Fetch data from Google Sheet"""
    print(f"Authenticating with Google Sheets API...")
    
    scope = [
        'https://spreadsheets.google.com/feeds',
        'https://www.googleapis.com/auth/drive'
    ]
    
    credentials = Credentials.from_service_account_file(CREDENTIALS_FILE, scopes=scope)
    gc = gspread.authorize(credentials)
    
    print(f"Opening spreadsheet: {SHEET_ID}")
    spreadsheet = gc.open_by_key(SHEET_ID)
    worksheet = spreadsheet.worksheet(SHEET_TAB)
    
    print(f"Reading data from tab: {SHEET_TAB}")
    all_values = worksheet.get_all_values()
    
    return all_values

def parse_sheet_data(rows):
    """Parse sheet data into structured JSON"""
    print("Parsing sheet data...")
    
    data = {
        "totalJobs": 0,
        "californiaJobs": 0,
        "lastUpdated": "",
        "topCities": [],
        "topJobs": [],
        "topCompanies": []
    }
    
    current_section = None
    
    for row in rows:
        # Skip empty rows
        if not row or all(not cell for cell in row):
            continue
        
        section = row[0] if len(row) > 0 else ""
        metric = row[1] if len(row) > 1 else ""
        value = row[2] if len(row) > 2 else ""
        
        # Parse Summary section
        if section == "Summary":
            if metric == "Total Active Job Openings":
                data["totalJobs"] = int(value) if value.isdigit() else 0
                print(f"  Total Jobs: {data['totalJobs']}")
            elif metric == "Job Openings in California":
                data["californiaJobs"] = int(value) if value.isdigit() else 0
                print(f"  CA Jobs: {data['californiaJobs']}")
            elif metric == "Last Updated":
                data["lastUpdated"] = value
                print(f"  Last Updated: {value}")
        
        # Identify section headers
        elif section == "Section":
            if metric == "City":
                current_section = "cities"
                print("  Entering cities section...")
            elif metric == "Job Title":
                current_section = "jobs"
                print("  Entering jobs section...")
            elif metric == "Company Name":
                current_section = "companies"
                print("  Entering companies section...")
        
        # Parse data rows
        elif current_section == "cities" and section == "CA Cities":
            if len(data["topCities"]) < 10:
                data["topCities"].append({
                    "name": metric,
                    "count": int(value) if value.isdigit() else 0
                })
        
        elif current_section == "jobs" and section == "Top Jobs":
            if len(data["topJobs"]) < 10:
                pay_range = row[3] if len(row) > 3 else ""
                data["topJobs"].append({
                    "title": metric,
                    "count": int(value) if value.isdigit() else 0,
                    "payRange": pay_range
                })
        
        elif current_section == "companies" and section == "Top Companies":
            if len(data["topCompanies"]) < 10:
                data["topCompanies"].append({
                    "name": metric,
                    "count": int(value) if value.isdigit() else 0
                })
    
    print(f"Parsed: {len(data['topCities'])} cities, {len(data['topJobs'])} jobs, {len(data['topCompanies'])} companies")
    
    return data

def save_json(data, filename):
    """Save data as JSON file"""
    print(f"Saving to {filename}...")
    
    with open(filename, 'w', encoding='utf-8') as f:
        json.dump(data, f, indent=2, ensure_ascii=False)
    
    print(f"✅ Data saved successfully!")

def main():
    try:
        # Fetch data from Google Sheet
        rows = fetch_sheet_data()
        
        # Parse into structured format
        data = parse_sheet_data(rows)
        
        # Save as JSON
        save_json(data, OUTPUT_FILE)
        
        print(f"\n✅ Success! {OUTPUT_FILE} is ready for the widget.")
        
    except Exception as e:
        print(f"\n❌ Error: {e}")
        raise

if __name__ == "__main__":
    main()

import pandas as pd
import json

file_path = "DEPT WISE DIAGNOSIS LIST 2026.xlsx"
df = pd.read_excel(file_path)

# Let's inspect all non-null values in the second column to find headers
col_name = df.columns[1]

output = {}
current_dept = "General"

for val in df[col_name].dropna():
    val_str = str(val).strip()
    
    # Check if this is a department header
    if "DEPARTMENT" in val_str.upper() or val_str.upper() in ["SURGERY", "OPTHAL", "OBG & GYNAECOLOGY"]:
        current_dept = val_str.split("–")[0].split("-")[0].replace("DEPARTMENT", "").strip().title()
        if current_dept not in output:
            output[current_dept] = []
        continue
    
    # skip useless rows
    if val_str.lower() in ["diagnosis", "procedure", "condition", "gender", "type of surgery", "bottom of form", "top of form"]: 
        continue
    if any(char.isdigit() for char in val_str[:2]) and "years" in val_str.lower(): 
        continue
    if val_str.upper() in ["MAJOR", "MINOR", "MAJOR / MINOR", "MAJOR / MINOR / DAYCARE", "MINOR / DAY CARE", "MINOR ( ONLY MALE PATIENT)", "MINOR / DAY CARE / PEAD", "MINOR / DAY CARE /PEAD"]:
        continue
        
    if len(val_str) > 3:
        if current_dept not in output:
            output[current_dept] = []
        output[current_dept].append(val_str)

# Clean up lists
for dept in output:
    output[dept] = sorted(list(set(output[dept])))

with open("lib/diagnoses.json", "w", encoding="utf-8") as f:
    json.dump(output, f, indent=2)

print("Departments found:", list(output.keys()))

import json
import shutil
import sys
from datetime import datetime
import os

def generate_unique_id(existing_ids):
    current_date = datetime.now().strftime('%y%m%d')
    for i in range(1, 100):
        new_id = f"{current_date} {str(i).zfill(2)} 0"
        if new_id not in existing_ids:
            return new_id
    return None

def backup_file(file_path):
    timestamp = datetime.now().strftime('%Y%m%d_%H%M%S')
    file_name, file_extension = os.path.splitext(file_path)
    backup_path = f"{file_name}_{timestamp}{file_extension}"
    shutil.copyfile(file_path, backup_path)

def merge_json_files(file1, file2):
    with open(file1, "r", encoding="utf-8") as f:
        data1 = json.load(f)

    with open(file2, "r", encoding="utf-8") as f:
        data2 = json.load(f)

    for section in ["inaktiv", "aktiv"]:
        for id, data in data1[section].items():
            if id in data2[section]:
                if data[0] != data2[section][id][0]:
                    existing_ids = set(data1["inaktiv"]).union(set(data1["aktiv"])).union(set(data2["inaktiv"])).union(set(data2["aktiv"]))
                    new_id = generate_unique_id(existing_ids)
                    data2[section][new_id] = data
                    data2["changed"].remove(id)
                    data2["changed"].append(new_id)
                elif data[7] > data2[section][id][7]:
                    data2[section][id] = data
            else:
                data2[section][id] = data

    for id, data in data1["inaktiv"].items():
        if id in data2["aktiv"]:
            del data2["inaktiv"][id]

    changed_ids = list(set(data1["changed"]).union(set(data2["changed"])))
    data2["changed"] = changed_ids

    backup_file(file1)
    backup_file(file2)

    with open(file1, "w", encoding="utf-8") as f:
        json.dump(data2, f, ensure_ascii=False, indent=4)

    shutil.copyfile(file1, file2)

if __name__ == "__main__":
    if len(sys.argv) != 3:
        print("Usage: python merge_json.py <file1> <file2>")
        sys.exit(1)

    file1 = sys.argv[1]
    file2 = sys.argv[2]
    merge_json_files(file1, file2)

import json
import shutil
import sys
from datetime import datetime
import os


def generate_unique_id(existing_ids):
    """
    Generates a unique ID based on the current date and a sequence number.
    The unique ID is in the format of 'yymmdd XX 0', where XX is a zero-padded
    number between 01 and 99.
    
    :param existing_ids: A set of IDs that already exist to avoid duplicates.
    :return: A unique ID string or None if it can't generate a new unique ID.
    """
    current_date = datetime.now().strftime('%y%m%d')
    for i in range(1, 100):
        new_id = f"{current_date}{str(i).zfill(2)}0"
        if new_id not in existing_ids:
            return new_id
    return None


def backup_file(file_path):
    """
    Creates a backup of the given file with a timestamp.

    :param file_path: Path to the file that needs to be backed up.
    """
    timestamp = datetime.now().strftime('%Y%m%d_%H%M%S')
    file_name, file_extension = os.path.splitext(file_path)
    backup_path = f"{file_name}_{timestamp}{file_extension}"
    shutil.copyfile(file_path, backup_path)


def merge_json_files(file1, file2):
    """
    Merges customer entries from two JSON files (file1 and file2) and
    synchronizes them. Updates file1 with the resulting data and copies it to
    file2 as a backup measure. Each file is backed up before modification.

    :param file1: Path to the first input JSON file.
    :param file2: Path to the second input JSON file.
    """
    with open(file1, "r", encoding="utf-8") as f:
        data1 = json.load(f)

    with open(file2, "r", encoding="utf-8") as f:
        data2 = json.load(f)

    existing_ids = set().union(
        data1.get("inaktiv", {}),
        data1.get("aktiv", {}),
        data2.get("inaktiv", {}),
        data2.get("aktiv", {})
    )

    # Merge the 'inaktiv' and 'aktiv' sections from data1 to data2
    for section in ["inaktiv", "aktiv"]:
        for id, data in data1[section].items():
            if id in data2[section]:
                if data[0] != data2[section][id][0]:
                    new_id = generate_unique_id(existing_ids)
                    if new_id:
                        data2[section][new_id] = data
                        data2["changed"].append(new_id)
                    else:
                        raise Exception("Unable to generate a new unique ID.")
                elif data[7] > data2[section][id][7]:
                    data2[section][id] = data
            else:
                data2[section][id] = data

    # Handle any 'inaktiv' customers that became 'aktiv'
    for id in list(data1["inaktiv"].keys()):
        if id in data2["aktiv"]:
            del data1["inaktiv"][id]

    # Merge 'changed' section
    changed_ids = list(set(data1.get("changed", [])).union(data2.get("changed", [])))
    data2["changed"] = changed_ids

    backup_file(file1)
    backup_file(file2)

    # Write merged data back to file1 and copy to file2
    with open(file1, "w", encoding="utf-8") as f:
        json.dump(data2, f, ensure_ascii=False, indent=4)

    shutil.copyfile(file1, file2)


if __name__ == "__main__":
    if len(sys.argv) != 3:
        print("Usage: python merge.py <file1> <file2>")
        sys.exit(1)

    file1 = sys.argv[1]
    file2 = sys.argv[2]
    merge_json_files(file1, file2)

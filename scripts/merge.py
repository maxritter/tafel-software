"""
    This script merges the customer entries in two JSON files to synchronize them, 
    as they both have been generated offline at different timestamps.
"""

import json
import shutil
import sys
from datetime import datetime
import os



def generate_unique_id(existing_ids):
    """
    Generates a unique ID based on the current date and a sequence number.
    The unique ID is in the format of 'yymmddXXX', 
    where XXX is a zero-padded number between 001 and 999.
    
    :param existing_ids: A set of IDs that already exist to avoid duplicates.
    :return: A unique ID string or None if it can't generate a new unique ID.
    """
    current_date = datetime.now().strftime('%y%m%d')
    for i in range(1, 999):
        new_id = f"{current_date}{str(i).zfill(3)}"
        if new_id not in existing_ids:
            print(f"Generated new ID: {new_id}")
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


def merge_json_files(file_path1, file_path2):
    with open(file_path1, 'r', encoding='utf-8') as file:
        data1 = json.load(file)

    with open(file_path2, 'r', encoding='utf-8') as file:
        data2 = json.load(file)

    # Reset 'changed' list for each merge operation
    data1['changed'] = []

    # Check and merge data in 'aktiv' section of file2 with file1
    for aktiv_id, aktiv_values in data2.get('aktiv', {}).items():
        # If an 'aktiv' entry is either new or has a newer last visit date
        if aktiv_id not in data1['aktiv'] or aktiv_values[7] > data1['aktiv'].get(aktiv_id, [])[7]:
            # Remove from 'inaktiv' in file1 if it exists there
            data1['inaktiv'].pop(aktiv_id, None)
            # Add or update the 'aktiv' entry in file1
            data1['aktiv'][aktiv_id] = aktiv_values
            # Note the change in the 'changed' list
            data1['changed'].append(aktiv_id)

    # Check and merge data in 'inaktiv' section of file2 with file1
    for inaktiv_id, inaktiv_values in data2.get('inaktiv', {}).items():
        # Only consider 'inaktiv' IDs that don't have an 'aktiv' entry or have a newer last visit date
        if (inaktiv_id not in data1['aktiv']) and (inaktiv_id not in data1['inaktiv'] or inaktiv_values[7] > data1['inaktiv'][inaktiv_id][7]):
            # Add or update the 'inaktiv' entry in file1
            data1['inaktiv'][inaktiv_id] = inaktiv_values
            # Note the change in the 'changed' list
            if inaktiv_id not in data1['changed']:
                data1['changed'].append(inaktiv_id)

    # Ensure 'changed' list has unique values
    data1['changed'] = list(set(data1['changed']))

    backup_file(file_path1)
    backup_file(file_path2)

    # Write merged data back to file1 and copy to file2
    with open(file_path1, "w", encoding="utf-8") as f:
        json.dump(data2, f, ensure_ascii=False, indent=4)

    shutil.copyfile(file_path1, file_path2)


if __name__ == "__main__":
    if len(sys.argv) != 3:
        print("Usage: python merge.py <json1> <json2>")
        sys.exit(1)

    json1 = sys.argv[1]
    json2 = sys.argv[2]
    merge_json_files(json1, json2)

import pandas as pd
import json
import sys
from collections import defaultdict
import os
from datetime import datetime


# Helper function to create a backup of the original file
def backup_original_file(filename):
    timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
    new_filename = f"{filename.rsplit('.', 1)[0]}_{timestamp}.json"
    os.rename(filename, new_filename)


# Function to read and process the JSON files
def process_json_files(filenames):
    merged_data = []
    statistics = defaultdict(lambda: defaultdict(int))
    changed_ids_sets = []

    # Go through each filename provided
    for filename in filenames:
        with open(filename, "r", encoding="utf-8") as f:
            data = json.load(f)

            # Collect statistics
            for status in ["inaktiv", "aktiv"]:
                statistics[filename][status] += len(data.get(status, {}))
                statistics[filename]["total"] += len(data.get(status, {}))
            statistics[filename]["changed"] += len(data.get("changed", []))

            # Collect the set of changed ids for preference in deduplication
            changed_ids = set(data.get("changed", []))
            changed_ids_sets.append(changed_ids)

            # Process entries
            for status in ["inaktiv", "aktiv"]:
                entries = data.get(status, {})
                merged_data.extend(
                    [
                        parse_visitor(visitor_id, details, status, changed_ids)
                        for visitor_id, details in entries.items()
                    ]
                )

    combined_changed_ids = set.union(*changed_ids_sets) if changed_ids_sets else set()
    return merged_data, statistics, combined_changed_ids


# Function to deduplicate entries
def deduplicate_entries(df, field):
    def get_preferred_entry(group):
        # Sort the group by 'last' date in descending order (newest first)
        sorted_group = group.sort_values(by="last", ascending=False)
        # Get the first entry which will have the newest 'last' date
        newest_entry = sorted_group.iloc[0]

        # If there are any entries with the 'changed' attribute and the same 'last' date as the newest entry, prefer those
        if newest_entry["last"] in sorted_group[sorted_group["changed"]]["last"].values:
            preferred_entry = sorted_group[sorted_group["changed"]].iloc[0]
        else:
            preferred_entry = newest_entry

        # Check if all attributes are the same, then return the first entry without warning
        if group.drop(columns=["last", "changed"]).nunique(dropna=False).max() == 1:
            return group.iloc[0]

        return preferred_entry

    # Apply the preference logic to each group and reset the index
    deduplicated_df = (
        df.groupby(field, as_index=False)
        .apply(get_preferred_entry)
        .reset_index(drop=True)
    )
    return deduplicated_df


# Function to create structured JSON output
def create_structured_json(df, filename, changed_ids_set):
    structured_data = {"inaktiv": {}, "aktiv": {}, "changed": list(changed_ids_set)}
    for _, row in df.iterrows():
        structured_data[row["status"]][row["id"]] = [
            row["name"],
            row["address"],
            row["adults"],
            row["kids"],
            row["group"],
            row["color"],
            row["valid"],
            row["last"],
            row["child1"],
            row["child2"],
            row["child3"],
            row["child4"],
            row["note1"],
            row["note2"],
            row["note3"],
            row["note4"],
        ]
    with open(filename, "w", encoding="utf-8") as f:
        json.dump(structured_data, f, ensure_ascii=False, indent=2)


# Helper function to parse visitor details and return a dictionary
def parse_visitor(visitor_id, details, status, changed_ids):
    return {
        "id": visitor_id,
        "name": details[0],
        "address": details[1],
        "status": status,
        "changed": visitor_id in changed_ids,
        "adults": details[2],
        "kids": details[3],
        "group": details[4],
        "color": details[5],
        "valid": details[6],
        "last": details[7],
        "child1": details[8],
        "child2": details[9],
        "child3": details[10],
        "child4": details[11],
        "note1": details[12],
        "note2": details[13],
        "note3": details[14],
        "note4": details[15],
    }


# Main function to execute the script
def main():
    # Parse command line arguments for JSON filenames
    filenames = sys.argv[1:]

    # Process JSON files and merge data
    merged_data, stats_before, combined_changed_ids = process_json_files(filenames)
    df = pd.DataFrame(merged_data)

    # Deduplicate by 'id' and 'last'
    df = deduplicate_entries(df, "id")

    # Deduplicate by 'name' and 'last'
    df = deduplicate_entries(df, "name")

    # Print statistics before operations
    for filename in filenames:
        print(f"\nStatistics for {filename} before merging and deduplication:")
        print(f"aktiv: {stats_before[filename]['aktiv']}")
        print(f"inaktiv: {stats_before[filename]['inaktiv']}")
        print(f"total: {stats_before[filename]['total']}")
        print(f"changed: {stats_before[filename]['changed']}")

    # Backup original files
    for filename in filenames:
        backup_original_file(filename)

    # Create structured JSON output and overwrite original files
    for filename in filenames:
        create_structured_json(df, filename, combined_changed_ids)

    # Collect statistics after deduplication
    stats_after = {
        "aktiv": df[df["status"] == "aktiv"].shape[0],
        "inaktiv": df[df["status"] == "inaktiv"].shape[0],
        "changed": df[df["changed"]].shape[0],
        "total": df.shape[0],
    }

    # Print statistics after operations
    print("\nStatistics for merged data after merging and deduplication:")
    print(f"aktiv: {stats_after['aktiv']}")
    print(f"inaktiv: {stats_after['inaktiv']}")
    print(f"total: {stats_after['total']}")
    print(f"changed: {stats_after['changed']}")


# Check to ensure we are running as a script
if __name__ == "__main__":
    main()

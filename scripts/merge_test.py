import sys
import os
import shutil
import json
from datetime import datetime
from unittest.mock import patch
from unittest import TestCase

# Import the merge_json_files function from your script
current_dir = os.getcwd()
sys.path.append(current_dir)
from merge import merge_json_files

class TestMergeJSONFiles(TestCase):
    def setUp(self):
        # Define the expected merged data
        self.case_1_exptected = {
                "inaktiv": {
                    "210207010": [
                        "Irmgard, Hans Peter",
                        "Musterstr. 23, 98765 Musterhausen",
                        "2",
                        "3",
                        "A",
                        "rot",
                        "2022-02-22",
                        "2022-01-01",
                        "2016w",
                        "2018m",
                        "2019w",
                        "",
                        "",
                        "",
                        "geht nach München",
                        "GS"
                    ]
                },
                "aktiv": {
                    "171010014": [
                        "Hans-Wurscht, Max",
                        "Musterstrasse 4, 12345 Test",
                        "2",
                        "0",
                        "A",
                        "grün",
                        "2024-06-25",
                        "2023-12-12",
                        "",
                        "",
                        "",
                        "",
                        "",
                        "",
                        "geimpft",
                        "GS"
                    ]
                },
                "changed": [
                    "2020020401"
                ]
            }

        self.case_2_exptected = {
                "inaktiv": {},
                "aktiv": {
                    "210207010": [
                        "Irmgard, Hans Peter",
                        "Musterstr. 23, 98765 Musterhausen",
                        "2",
                        "3",
                        "A",
                        "rot",
                        "2023-06-30",
                        "2023-01-02",
                        "2016w",
                        "2018m",
                        "2019w",
                        "",
                        "",
                        "",
                        "geht nach Berlin", 
                        "GS"
                    ]
                },
                "changed": [
                    "210207010"
                ]
            }


    def test_merge_with_updates(self):
        # Define the path to the sample JSON files
        json1_path = "./test_in/case1_customer1.json"
        json2_path = "./test_in/case1_customer2.json"

        # Create a temporary directory to store the copied JSON files
        out_dir = "./test_out"
        
        # Copy the sample JSON files to the out directory
        shutil.copyfile(json1_path, os.path.join(out_dir, "case1_customer1.json"))
        shutil.copyfile(json2_path, os.path.join(out_dir, "case1_customer2.json"))

        # Patch the datetime.now() function to return a fixed timestamp
        fixed_timestamp = datetime(2022, 6, 1, 12, 0, 0)
        with patch("merge.datetime") as mock_datetime:
            mock_datetime.now.return_value = fixed_timestamp

            # Call the merge_json_files function
            merge_json_files(
                os.path.join(out_dir, "case1_customer1.json"),
                os.path.join(out_dir, "case1_customer2.json"),
            )

        # Read the merged JSON file and assert its contents
        with open(os.path.join(out_dir, "case1_customer1.json"), "r", encoding="utf-8") as f:
            merged_data = json.load(f)

        self.assertDictEqual(merged_data, self.case_1_exptected)

    def test_merge_inaktiv_to_aktiv(self):
        # Define the path to the sample JSON files
        json1_path = "./test_in/case2_customer1.json"
        json2_path = "./test_in/case2_customer2.json"

        # Create a temporary directory to store the copied JSON files
        out_dir = "./test_out"
        
        # Copy the sample JSON files to the out directory
        shutil.copyfile(json1_path, os.path.join(out_dir, "case2_customer1.json"))
        shutil.copyfile(json2_path, os.path.join(out_dir, "case2_customer2.json"))

        # Patch the datetime.now() function to return a fixed timestamp
        fixed_timestamp = datetime(2022, 6, 1, 12, 0, 0)
        with patch("merge.datetime") as mock_datetime:
            mock_datetime.now.return_value = fixed_timestamp

            # Call the merge_json_files function
            merge_json_files(
                os.path.join(out_dir, "case2_customer1.json"),
                os.path.join(out_dir, "case2_customer2.json"),
            )

        # Read the merged JSON file and assert its contents
        with open(os.path.join(out_dir, "case2_customer1.json"), "r", encoding="utf-8") as f:
            merged_data = json.load(f)

        self.assertDictEqual(merged_data, self.case_2_exptected)
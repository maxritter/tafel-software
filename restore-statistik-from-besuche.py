import glob
import os
import json
from datetime import datetime

def check_nul_characters(file):
    with open(file, 'rb') as f:
        content = f.read()
        return all(byte == 0 for byte in content)
    
def check_separator(file, separator):
     with open(file, 'r') as f:
            for line in f:
                 return line.count(separator) == 6

def check_semicolon_num(file):
         with open(file, 'r') as f:
            for line in f:
                 return line.count(';') > 0 and line.count(';') != 6

def fix_separator_date_format(file, separator):
    new_file_content = ''
    with open(file, 'r') as f:
        for line in f:
            parts = line.split(separator)
            parts[0] = parts[0].replace('"', '')
            if is_date_string_valid(parts[0], '%Y-%m-%d'):
                new_date = datetime.strptime(parts[0], '%Y-%m-%d').strftime('%Y-%m-%d') # padding might be missing
                new_file_content = f'"{new_date}",{parts[1]},{parts[2]},{parts[3]},{parts[4]},{parts[5]},{parts[6]}'
            elif is_date_string_valid(parts[0], '%d.%m.%Y'):
                new_date = datetime.strptime(parts[0], '%d.%m.%Y').strftime('%Y-%m-%d')
                new_file_content = f'"{new_date}",{parts[1]},{parts[2]},{parts[3]},{parts[4]},{parts[5]},{parts[6]}'

    if new_file_content != '':
        with open(file, 'w') as f:
            f.write(new_file_content)

def compare_reconstructable_numbers(original, reconstructed):
    parts_original = original.strip().split(',')
    parts_reconstructed = reconstructed.strip().split(',')
    return parts_reconstructed[4] == parts_original[4] and parts_reconstructed[5] == parts_original[5] and parts_reconstructed[6] == parts_original[6]

def check_reconstruction_success(reconstructed):
    parts_reconstructed = reconstructed.strip().split(',')
    return parts_reconstructed[4] != '0' and parts_reconstructed[5] != '0' and parts_reconstructed[6] != '0'


def extract_date_from_filename(filename):
    return datetime.strptime(filename[:10], '%Y-%m-%d')

def check_date_in_range(date, start_date, end_date):
    return start_date <= date <= end_date

def is_date_string_valid(date_string, format_string):
    try:
        datetime.strptime(date_string, format_string)
        return True
    except ValueError:
        return False

def extract_date_from_key(key):
    # check if key starts with 2016, 2017, 2018, 2019, 2020, 2021 <-- different IDs back then
    if key.startswith('2016') or key.startswith('2017') or key.startswith('2018') or key.startswith('2019') or key.startswith('2020') or key.startswith('2021'):
        date_str = key[:8]

        if is_date_string_valid(date_str, '%Y%m%d'):
            return datetime.strptime(date_str, '%Y%m%d')
        elif is_date_string_valid(date_str, '%Y%d%m'):
            return datetime.strptime(date_str, '%Y%d%m')

    else:
        # e.g. 31.12.23 --> 2023-12-31
        return datetime.strptime(key[:6], '%y%m%d')

def process_file(date, people):
    berechtigt_gesamt, berechtigt_erwachsen, berechtigt_kind = 0, 0, 0
    
    keys = people.keys()
    
    for key in keys:

        date_registration = extract_date_from_key(key)
        date_valid_until = datetime.strptime(people[key][6], "%Y-%m-%d")

        # check if the date is in the range
        try:
            is_date_in_range = check_date_in_range(date, date_registration, date_valid_until)
            if is_date_in_range:
                entry_berechtigt_erwachsen = int(people[key][2])
                entry_berechtig_kind = int(people[key][3])

                berechtigt_erwachsen += entry_berechtigt_erwachsen
                berechtigt_kind += entry_berechtig_kind
                berechtigt_gesamt += 1

        # print the error message if the date is not in the range
        except ValueError as e:
            print(e)
    
    return berechtigt_gesamt, berechtigt_erwachsen, berechtigt_kind


# create a main function
def main():
    # find files of the pattern yyyy-mm-dd-statistik.csv in the current directory
    files = glob.glob('*-statistik.csv')

    corrupted_files = {
        'separator_semicolon': [], # only formatting needed
        'separator_tab': [], 
        'seperator_num': [], # reconstruction needed
        'nul_character': [], # reconstruction needed
    }

    for file in files:
        if check_nul_characters(file):
            corrupted_files['nul_character'].append(file)

        if check_separator(file, ';'):
            corrupted_files['separator_semicolon'].append(file)

        if check_separator(file, '\t'):
            corrupted_files['separator_tab'].append(file)

        if check_semicolon_num(file):
            corrupted_files['seperator_num'].append(file)
        
    print(json.dumps(corrupted_files, indent=4))


    # Fix separator and date format
    for file in corrupted_files['separator_semicolon']:
        fix_separator_date_format(file, ';')

    for file in corrupted_files['separator_tab']:
        fix_separator_date_format(file, '\t')

    print(f'Fixed {len(corrupted_files["separator_semicolon"]) + len(corrupted_files["separator_tab"])} files with wrong separator and date format\n=====================')

    # Check existing files match reconstruction method
    for file in files:
        # if file in corrupted_files['seperator_num'] or file in corrupted_files['nul_character']:
        #     continue

        berechtigt_gesamt, berechtigt_erwachsen, berechtigt_kind = 0, 0, 0
        besucher_gesamt, besucher_erwachsen, besucher_kind = 0, 0, 0

        date = extract_date_from_filename(file)

        # open JSON file ./conf/maisach.json in read mode
        #with open('./conf/maisach.json', 'r') as f:
            # read the file
            #content = f.read()

            # convert the file content to a dictionary
            #data = json.loads(content)

            # This approach didn't deliver correct results
            # berechtigt_gesamt, berechtigt_erwachsen, berechtigt_kind = process_file(date, {**data['aktiv']})
                    
        # open Besuche.csv in read mode and iterate over its lines

        with open('Besuche.csv', 'r') as f:
            next(f)  # Skip the first line (header)
            for line in f:

                parts = line.replace('"', '').split(',')

                format = ''
        
                if is_date_string_valid(parts[0], '%Y-%m-%d %H:%M:%S'):
                    sub_parts = parts[0].split(' ')
                    line_date = datetime.strptime(sub_parts[0], "%Y-%m-%d")
                    format = '%Y-%m-%d %H:%M:%S'
                elif is_date_string_valid(parts[0], "%d.%m.%Y"):
                    line_date = datetime.strptime(parts[0], "%d.%m.%Y")
                    format = '%d.%m.%Y'
                else:
                    continue

                # check if the date is in the list of dates
                if line_date == date:
                    
                    if format == '%d.%m.%Y':
                        line_besucher_erwachsen = int(parts[3])
                        line_besucher_kind = int(parts[4])
                    elif format == '%Y-%m-%d %H:%M:%S':
                        line_besucher_erwachsen = int(parts[2])
                        line_besucher_kind = int(parts[3])
                    
                    besucher_erwachsen += line_besucher_erwachsen
                    besucher_kind += line_besucher_kind
                    # besucher_gesamt += line_besucher_erwachsen + line_besucher_kind
                    besucher_gesamt += 1

        csv_content_reconstructed = f'"{date.strftime("%Y-%m-%d")}",{berechtigt_gesamt},{berechtigt_erwachsen},{berechtigt_kind},{besucher_gesamt},{besucher_erwachsen},{besucher_kind}'

        with open(file, 'r') as f:
            csv_content_original = f.read()


        is_equal = not file in corrupted_files['seperator_num'] and not file in corrupted_files['nul_character'] and compare_reconstructable_numbers(csv_content_original, csv_content_reconstructed)
        is_success = check_reconstruction_success(csv_content_reconstructed)

        print(file, '✅' if is_equal else '❌', '✅' if is_success else  '❌')
        print('orgiginal\t', '\t'.join(csv_content_original.strip().split(',')))
        print('reconstructed\t', '\t'.join(csv_content_reconstructed.strip().split(',')))

        # Replace where reconstruction was a success
        if not is_equal and is_success:
            with open(file, 'w') as f:
                f.write(csv_content_reconstructed)

if __name__ == "__main__":
    main()
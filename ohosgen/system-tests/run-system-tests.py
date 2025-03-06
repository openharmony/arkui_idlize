import os
import json
import shutil


def read_test_cases():
    with open('./test_cases.json', 'r') as file:
        list_json = json.load(file)
    for c in list_json:
        if not 'ignores' in c:
            c['ignores'] = False
    return list_json


def preprocess_output_file(output_path):
    NUM_LINES_TO_IGNORE = 4
    os.system(f"sed -i '1,{NUM_LINES_TO_IGNORE}d' {output_path}")


test_cases = read_test_cases()
success_count = 0
failure_list = []
ignored_list = []

prepare_ret_code = os.system("npm run prepare")
if prepare_ret_code != 0:
    raise RuntimeError("Failure during preparation.")

TEMP_DIR = '__temp__'
if os.path.exists(TEMP_DIR):
    shutil.rmtree(TEMP_DIR)
os.mkdir(TEMP_DIR)

for c in test_cases:
    case_name = c['name']
    if c['ignores']:
        print(f"{case_name}: ignored")
        ignored_list.append(case_name)
        continue
    case_temp_dir = os.path.join(TEMP_DIR, case_name)
    os.mkdir(case_temp_dir)

    prefix_str = f"TEST_CASE={case_name} INPUT_TYPE={c['inputType']}"
    pre_start_ret_code = \
        os.system(f"{prefix_str} npm run pre-start:arkts >{os.path.join(case_temp_dir, 'build.log')}")
    if pre_start_ret_code != 0:
        print(f"{case_name}: FAIL (during generation or compilation)")
        failure_list.append(case_name)
        continue
    output_path = os.path.join(case_temp_dir, 'output.txt')
    start_ret_code = os.system(f"{prefix_str} npm run start:arkts >{os.path.join(output_path)}")
    if start_ret_code != 0:
        print(f"{case_name}: FAIL (runtime error)")
        failure_list.append(case_name)
        continue
    preprocess_output_file(output_path)
    diff_file = os.path.join(case_temp_dir, 'diff.txt')
    diff_ret_code = os.system(f"diff {os.path.join(case_name, 'expected_output.txt')} {output_path} >{diff_file}")
    if diff_ret_code != 0:
        print(f"{case_name}: FAIL (unexpected output)")
        failure_list.append(case_name)
    else:
        print(f"{case_name}: OK")
        success_count += 1

print('-----------------------------------------------------------------------')
failure_count = len(failure_list)
ignore_count = len(ignored_list)
if failure_count == 0:
    print(f"OK: All of {success_count} cases are successful.")
    ret_code = 0
else:
    print(f"FAIL: {failure_count} of {success_count + failure_count} cases failed.")
    ret_code = 1

if failure_count > 0:
    failure_list_str = '\n'.join(failure_list)
    print(f"Failed test cases:" + "\n" + failure_list_str)
if ignore_count > 0:
    ignored_list_str = '\n'.join(ignored_list)
    print(f"Ignored test cases:" + "\n" + ignored_list_str)

exit(ret_code)

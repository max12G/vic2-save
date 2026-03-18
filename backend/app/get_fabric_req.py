from pyradox import txt as pyradox_txt
from pyradox.datatype import time as pyradox_time
import os
import sys

def parse_victoria2_file(file_path):
    try:
        with open(file_path, "r", encoding="windows-1252", errors="ignore") as f:
            content = f.read()
        data = pyradox_txt.parse(content)
        return data
        
    except Exception as e:
        print(f"Ошибка при парсинге: {e}")
        return None
    

current_dir = os.path.dirname(os.path.abspath(__file__))
parent_dir = os.path.dirname(current_dir)
data = parse_victoria2_file(os.path.join(parent_dir, "data", "production_types.txt"))
factories = [k for k in data.keys() if data[k]["input_goods"] != None]
def get_factory_info(factory):
    input_goods = factory["input_goods"]
    inp = {}
    for good in input_goods:
        if good is None:
            continue
        inp[good] = input_goods[good]
    out = {}
    good = factory["output_goods"]
    out[good] = factory["value"]
    
    return inp, out

stats = {}
for fac in factories:
    stats[fac] = get_factory_info(data[fac])


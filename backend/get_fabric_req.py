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
    

def _get_base_dir():
    if getattr(sys, 'frozen', False):
        return sys._MEIPASS
    return os.path.dirname(os.path.abspath(__file__))

_here = _get_base_dir()
_prod_types_path = os.path.join(_here, "data", "production_types.txt")
data = parse_victoria2_file(os.path.join(_here, "data", "production_types.txt"))
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


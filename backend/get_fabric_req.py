import pyradox


def parse_victoria2_file(file_path):
    try:
        with open(file_path, "r", encoding="windows-1252", errors="ignore") as f:
            content = f.read()
        data = pyradox.txt.parse(content)
        return data
        
    except Exception as e:
        print(f"Ошибка при парсинге: {e}")
        return None
    

data = parse_victoria2_file("production_types.txt")
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


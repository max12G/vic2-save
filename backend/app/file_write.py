import pyradox
import formulas
from pyradox.datatype import time as pyradox_time
import sys
import re
import pandas as pd
import time
import tqdm
import os
import numpy as np
import matplotlib.pyplot as plt
from get_fabric_req import stats
from parties import *
import math


def get_country_size(tag, data=None):
    if tag not in data:
        return 0
    states = list(data[tag].find_all("state"))
    return len(states)


def country_exists(tag, data=None):
    return get_country_size(tag, data) != 0


def uravnilovka(per = 0.5, tag = None, data = None):
    country = data[tag]
    pop_types = [
        "farmers",
        "labourers",
        "artisans",
        "clergymen",
        "clerks",
        "bureaucrats",
        "soldiers",
        "officers",
        "aristocrats",
        "capitalists",
        "slaves",
        "serfs",
        "craftsmen",
    ]
    money = country["money"]
    total_cash = money * per
    country["money"] = money - total_cash
    savings = []
    states = data[tag].find_all("state")
    for state in states:
        prov_ids = list(state.find_all("provinces"))
        for provid in prov_ids:
            province = data[provid]
            for pop_type in pop_types:
                all_pops = province.find_all(pop_type)
                for pop in all_pops:
                    savings.append(pop["money"])
    savings = formulas.divide(savings)
    print(savings)
    ind = 0
    states = data[tag].find_all("state")
    for state in states:
        prov_ids = list(state.find_all("provinces"))
        for provid in prov_ids:
            province = data[provid]
            for pop_type in pop_types:
                all_pops = province.find_all(pop_type)
                for pop in all_pops:
                    pop["money"] = savings[ind] * total_cash * 10
                    ind += 1
    return data


def parse_victoria2_save(file_path):
    try:
        with open(file_path, "r", encoding="CP1251", errors="ignore") as f:
            content = f.read()
        data = pyradox.txt.parse(content)
        return data
    except Exception as e:
        print(f"Ошибка при парсинге: {e}")
        return None
    

def load_red_save(file_path, save_data: pyradox.Tree):
    with open(file_path, 'w', encoding='CP1251') as f:
        
        done = save_data.prettyprint()
        fixed_file = re.sub(r'(\d+)\.(?!\d)', r'\1.0', done)
        f.write(fixed_file.replace(" = ", "="))


if __name__ == "__main__":
    sys.setrecursionlimit(10000)
    data = parse_victoria2_save(
        r"C:/Users/User/Documents/parser/vic2-save/backend/test_data/GER1860.v2"
    )
    save_data = data
    countries = [
        str(k)
        for k in data.keys()
        if len(str(k)) == 3
        and str(k).isalpha()
        and str(k).isupper()
        and country_exists(tag=k, data=data)
    ]
    country_parties = prepare_paries(countries)
    world_goods_price = data["worldmarket"]["price_pool"]
    for tag in countries:
        save_data = uravnilovka(0.5, tag, save_data)
    load_red_save(
        r"C:/Users/User/Documents/parser/vic2-save/backend/test_data/GER_TEST.v2",
        save_data
    )
    # print(get_economy_producing_podrobno("JAP"))
    # print(get_diversification_ind("USA"))
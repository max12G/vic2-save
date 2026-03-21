from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel 
import re
from pyradox import txt as pyradox_txt
from pyradox.datatype import time as pyradox_time
import logic
from sort_functions import SORT_FUNCS, safe_sort
from flags_convert import convert_files

app = FastAPI()
app.add_middleware(CORSMiddleware, allow_origins=["*"], allow_methods=["*"])

cache = [] 
time_past = None

class LoadRequest(BaseModel): 
    path: list[str]

def parse_victoria2_save(file_path):
    try:
        with open(file_path, "r", encoding="windows-1252", errors="ignore") as f:
            content = f.read()
        content = re.sub(r'(bank=-?\d+\.\d+)\d{2}\.\d+', r'\1', content)
        data = pyradox_txt.parse(content)
        return data
    except Exception as e:
        print(f"Ошибка при парсинге: {e}")
        return None

@app.post("/load")
def load_save(body: LoadRequest):
    path = body.path
    data = parse_victoria2_save(path[-1])
    if data is None:
        return "Ошибка парсинга файла"
    cache.clear()
    cache.append(data)
    #C:/Users/User/Documents/parser/vic2-save/backend/test_data/siiiey1918_01_11.v2
    #C:/Users/User/Documents/parser/vic2-save/backend/test_data/Dinney2004_01_01.v2
    #C:/Users/User/Documents/parser/vic2-save/backend/test_data/Dinney2005_08_29.v2
    logic.world_goods_price = data["worldmarket"]["price_pool"]
    logic.countries = [str(k) for k in data.keys()
                 if len(str(k)) == 3 and str(k).isalpha() and str(k).isupper()
                 and logic.country_exists(tag=k, data=data)]
    return f"loaded {len(logic.countries)} countries"

@app.get("/countries")
def get_countries(sort_met: str = "gdp", ascendic: bool = False):
    logic.countries.sort(key=lambda x: safe_sort(sort_met=sort_met, tag=x, data=cache[-1]), reverse=not ascendic)
    return {"countries": logic.countries}

@app.get("/mods")
def get_mod_flags(src: str = ""):
    if src:
        convert_files(src=src)
    return

@app.get("/stats/{tag}")
def get_stats(tag: str, data=None):
    if data is None:
        data = cache[-1]
    return {
        "gdp":                logic.getGDP(tag, data=data),
        "population":         logic.get_population(tag, data=data),
        "gdp_per_cap":        logic.get_GDP_per_capita(tag, data=data),
        "money_activity":     logic.get_money_activity(tag, data=data),
        "consuption":         logic.get_Consumption_economy(tag, data=data),
        "supply":             logic.getSupply(tag, data=data),
        "industrial_level":   logic.indPower(tag, data=data),
        "subside_percent":    logic.get_subside_ind(tag, data=data),
        "rentability":        logic.avg_rentability(tag, data=data),
        "subside_pct":        logic.get_subside_ind(tag, data=data),
        "diversification":    logic.get_diversification_ind(tag, data=data),
        "gold_income":        logic.get_gold_mining(tag, data=data),
        "country_savings":    logic.get_country_savings(tag, data=data),
        "bank_savings":       logic.get_bank_savings(tag, data=data),
        "population_savings": logic.get_all_pop_money(tag, data=data),
        "money_mass":         logic.get_money_mass(tag, data=data),
        "gini":               logic.real_gini(tag, data=data),
        "fabric_employee":    logic.get_employed_fabric(tag, data=data),
        "fabric_unemployement": logic.fabric_uneployement(tag, data=data),
        "rgo_employement":    logic.rgo_uneployement(tag, data=data),
        "all_employemenent":  logic.get_all_employed(tag, data=data),
        "all_free_work_places": logic.get_all_work_places(tag, data=data),
        "fabric_worker_salary": logic.get_avg_salary(tag, data=data),
        "capitalist_salary":  logic.get_avg_capilatils_salary(tag, data=data),
        "literacy":           logic.get_literacy(tag, data=data),
        "military_budget":    logic.get_army_budget(tag, data=data),
        "naval_budget":       logic.get_naval_budget(tag, data=data),
        "army_innov":         logic.army_innovation(tag, data=data),
        "naval_innov":        logic.naval_innovation(tag, data=data),
        "country_size":       logic.get_country_size(tag, data=data),
        "population_per_reg": logic.population_per_reg(tag, data=data),
        "gdp_per_reg":        logic.gdp_per_reg(tag, data=data),
        "goverement":         logic.get_gov_type(tag, data=data),
        "most_popular_party": logic.get_most_popular_patry(tag, data=data),
    }

@app.get("/compare")
def compare(tags: str):
    result = {}
    for tag in tags.split(","):
        result[tag] = get_stats(tag)
    return result

@app.post("/time")
def get_time_progression(body: LoadRequest):
    global time_past
    if not cache:
        return "Сначала загрузи основной файл"
    data_present = cache[-1]
    data_past = parse_victoria2_save(body.path[0])
    if data_past is None:
        return "Ошибка парсинга файла"
    time_past = data_past
    logic.countries = [str(k) for k in data_present.keys()
                 if len(str(k)) == 3 and str(k).isalpha() and str(k).isupper()
                 and logic.country_exists(tag=k, data=data_past)
                 and logic.country_exists(tag=k, data=data_present)]
    logic.countries.sort(key=lambda x: logic.getGDP(x, data=data_present), reverse=True)
    return f"loaded {len(logic.countries)}!"

@app.get("/time_compare/{tag}")
def time_compare(tag: str):
    if time_past is None or not cache:
        return {}
    stack = {}
    stack[str(time_past["date"])]  = get_stats(tag, time_past)
    stack[str(cache[-1]["date"])]  = get_stats(tag, cache[-1])
    return stack

if __name__ == "__main__":
    import uvicorn
    import traceback
    import sys
    is_frozen = getattr(sys, 'frozen', False)
    try:
        if not is_frozen:
            uvicorn.run("server:app", host="localhost", port=8000, reload=True, log_level="info")
        else:
            from server import app
            uvicorn.run(app, host="localhost", port=8000, log_level="warning")
    except Exception:
        with open("server_error.log", "w") as f:
            f.write(traceback.format_exc())
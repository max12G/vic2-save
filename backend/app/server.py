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

class LoadRequest(BaseModel): 
    path: str

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
    data = parse_victoria2_save(path)
    world_goods_price = data["worldmarket"]["price_pool"]
    logic.data = data
    logic.world_goods_price = world_goods_price
    logic.countries = [str(k) for k in logic.data.keys()
                 if len(str(k)) == 3 and str(k).isalpha() and str(k).isupper() and logic.country_exists(tag=k)]
    #C:/Users/User/Documents/parser/vic2-save/backend/test_data/siiiey1918_01_11.v2
    #C:/Users/User/Documents/parser/vic2-save/backend/test_data/Dinney2004_01_01.v2
    #C:/Users/User/Documents/parser/vic2-save/backend/test_data/Dinney2005_08_29.v2
    return f"loaded {len(logic.countries)} countries"

@app.get("/countries")
def get_countries(sort_met: str = "gdp", ascendic: bool = False):
    logic.countries.sort(key=lambda x: safe_sort(sort_met=sort_met, tag=x), reverse=not ascendic)
    return {"countries": logic.countries}

@app.get("/mods")
def get_mod_flags(src: str = ""):
    if src:
        convert_files(src=src)
    return

@app.get("/stats/{tag}")
def get_stats(tag: str):
    return {
        "gdp":          logic.getGDP(tag),
        "population":   logic.get_population(tag),
        "gdp_per_cap":  logic.get_GDP_per_capita(tag),
        "money_activity": logic.get_money_activity(tag),
        "consuption": logic.get_Consumption_economy(tag),
        "supply": logic.getSupply(tag),
        "industrial_level": logic.indPower(tag),
        "subside_percent": logic.get_subside_ind(tag),
        "rentability": logic.avg_rentability(tag),
        "subside_pct":  logic.get_subside_ind(tag),
        "diversification": logic.get_diversification_ind(tag),
        "gold_income": logic.get_gold_mining(tag),
        "country_savings": logic.get_country_savings(tag),
        "bank_savings": logic.get_bank_savings(tag),
        "population_savings": logic.get_all_pop_money(tag),
        "money_mass": logic.get_money_mass(tag),
        "gini":         logic.real_gini(tag),
        "fabric_employee": logic.get_employed_fabric(tag),
        "fabric_unemployement": logic.fabric_uneployement(tag),
        "rgo_employement": logic.rgo_uneployement(tag),
        "all_employemenent": logic.get_all_employed(tag),
        "all_free_work_places": logic.get_all_work_places(tag),
        "fabric_worker_salary": logic.get_avg_salary(tag),
        "capitalist_salary": logic.get_avg_capilatils_salary(tag),
        "literacy":     logic.get_literacy(tag),
        "military_budget": logic.get_army_budget(tag),
        "naval_budget": logic.get_naval_budget(tag),
        "army_innov":   logic.army_innovation(tag),
        "naval_innov":  logic.naval_innovation(tag),
        "country_size": logic.get_country_size(tag),
        "population_per_reg": logic.population_per_reg(tag),
        "gdp_per_reg": logic.gdp_per_reg(tag),
        "goverement": logic.get_gov_type(tag),
    }

@app.get("/compare")
def compare(tags: str):
    result = {}
    for tag in tags.split(","):  
        result[tag] = get_stats(tag)
    return result

if __name__ == "__main__":
    import uvicorn
    import traceback
    #uvicorn.run("server:app", host="localhost", port=8000, reload=True)
    try:
        uvicorn.run(app, host="localhost", port=8000, log_level="warning")
    except Exception as e:
        with open("server_error.log", "w") as f:
            f.write(traceback.format_exc())
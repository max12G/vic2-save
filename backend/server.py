from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel 
import re
from pyradox import txt as pyradox_txt
from pyradox.datatype import time as pyradox_time
import logic

pyradox_time.Time.validate = lambda self, *args: None

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
    countries = [str(k) for k in logic.data.keys()
                 if len(str(k)) == 3 and str(k).isalpha() and str(k).isupper()]
    return {"countries": countries}

@app.get("/stats/{tag}")
def get_stats(tag: str):
    return {
        "gdp":          logic.getGDP(tag),
        "population":   logic.get_population(tag),
        "literacy":     logic.get_literacy(tag),
        "gdp_per_cap":  logic.get_GDP_per_capita(tag),
        "ind_power":    logic.indPower(tag),
        "gini":         logic.real_gini(tag),
        "export":       logic.get_export(tag),
        "import":       logic.get_import(tag),
        "army_innov":   logic.army_innovation(tag),
        "naval_innov":  logic.naval_innovation(tag),
        "subside_pct":  logic.get_subside_ind(tag),
        "fab_unemploy": logic.fabric_uneployement(tag),
        "country_size": logic.get_country_size(tag),
    }

@app.get("/compare")
def compare(tags: str):
    result = {}
    for tag in tags.split(","):  
        result[tag] = get_stats(tag)
    return result

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="localhost", port=8000)
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
import pyradox, re, sys
import logic

app = FastAPI()
app.add_middleware(CORSMiddleware, allow_origins = ["*"], allow_methods = ["*"])

@app.post("/load")
def load_save(body: dict):
    path = body["path"]
    with open(path, "r", encoding="windows-1252", errors="ignore") as f:
        content = f.read()
    content = re.sub(r'(bank=-?\d+\.\d+)\d{2}\.\d+', r'\1', content)
    logic.data = pyradox.txt.parse(content)
    logic.world_goods_price = logic.data["worldmarket"]["price_pool"]
    countries = [k for k in logic.data.keys()
                if len(str(k)) == 3 and str(k).isupper()]
    return {"countries" : countries}

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
    for tag in tags.split():
        result[tag] = get_stats(tag)
    return result

if __name__ == "main":
    import uvicorn
    uvicorn.run(app, host = "localhost", port = 8000)
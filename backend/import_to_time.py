import os
import tqdm
import logic
import pandas as pd
import pyradox
import re

saves_dir = "C:/Users/User/Documents/Paradox Interactive/Victoria II/save games/" 
all_saves = [f for f in os.listdir(saves_dir) if f.endswith(".v2")]

def parse_victoria2_save(file_path):
    try:
        with open(file_path, "r", encoding="windows-1252", errors="ignore") as f:
            content = f.read()
        
        content = re.sub(r'(bank=-?\d+\.\d+)\d{2}\.\d+', r'\1', content)
        
        data = pyradox.txt.parse(content)
        return data
        
    except Exception as e:
        print(f"Ошибка при парсинге: {e}")
        return None

history_records = []

print("НАчало")

for save_name in tqdm.tqdm(all_saves):
    file_path = os.path.join(saves_dir, save_name)
    
    data = parse_victoria2_save(file_path)
    if data is None: continue
    logic.data = data
    t_str = data["date"].split(".")
    days_timestamp = (int(t_str[0]) - 1836) * 365 + int(t_str[1]) * 30 + int(t_str[2])
    all_country_tags = [
    tag for tag in data.keys() 
    if isinstance(tag, str) and len(tag) == 3 and tag.isupper() and data[tag].find("state") is not None
    ]
    top = []
    to_csv = []
    # for tag in tqdm.tqdm(all_country_tags):
    #     gdp = main.getGDP(tag)
    #     top.append((tag, gdp))
    # top.sort(key=lambda x: x[1], reverse=True)
    
    for tag in all_country_tags:
        value = int(logic.getGDP(tag))
        history_records.append({
            "days": days_timestamp,
            "country": tag,
            "value": value
        })
            
    del data

df_history = pd.DataFrame(history_records)
df_history = df_history.sort_values(by=["days", "country"])

final_csv = df_history.pivot(index="days", columns="country", values="value")

final_csv.to_csv("countries_history_stats.csv")
print("ГГ countries_history_stats.csv")
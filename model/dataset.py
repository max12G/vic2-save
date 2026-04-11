import sys
import os
import time
import pandas as pd
from pydantic import BaseModel

from backend.app.server import load_save, get_stats, LoadRequest, cache
import backend.app.logic as logic



DATASET_PATH = f"model/data"
PREV_DATE = -1



def get_n():
    return 2

def update_dataset(path):
    global PREV_DATE
    n = get_n()
    try:
        dummy = LoadRequest(path=[path])
        load_save(dummy)
        #tags = ["USA", "RUS", "ENG", "FRA", "AUS"]
        tags = ["CHI", "NET", "BEL", "BRZ", "SPA"]
        date = cache[-1]["date"]
        if date == PREV_DATE:
            return
        for tag in tags:
            stats = get_stats(tag, dataset=True)
            df = pd.DataFrame([stats])
            df.insert(0, "date", date)
            #df = df.drop(["gdp_per_cap", "consuption", "supply", "gdp_per_reg", "goverement", "most_popular_party", "flag_name"], axis=1)
            data_path = DATASET_PATH + f"/{tag}_{n}.csv"
            if not os.path.isfile(data_path):
                df.to_csv(data_path, index=False)
            else:
                df.to_csv(data_path, mode='a', header=False, index=False)
            PREV_DATE = date
    except Exception as e:
        print(f"Ошибка при обновлении данных в dataset.py, время - {time.ctime()}, {e}")


def normalize_dataset(df):
    numeric_cols = [
        "gdp", "population", "gdp_per_cap", "money_activity", "consuption", "supply",
        "industrial_level", "subside_percent", "rentability", "subside_pct",
        "diversification", "gold_income", "country_savings", "bank_savings",
        "population_savings", "money_mass", "gini", "fabric_employee",
        "fabric_unemployement", "rgo_employement", "all_employemenent",
        "all_free_work_places", "fabric_worker_salary", "capitalist_salary",
        "literacy", "military_budget", "naval_budget", "army_innov",
        "naval_innov", "country_size", "population_per_reg", "gdp_per_reg", 
        "war_status", "rich_tax", "middle_tax", "poor_tax",
    ]
    
    categorical_cols = ["goverement", "most_popular_party", "flag_name"]

    i = 0
    while i < len(df) - 1:
        date1 = df["date"].iloc[i]
        date2 = df["date"].iloc[i + 1]
        year1, mounth1, day1 = date1.split(".")
        year2, mounth2, day2 = date2.split(".")
        if mounth1 == mounth2:
            idx = i
            new_row = {}
            if mounth1 == "7":
                new_row["date"] = f"{year2}.1.1"
            else:
                new_row["date"] = f"{year1}.7.1"
            for j in numeric_cols:
                new_row[j] = round((df[j].iloc[i] + df[j].iloc[i + 1]) / 2, 3)
            for j in categorical_cols:
                new_row[j] = df[j].iloc[i]
            df.loc[idx + 0.5] = new_row
            df = df.sort_index().reset_index(drop=True)
            i += 2
        else:
            i += 1
    
    for col in numeric_cols:
        if col in df.columns:
            df[col] = pd.to_numeric(df[col], errors='coerce')
    return df



if __name__ == "__main__":
    #tags = ["USA", "RUS", "ENG", "FRA", "AUS"]
    tags = ["CHI", "NET", "BEL", "BRZ", "SPA"]
    n = get_n()
    for tag in tags:
        path = f"data/{tag}_{n}.csv"
        df = pd.read_csv(path)
        df = normalize_dataset(df)
        df.to_csv(f"data/{tag}_{n}.csv", index=False)
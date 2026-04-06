import sys
import os
import time
import pandas as pd
from pydantic import BaseModel

from backend.app.server import load_save, get_stats, LoadRequest, cache
import backend.app.logic as logic



DATASET_PATH = f"model/data"

def update_dataset(path):
    try:
        dummy = LoadRequest(path=[path])
        load_save(dummy)
        tags = ["USA", "RUS", "ENG", "FRA"]
        for tag in tags:
            stats = get_stats(tag)
            date = cache[-1]["date"]
            df = pd.DataFrame([stats])
            df.insert(0, "date", date)
            data_path = DATASET_PATH + f"/{tag}.csv"
            if not os.path.isfile(data_path):
                df.to_csv(data_path, index=False)
            else:
                df.to_csv(data_path, mode='a', header=False, index=False)
    except Exception as e:
        print(f"Ошибка при обновлении данных в dataset.py, время - {time.ctime()}, {e}")

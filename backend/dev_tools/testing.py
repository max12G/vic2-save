from time import perf_counter
from backend.app.server import load_save, get_stats, LoadRequest, cache
from model.shared.dataset_params import tags
import pandas as pd

path = r"C:/Users/User/Documents/parser/vic2-save/backend/test_data/GER1860.v2"
dummy = LoadRequest(path=[path])
st = perf_counter()
load_save(dummy)
print(f"Время на зугрузку - {perf_counter() - st}")
st = perf_counter()
for tag in tags:
    a = get_stats(tag, dataset=True)
    gg = pd.DataFrame([a])
    gg.insert(0, "date", "2555")
    gg.to_csv(r"C:/Users/User/Documents/parser/vic2-save/backend/test_data/OMG.csv", index=False, header=False)
print(f"На загрузку 5 стран - {perf_counter() - st}")

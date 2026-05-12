import sqlite3
import pandas as pd
import os

conn = sqlite3.connect("dataset.db")
all_frames = []
folder_path = "model/data/"
for filename in os.listdir(folder_path):
    if filename.endswith(".csv"):
        file_full_path = os.path.join(folder_path, filename)
        
        df = pd.read_csv(file_full_path) 
        if "subside_pct" in df.columns:
            df = df.drop(["subside_pct"], axis=1)
        df["country"] = filename.split("_")[0]
        game_ind = filename.split("_")[1].split(".")[0]
        df["game_ind"] = int(game_ind)
        all_frames.append(df)
        print(df)
        
df = pd.concat(all_frames, ignore_index=True)

df.to_sql("runs_stats", conn, if_exists="append", index=False)
print(f"File {filename} succesfuly append")


print("Done!")
conn.close()
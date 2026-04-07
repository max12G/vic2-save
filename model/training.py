import torch.nn as nn
import torch
import numpy as np
import pandas as pd


def z_normalization(x: np.array):
    mean = np.mean(x, axis=0)
    std = np.std(x, axis=0)
    result = (x - mean) / (std + 1e-8)
    return result

def fancy_output(d: dict):
    for k in d:
        print(f"{k}: {d[k]:.2f}")
    return

data1 = pd.read_csv(r"model\data\ENG.csv")
data2 = pd.read_csv(r"model\data\RUS.csv")
data3 = pd.read_csv(r"model\data\USA.csv")
data4 = pd.read_csv(r"model\data\FRA.csv")
data = pd.concat([data1, data2, data3, data4], ignore_index=True)
y_np = data["gdp"].values
X_np = data.drop(["gdp", "date", "gdp_per_cap", "consuption", "supply", "gdp_per_reg", "goverement", "most_popular_party", "flag_name"], axis=1).values

y_z = z_normalization(y_np)
X_z = z_normalization(X_np)

X = torch.tensor(X_z, dtype=torch.float32)
y = torch.tensor(y_z, dtype=torch.float32).view(-1, 1)

model = nn.Linear(X.shape[1], 1, True)
criterion = nn.MSELoss()

optimizer = torch.optim.Adam(model.parameters(), lr = 0.01)



n_epochs = 20000
for epoch in range(n_epochs):
    optimizer.zero_grad()
    prediction = model(X)
    loss = criterion(prediction, y)
    loss.backward()
    optimizer.step()
    if epoch % 100 == 0:
        print(f"Эпоха {epoch}, потери - {loss.item():.4f}")

weights = model.weight.data.tolist()[0]
names = list(data.drop(["gdp", "date", "gdp_per_cap", "consuption", "supply", "gdp_per_reg", "goverement", "most_popular_party", "flag_name"], axis=1).keys()) + ["bias"]
output = dict(zip(names, weights))
fancy_output(output)
import pandas as pd
import random
from pathlib import Path


BASE_DIR = Path(__file__).resolve().parent

DATA_PATH = BASE_DIR / "EV_Charger_Downtime_Final_ML_Dataset.xlsx"

df = pd.read_excel(DATA_PATH)

df = df.sort_values(["charger_id", "timestamp"])

df["stress_6h_avg"] = (
    df.groupby("charger_id")["overall_stress_score"]
      .rolling(6)
      .mean()
      .reset_index(level=0, drop=True)
)

df["stress_12h_avg"] = (
    df.groupby("charger_id")["overall_stress_score"]
      .rolling(12)
      .mean()
      .reset_index(level=0, drop=True)
)

df["thermal_6h_avg"] = (
    df.groupby("charger_id")["thermal_stress_index"]
      .rolling(6)
      .mean()
      .reset_index(level=0, drop=True)
)

df["thermal_12h_avg"] = (
    df.groupby("charger_id")["thermal_stress_index"]
      .rolling(12)
      .mean()
      .reset_index(level=0, drop=True)
)


df["failure_probability"] = (
    0.6 * df["thermal_12h_avg"] +
    0.3 * df["stress_12h_avg"] +
    0.1 * df["voltage_stress_index"]
)

df["threshold"] = (
    df.groupby("charger_id")["failure_probability"]
      .transform(lambda x: x.quantile(0.95))
)

df["high_risk"] = (
    df["failure_probability"] > df["threshold"]
).astype(int)

df["failure_event"] = (
    (df["high_risk"] == 1) &
    (df["high_risk"].shift(1) == 0)
).astype(int)

df.drop(columns=["high_risk", "threshold"], inplace=True)

def generate_labels(group):

    # Failure time index
    failure_indices = group.index[group["failure_event"] == 1]

    group["failure_within_24h"] = 0
    group["failure_within_48h"] = 0
    group["failure_within_72h"] = 0

    for idx in failure_indices:

        # label only last degradation window
        group.loc[idx-6:idx, "failure_within_24h"] = 1
        group.loc[idx-12:idx, "failure_within_48h"] = 1
        group.loc[idx-24:idx, "failure_within_72h"] = 1

    return group

df = df.groupby("charger_id", group_keys=False).apply(generate_labels)
df = df.dropna().reset_index(drop=True)

output_path = r"/home/rayan/Projects/ev_downtime/backend/EV_Charger_Downtime_Final_ML_Dataset.xlsx"

df.to_excel(output_path, index=False)

print(f"Dataset saved successfully at:\n{output_path}")

print(df["failure_within_24h"].mean())
print(df["failure_within_48h"].mean())
print(df["failure_within_72h"].mean())
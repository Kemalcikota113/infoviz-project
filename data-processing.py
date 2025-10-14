# This is the script used for Activity 1 which is to clean the data in preparation for analysis in the later activities.

import pandas as pd
import numpy as np

# check that pandas and numpy are installed
print(f"Pandas version: {pd.__version__}")
print(f"Numpy version: {np.__version__}")

# convert data/processed.cleveland.data to a csv file and save it as "cleveland.csv"
df = pd.read_csv("data/processed.cleveland.data", header=None)

# add header row from dataset description
df.columns = [
    "age", "sex", "cp", "trestbps", "chol",
    "fbs", "restecg", "thalach", "exang",
    "oldpeak", "slope", "ca", "thal", "target"
]

# replace ? with NaN and remove rows with NaN values
df.replace("?", np.nan, inplace=True)
df.dropna(inplace=True)

df = df.astype(float)

# add a space after each comma to make it easier to read
df.to_csv("data/cleveland.csv", index=False)

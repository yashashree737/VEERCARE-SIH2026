import pandas as pd

data=pd.read_csv("data.csv")

print(data.shape)
print(data.head())
print(data.info())
print(data.describe())
print(data.dtypes)
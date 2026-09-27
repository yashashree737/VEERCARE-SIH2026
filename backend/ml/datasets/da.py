import pandas as pd

data=pd.read_csv("cleaned_data.csv")

print(data.isnull())
print(data.info(verbose=True,show_counts=True))
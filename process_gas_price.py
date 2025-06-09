import pandas as pd

# Read the CSV file
df = pd.read_csv('db/各縣市家用桶裝瓦斯均價.csv', dtype={'查報日期(年/月)': str})

# Split the date column into year and month
df['查報年分'] = df['查報日期(年/月)'].str[:4]
df['查報月份'] = df['查報日期(年/月)'].str[4:]

# Reorder columns
columns = ['縣市名稱', '查報均價(元/20公斤(桶))', '查報年分', '查報月份']
df = df[columns]

# Save the processed file
df.to_csv('db/各縣市家用桶裝瓦斯均價_processed.csv', index=False) 
import os
import csv
import glob
from datetime import datetime

YEAR = '2022'
INPUT_FOLDER = "mean_calculator/sensordata/" + YEAR
OUTPUT_FILE =  YEAR + "_medie_giornaliere.csv"

results = []

print(sorted(glob.glob(os.path.join(INPUT_FOLDER, '**', '*.csv'), recursive=True)))

for filepath in sorted(glob.glob(os.path.join(INPUT_FOLDER, '**', '*.csv'), recursive=True)):
    if not filepath.endswith(".csv"):
        continue

    sum_p1, sum_p2, count = 0, 0, 0

    with open(filepath, newline='', encoding='utf-8') as f:
        reader = csv.DictReader(f, delimiter=';')
        for row in reader:
            try:
                p1 = float(row['SDS_P1'])
                p2 = float(row['SDS_P2'])
                sum_p1 += p1
                sum_p2 += p2
                count += 1
            except (ValueError, KeyError):
                continue

    if count > 0:
        date_str = None
        with open(filepath, newline='', encoding='utf-8') as f:
            reader = csv.DictReader(f, delimiter=';')
            for row in reader:
                try:
                    date_str = datetime.strptime(row['Time'], "%Y/%m/%d %H:%M:%S").strftime("%Y-%m-%d")
                    break
                except (ValueError, KeyError):
                    continue

        if date_str:
            results.append({
                "date": date_str,
                "avg_SDS_P1": round(sum_p1 / count, 2),
                "avg_SDS_P2": round(sum_p2 / count, 2),
                "samples": count
            })
            print(f"{date_str}: P1={round(sum_p1/count,2)}, P2={round(sum_p2/count,2)} ({count} campioni)")

with open(OUTPUT_FILE, 'w', newline='', encoding='utf-8') as f:
    writer = csv.DictWriter(f, fieldnames=["date", "avg_SDS_P1", "avg_SDS_P2", "samples"])
    writer.writeheader()
    writer.writerows(results)

print(f"\nFile salvato: {OUTPUT_FILE} ({len(results)} giorni)")
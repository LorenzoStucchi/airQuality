import os
import csv
from datetime import datetime

INPUT_FOLDER = "2026"
OUTPUT_FILE = "medie_giornaliere.csv"

results = []

for filename in sorted(os.listdir(INPUT_FOLDER)):
    if not filename.endswith(".csv"):
        continue

    filepath = os.path.join(INPUT_FOLDER, filename)

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
        # Estrai la data dalla prima colonna del nome file o dal contenuto
        # Usa la data dal primo valore Time del file
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
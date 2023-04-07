import csv
import random

with open('random_numbers50L.csv', mode='w', newline='') as file:
    writer = csv.writer(file)
    writer.writerow(['mobile', 'operator_id', 'circle_code', 'circle_id', 'is_port'])
    for i in range(5000000):
        writer.writerow([random.randint(7000000000, 9999999999), random.randint(1, 30), random.randint(1, 30), random.randint(1, 30), random.choice([0, 1])])
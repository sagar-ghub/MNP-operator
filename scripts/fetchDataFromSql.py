import requests
import json
#using sql
import mysql.connector
import pandas as pd


mydb = mysql.connector.connect(
    host="localhost",
    password="",
    database="rck_salon"
)
mycursor = mydb.cursor()
mycursor.execute("CREATE TABLE IF NOT EXISTS plans (id INT AUTO_INCREMENT PRIMARY KEY, amount INT, validity INT, description VARCHAR(255), is_valid INT, operator_id INT, circle_id INT)")
mycursor.execute("CREATE TABLE IF NOT EXISTS operators (id INT AUTO_INCREMENT PRIMARY KEY, name VARCHAR(255))")


#reading from database
mycursor.execute("SELECT * FROM postal_data")
operators = mycursor.fetchall()
columns = list(mycursor.column_names)
print(columns)
# keys = [
#     "id",
#     "officename",
#     "description",
#     "officeType",
#     "Deliverystatus",
#     "circlename",
#     "Districtname",
#     "divisionname",
#     "regionname",
#     "Taluk",
#     "statename",
#     "country",
#     "pincode"
#]

columns.append("json")
operators2=[]
for i,j in enumerate(operators):
    d = dict(zip(columns, j))
    operators_list = list(j)
    operators_list.append(d)
    operators2.append(operators_list)

# print(type(operators[0]))

#writing into excel
final_df = pd.DataFrame(operators2, columns=columns)
print("converting")
final_df.to_excel("/site/attendance2.xlsx", index=False) 
print("saved")
print((operators2[0]))

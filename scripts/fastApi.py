from typing import Union
import mysql.connector
from fastapi.staticfiles import StaticFiles
from fastapi import FastAPI
import pandas as pd

import time

import uvicorn

app = FastAPI()




app.mount("/site", StaticFiles(directory="site", html = True), name="site")


@app.get("/")
async def read_root():
    mydb = mysql.connector.connect(
    host="localhost",
    password="",
    database="rck_salon"
)
    mycursor=mydb.cursor()
    mycursor.execute("CREATE TABLE IF NOT EXISTS plans (id INT AUTO_INCREMENT PRIMARY KEY, amount INT, validity INT, description VARCHAR(255), is_valid INT, operator_id INT, circle_id INT)")
    mycursor.execute("CREATE TABLE IF NOT EXISTS operators (id INT AUTO_INCREMENT PRIMARY KEY, name VARCHAR(255))")
    mycursor.execute("SELECT * FROM postal_data LIMIT 10")
    operators = mycursor.fetchall()
    columns = list(mycursor.column_names)
    columns.append("json")
    operators2=[]
  
    for i,j in enumerate(operators):
        d = dict(zip(columns, j))
        operators_list = list(j)
        operators_list.append(d)
        operators2.append(operators_list)
    final_df = pd.DataFrame(operators2, columns=columns)  
    print("converting")

    t1 = time.time()

    with pd.ExcelWriter("attendance6.xlsx",mode='a', if_sheet_exists="new") as writer:  
        final_df.to_excel(writer, sheet_name='Sheet1')

    # final_df.to_excel("attendance6.xlsx", index=False) 
    t2 = time.time()
    print(f"saved in {t1-t2}")
    return {"Hello":"/site/attendance3.xlsx" }




# @app.post("/user")
# async def create(id:InputData):
#     return {id.name}



@app.get("/items/{item_id}")
def read_item(item_id: int, q: Union[str, None] = None):
    return {"item_id": item_id, "q": q}


if __name__ == '__main__':
    uvicorn.run(app=app)

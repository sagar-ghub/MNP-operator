import requests
import json
from pymongo import MongoClient
operator_arr=['','Jio','Airtel','Vodafone%20Idea','BSNL']
client = MongoClient("mongodb://127.0.0.1:27017")
mydb = client["rkit"]
mycol = mydb["plans"]


# Change only this operator_id
# operator_id=2 
# 1 for Jio, 2 for Airtel, 3 for Vodafone, 4 for BSNL
# mycol.update_one(
#     { "operator_id": operator_id },
#     { "$set": { "operator_name": "Vodafone" } },
    
# )
# print(operator_arr[operator_id])
# exit()
for operator_id in range(1,5):
    k=0
    for state_name in ["Andhra Pradesh", "Assam", "Bihar Jharkhand", "Chennai", "Gujarat", "Haryana", "Himachal Pradesh", "Karnataka", "Kerala", "Kolkata","Madhya Pradesh Chattisgarh", "Maharashtra", "North East", "Orissa", "Punjab", "Rajasthan",  "Tamil Nadu", "UP East", "UP West", "West Bengal"]:
    # for state_name in ["Andhra Pradesh"]:
        # url = f"https://digitalcatalog.paytm.com/dcat/v1/browseplans/mobile/7166?channel=HTML5&version=2&per_page=20&sort_price=asce&pagination=1&circle={state_name.replace(' ', '%20')}&operator={operator_arr[operator_id]}"
        url=f"https://digitalcatalog.paytm.com/dcat/v1/browseplans/mobile/7166?channel=web&version=2&child_site_id=1&site_id=1&locale=en-in&operator={operator_arr[operator_id]}&pageCount=1&itemsPerPage=20&sort_price=asce&pagination=1&circle={state_name.replace(' ', '%20')}"
        # print(url)
        response = requests.get(url)
        data = response.json()
        plans=data['groupings']
        k=k+1
        arr={}
        cirlce_plans=[]
        for plan in plans:
            plans_grouping=[]
            # plan["name"]
            for product in plan["productList"]:
                plans_grouping.append({
                    "amount": product["price"],
                    "validity": product["validity"],
                    "description": product["description"],
                    "talktime": product["talktime"],
                    "sms": product["sms"],
                    "disclaimer": product["disclaimer"],
                    "is_valid": 1
                })
            if plan["name"]=="Jio Cricket":
                arr.update({"Cricket":plans_grouping})
            else:
                arr.update({plan["name"]:plans_grouping})
            # print(plan["name"])
        
        # print(arr)
        # exit()
        # for i in range(len(arr)):
        #     for j in range(len(arr[i])):
        #         obj={
        #             "amount": arr[i][j]["price"], 
        #             "validity": arr[i][j]["validity"],
        #             "description": arr[i][j]["description"],
        #             "is_valid": 1
        #         }
        #         cirlce_plans.append(obj)
        circle_id=k
        

        mycol.update_one(
        { "operator_id": operator_id, "circles.circle_id": circle_id },
            # { "$set": { "circles.$.plan": cirlce_plans } },
            { "$set": { "circles.$.plan": arr } },
            upsert=True
        )
        print(f"{state_name} for {operator_arr[operator_id]}  and circle {circle_id} done")


        # with open(f"{state_name}.json", 'w') as f:
        #     json.dump(arr, f)




# collection.update_one(
#     {"_id": 1},
#     {"$push": {"scores": 89}}
# )
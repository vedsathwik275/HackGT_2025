import http.client

conn = http.client.HTTPSConnection("v1.american-football.api-sports.io")

headers = {
    'x-rapidapi-host': "v1.american-football.api-sports.io",
    'x-rapidapi-key': "a3e8954d27d2617f1669e265761f1457"
    }

conn.request("GET", "/teams?search=Derek", headers=headers)

res = conn.getresponse()
data = res.read()
print(data)
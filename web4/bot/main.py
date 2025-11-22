import requests
import os
import time

API_URL = f"{os.environ['URL']}/api" 
FLAG_FILE = "flag.png"

PASSWORD = os.urandom(16).hex()
USERNAME1 = "flagSharer"
USERNAME2 = "flagSubmiter"
users = [
    {"username": USERNAME1, "password": PASSWORD},
    {"username": USERNAME2, "password": PASSWORD}
]

tokens = {}

while(True):
    try:
        res = requests.get(f"{API_URL}")
        if res.status_code == 200:
            print("API is up")
            break
        time.sleep(1)
    except Exception as e:
        print("Waiting for API...", str(e))
      
for user in users:
    res = requests.post(f"{API_URL}/auth/register", json=user)
    if res.status_code == 201 or res.status_code == 200:
        token_cookie = res.cookies.get('token')
        if token_cookie:
            tokens[user["username"]] = token_cookie
        else:
            print(f"Warning: no token cookie for {user['username']}")
        print(f"User {user['username']} ready")
    elif res.json()['message'] == 'Пользователь с таким именем уже существует':  
        login_res = requests.post(f"{API_URL}/auth/login", json=user)
        print(login_res.json())
        token_cookie = login_res.cookies.get('token')
        if token_cookie:
            tokens[user["username"]] = token_cookie
        else:
            print(f"Warning: no token cookie for {user['username']} after login")
        print(f"User {user['username']} exists, logged in")
    else:
        print(res.status_code, res.text)
        raise Exception("Failed to create user")

chat_res = requests.post(
    f"{API_URL}/chats",
    cookies={"token": tokens[USERNAME1]},
    json={"username": USERNAME2}
)
if chat_res.ok:
    chat = chat_res.json()
    print(chat)
    chat_id = chat["chat"]['id']
    print("Chat ready:", chat_id)
else:
    print(chat_res.text)
    raise Exception("Failed to create chat")

with open(FLAG_FILE, "rb") as f:
    files = {"file": (FLAG_FILE, f)}
    res = requests.post(
        f"{API_URL}/chats/{chat_id}",
        cookies={"token": tokens[USERNAME1]},
        files=files,
        data={"text": "Я нашел флаг!"}
    )

if res.ok:
    print("Flag sent successfully!")
else:
    print(res.status_code, res.text)

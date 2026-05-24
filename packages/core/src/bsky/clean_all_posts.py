#!/usr/bin/env python3
"""Usuń WSZYSTKIE posty z Bluesky z paginacją."""
import requests, os, sys, time

BSKY_HOST = "https://bsky.social/xrpc"
IDENTIFIER = os.environ.get("BSKY_IDENTIFIER", "infonews24h.bsky.social")
PASSWORD = os.environ.get("BSKY_APP_PASSWORD", "4zox-xoqz-h5yl-matc")

r = requests.post(f"{BSKY_HOST}/com.atproto.server.createSession", json={
    "identifier": IDENTIFIER, "password": PASSWORD
})
r.raise_for_status()
session = r.json()
headers = {"Authorization": f"Bearer {session['accessJwt']}"}
print(f"✅ Zalogowano jako @{session['handle']}")

total_deleted = 0
cursor = None
max_pages = 20  # safety limit

for page in range(max_pages):
    # Fetch page of posts
    url = f"{BSKY_HOST}/app.bsky.feed.getAuthorFeed?actor={session['handle']}&limit=100&filter=posts_no_replies"
    if cursor:
        url += f"&cursor={cursor}"
    
    r = requests.get(url, headers=headers)
    r.raise_for_status()
    data = r.json()
    feed = data.get("feed", [])
    cursor = data.get("cursor")
    
    if not feed:
        print(f"📭 Brak więcej postów na stronie {page+1}")
        break
    
    posts = [(item["post"]["uri"], item["post"]["uri"].split("/")[-1]) for item in feed]
    print(f"📄 Strona {page+1}: {len(posts)} postów (cursor: {cursor})")
    
    for uri, rkey in posts:
        try:
            r2 = requests.post(f"{BSKY_HOST}/com.atproto.repo.deleteRecord", headers=headers, json={
                "repo": session["did"],
                "collection": "app.bsky.feed.post",
                "rkey": rkey,
            })
            if r2.status_code == 200:
                total_deleted += 1
                print(f"  🗑️  {rkey} ({total_deleted})")
            else:
                print(f"  ❌ {rkey}: {r2.status_code}")
        except Exception as e:
            print(f"  ❌ {rkey}: {e}")
    
    if not cursor:
        break
    time.sleep(0.5)  # rate limit safety

# Sprawdź wynik
time.sleep(1)
r3 = requests.get(f"{BSKY_HOST}/app.bsky.actor.getProfile?actor={session['handle']}", headers=headers)
remaining = r3.json().get("postsCount", "?")
print(f"\n✅ Usunięto {total_deleted} postów. Profil: {remaining} postów zostało")

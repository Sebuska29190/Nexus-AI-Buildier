#!/usr/bin/env python3
"""Usuń wszystkie posty z Bluesky."""
import requests, os, sys

BSKY_HOST = "https://bsky.social/xrpc"
IDENTIFIER = os.environ.get("BSKY_IDENTIFIER", "infonews24h.bsky.social")
PASSWORD = os.environ.get("BSKY_APP_PASSWORD", "4zox-xoqz-h5yl-matc")

# Logowanie
r = requests.post(f"{BSKY_HOST}/com.atproto.server.createSession", json={
    "identifier": IDENTIFIER, "password": PASSWORD
})
r.raise_for_status()
session = r.json()
print(f"✅ Zalogowano jako @{session['handle']}")

headers = {"Authorization": f"Bearer {session['accessJwt']}"}

# Pobierz wszystkie posty (max 100)
r = requests.get(f"{BSKY_HOST}/app.bsky.feed.getAuthorFeed?actor={session['handle']}&limit=100&filter=posts_no_replies", headers=headers)
r.raise_for_status()
feed = r.json().get("feed", [])
posts = [(item["post"]["uri"], item["post"]["uri"].split("/")[-1]) for item in feed]

if not posts:
    print("✅ Brak postów do usunięcia")
    sys.exit(0)

print(f"📋 Znaleziono {len(posts)} postów")

# Usuń każdy
deleted = 0
for uri, rkey in posts:
    try:
        r = requests.post(f"{BSKY_HOST}/com.atproto.repo.deleteRecord", headers=headers, json={
            "repo": session["did"],
            "collection": "app.bsky.feed.post",
            "rkey": rkey,
        })
        if r.status_code == 200:
            deleted += 1
            print(f"  🗑️  {rkey}", end="")
            if deleted % 10 == 0:
                print(f" — {deleted}/{len(posts)}")
            else:
                print()
        else:
            print(f"  ❌ {rkey}: {r.status_code} {r.text[:50]}")
    except Exception as e:
        print(f"  ❌ {rkey}: {e}")

print(f"\n✅ Usunięto {deleted}/{len(posts)} postów")

---
id: feature-1779632188314-9330a5
title: File Created: bsky_login.py
category: feature
created_at: 2026-05-24T14:16:28.314Z
source: workspace
tags: [workspace, file-created, py]
---

Created file `bsky_login.py` in workspace

```
#!/usr/bin/env python3
"""Bluesky login script using AT Protocol (atproto)"""

import json
import sys
from atproto import Client, models

def main():
    identifier = "infonews24h.bsky.social"
    password = "4zox-xoqz-h5yl-matc"
    
    try:
        client = Client()
        profile = client.login(identifier, password)
        
        print("=" * 60)
        print("✅ BLUESKY LOGIN SUCCESSFUL!")
        print("=" * 60)
        print(f"  DID:       {profile.did}")
        print(f"  Handle:    {
```

#!/usr/bin/env bun
import { serve } from "@hono/node-server";
const s = serve({ fetch: (req) => new Response("ok"), port: 4199 });
console.log("test server running on", s.port);

import { Database } from "bun:sqlite";

const db = new Database("./nova.db");
const rows = db.query("SELECT id, name, emoji FROM agents ORDER BY name").all();

console.log("All agents from DB:");
console.log(JSON.stringify(rows, null, 2));

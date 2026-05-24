/**
 * Social Media Manager — browser-based automation for posting to any social platform.
 *
 * How it works:
 * 1. User clicks "Add Account" → browser opens to the platform's login page
 * 2. User logs in manually → browser profile (cookies) saved to disk
 * 3. Subsequent posts use the saved profile → no re-login needed
 * 4. Each platform has a "script" (navigation steps) for posting
 */

import { existsSync, readFileSync, writeFileSync, mkdirSync, unlinkSync } from "node:fs";
import { join } from "node:path";

const SOCIAL_DIR = join(process.cwd(), "data", "social");
mkdirSync(SOCIAL_DIR, { recursive: true });

export interface SocialAccount {
  id: string;
  name: string;
  platform: string; // "tiktok", "instagram", "youtube", "linkedin", etc.
  profileDir: string; // path to browser profile directory
  username?: string;
  avatar?: string;
  createdAt: string;
  lastUsed?: string;
}

const accounts: SocialAccount[] = [];
const ACCOUNTS_FILE = join(SOCIAL_DIR, "accounts.json");

function loadAccounts(): void {
  try {
    if (existsSync(ACCOUNTS_FILE)) {
      const data = JSON.parse(readFileSync(ACCOUNTS_FILE, "utf-8"));
      accounts.length = 0;
      accounts.push(...data);
    }
  } catch {}
}

function saveAccounts(): void {
  try {
    writeFileSync(ACCOUNTS_FILE, JSON.stringify(accounts, null, 2), "utf-8");
  } catch {}
}

loadAccounts();

export function listAccounts(): SocialAccount[] {
  return [...accounts];
}

export function getAccount(id: string): SocialAccount | undefined {
  return accounts.find(a => a.id === id);
}

export function addAccount(params: {
  name: string;
  platform: string;
  username?: string;
}): SocialAccount {
  const id = `social_${Date.now().toString(36)}`;
  const profileDir = join(SOCIAL_DIR, "profiles", id);
  mkdirSync(profileDir, { recursive: true });

  const account: SocialAccount = {
    id,
    name: params.name,
    platform: params.platform,
    profileDir,
    username: params.username,
    createdAt: new Date().toISOString(),
  };

  accounts.push(account);
  saveAccounts();
  return account;
}

export function removeAccount(id: string): boolean {
  const idx = accounts.findIndex(a => a.id === id);
  if (idx === -1) return false;
  const account = accounts[idx];
  // Remove profile directory
  try {
    const fs = require("node:fs");
    fs.rmSync(account.profileDir, { recursive: true, force: true });
  } catch {}
  accounts.splice(idx, 1);
  saveAccounts();
  return true;
}

export function updateAccount(id: string, updates: Partial<SocialAccount>): SocialAccount | undefined {
  const account = accounts.find(a => a.id === id);
  if (!account) return undefined;
  Object.assign(account, updates);
  account.lastUsed = new Date().toISOString();
  saveAccounts();
  return account;
}

// ── Browser Profile Manager ──────────────────────────────
// Returns the path to a Chrome user data dir for the given account
export function getProfilePath(accountId: string): string | null {
  const account = getAccount(accountId);
  return account ? account.profileDir : null;
}

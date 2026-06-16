/**
 * OAuth 2.0 Flow Manager for Integrations
 * Supports: authorization code flow, token refresh, PKCE
 */
import { Database } from "bun:sqlite";
import { randomUUID } from "node:crypto";
import { createHash } from "node:crypto";

const db = new Database("nova.db");
db.run(`CREATE TABLE IF NOT EXISTS oauth_tokens (
  id TEXT PRIMARY KEY,
  integration_id TEXT NOT NULL,
  service TEXT NOT NULL,
  access_token TEXT,
  refresh_token TEXT,
  expires_at TEXT,
  token_type TEXT DEFAULT 'Bearer',
  scopes TEXT,
  created_at TEXT NOT NULL,
  FOREIGN KEY (integration_id) REFERENCES integrations(id)
)`);

export interface OAuthConfig {
  clientId: string;
  clientSecret?: string;
  authorizeUrl: string;
  tokenUrl: string;
  scopes: string[];
  redirectUri: string;
  usePKCE?: boolean;
}

export interface OAuthToken {
  accessToken: string;
  refreshToken?: string;
  expiresAt?: string;
  tokenType: string;
  scopes?: string[];
}

// Pre-configured OAuth services
export const OAUTH_CONFIGS: Record<string, OAuthConfig> = {
  github: {
    clientId: "",
    authorizeUrl: "https://github.com/login/oauth/authorize",
    tokenUrl: "https://github.com/login/oauth/access_token",
    scopes: ["repo", "read:user", "user:email"],
    redirectUri: "http://localhost:4123/api/integrations/oauth/callback",
  },
  google: {
    clientId: "",
    authorizeUrl: "https://accounts.google.com/o/oauth2/v2/auth",
    tokenUrl: "https://oauth2.googleapis.com/token",
    scopes: ["openid", "email", "profile", "https://www.googleapis.com/auth/calendar", "https://www.googleapis.com/auth/drive"],
    redirectUri: "http://localhost:4123/api/integrations/oauth/callback",
  },
  notion: {
    clientId: "",
    authorizeUrl: "https://api.notion.com/v1/oauth/authorize",
    tokenUrl: "https://api.notion.com/v1/oauth/token",
    scopes: [],
    redirectUri: "http://localhost:4123/api/integrations/oauth/callback",
  },
  linear: {
    clientId: "",
    authorizeUrl: "https://linear.app/oauth/authorize",
    tokenUrl: "https://api.linear.app/oauth/token",
    scopes: ["read", "write"],
    redirectUri: "http://localhost:4123/api/integrations/oauth/callback",
  },
  slack: {
    clientId: "",
    authorizeUrl: "https://slack.com/oauth/v2/authorize",
    tokenUrl: "https://slack.com/api/oauth.v2.access",
    scopes: ["chat:write", "channels:read", "files:read"],
    redirectUri: "http://localhost:4123/api/integrations/oauth/callback",
  },
  discord: {
    clientId: "",
    authorizeUrl: "https://discord.com/api/oauth2/authorize",
    tokenUrl: "https://discord.com/api/oauth2/token",
    scopes: ["identify", "email", "bot"],
    redirectUri: "http://localhost:4123/api/integrations/oauth/callback",
  },
  stripe: {
    clientId: "",
    authorizeUrl: "https://accounts.stripe.com/oauth/authorize",
    tokenUrl: "https://accounts.stripe.com/oauth/token",
    scopes: ["read_write"],
    redirectUri: "http://localhost:4123/api/integrations/oauth/callback",
  },
  hubspot: {
    clientId: "",
    authorizeUrl: "https://app.hubspot.com/oauth/authorize",
    tokenUrl: "https://api.hubapi.com/oauth/v1/token",
    scopes: ["crm", "content", "automation"],
    redirectUri: "http://localhost:4123/api/integrations/oauth/callback",
  },
  shopify: {
    clientId: "",
    authorizeUrl: "https://{shop}.myshopify.com/admin/oauth/authorize",
    tokenUrl: "https://{shop}.myshopify.com/admin/oauth/access_token",
    scopes: ["read_products", "write_products", "read_orders", "write_orders"],
    redirectUri: "http://localhost:4123/api/integrations/oauth/callback",
  },
  airtable: {
    clientId: "",
    authorizeUrl: "https://airtable.com/oauth2/authorize",
    tokenUrl: "https://airtable.com/oauth2/token",
    scopes: ["data.records:read", "data.records:write", "schema.bases:read"],
    redirectUri: "http://localhost:4123/api/integrations/oauth/callback",
  },
  clickup: {
    clientId: "",
    authorizeUrl: "https://app.clickup.com/api",
    tokenUrl: "https://api.clickup.com/api/v2/oauth/token",
    scopes: [],
    redirectUri: "http://localhost:4123/api/integrations/oauth/callback",
  },
  asana: {
    clientId: "",
    authorizeUrl: "https://app.asana.com/-/oauth_authorize",
    tokenUrl: "https://app.asana.com/-/oauth_token",
    scopes: ["default"],
    redirectUri: "http://localhost:4123/api/integrations/oauth/callback",
  },
  figma: {
    clientId: "",
    authorizeUrl: "https://www.figma.com/oauth",
    tokenUrl: "https://www.figma.com/api/oauth/token",
    scopes: ["file_read"],
    redirectUri: "http://localhost:4123/api/integrations/oauth/callback",
  },
};

class OAuthManager {
  // Generate authorization URL
  getAuthorizeUrl(service: string, state?: string): { url: string; codeVerifier?: string } {
    const config = OAUTH_CONFIGS[service];
    if (!config) throw new Error(`No OAuth config for: ${service}`);

    const params = new URLSearchParams({
      client_id: config.clientId,
      redirect_uri: config.redirectUri,
      response_type: "code",
      state: state || randomUUID().slice(0, 8),
    });

    if (config.scopes.length > 0) {
      params.set("scope", config.scopes.join(" "));
    }

    let codeVerifier: string | undefined;
    if (config.usePKCE) {
      codeVerifier = this.generateCodeVerifier();
      const challenge = this.generateCodeChallenge(codeVerifier);
      params.set("code_challenge", challenge);
      params.set("code_challenge_method", "S256");
    }

    return { url: `${config.authorizeUrl}?${params.toString()}`, codeVerifier };
  }

  // Exchange authorization code for tokens
  async exchangeCode(service: string, code: string, codeVerifier?: string): Promise<OAuthToken> {
    const config = OAUTH_CONFIGS[service];
    if (!config) throw new Error(`No OAuth config for: ${service}`);

    const body: Record<string, string> = {
      grant_type: "authorization_code",
      code,
      redirect_uri: config.redirectUri,
      client_id: config.clientId,
    };

    if (config.clientSecret) body.client_secret = config.clientSecret;
    if (codeVerifier) body.code_verifier = codeVerifier;

    const response = await fetch(config.tokenUrl, {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded", "Accept": "application/json" },
      body: new URLSearchParams(body).toString(),
      signal: AbortSignal.timeout(15000),
    });

    if (!response.ok) {
      const err = await response.text();
      throw new Error(`OAuth token exchange failed: ${err}`);
    }

    const data = await response.json();
    return {
      accessToken: data.access_token,
      refreshToken: data.refresh_token,
      expiresAt: data.expires_in ? new Date(Date.now() + data.expires_in * 1000).toISOString() : undefined,
      tokenType: data.token_type || "Bearer",
      scopes: data.scope?.split(" ") || config.scopes,
    };
  }

  // Refresh an expired token
  async refreshToken(service: string, refreshToken: string): Promise<OAuthToken> {
    const config = OAUTH_CONFIGS[service];
    if (!config) throw new Error(`No OAuth config for: ${service}`);

    const body: Record<string, string> = {
      grant_type: "refresh_token",
      refresh_token: refreshToken,
      client_id: config.clientId,
    };
    if (config.clientSecret) body.client_secret = config.clientSecret;

    const response = await fetch(config.tokenUrl, {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded", "Accept": "application/json" },
      body: new URLSearchParams(body).toString(),
      signal: AbortSignal.timeout(15000),
    });

    if (!response.ok) throw new Error("Token refresh failed");
    const data = await response.json();

    return {
      accessToken: data.access_token,
      refreshToken: data.refresh_token || refreshToken,
      expiresAt: data.expires_in ? new Date(Date.now() + data.expires_in * 1000).toISOString() : undefined,
      tokenType: data.token_type || "Bearer",
    };
  }

  // Store tokens
  storeTokens(integrationId: string, service: string, token: OAuthToken): void {
    db.run("DELETE FROM oauth_tokens WHERE integration_id = ?", [integrationId]);
    db.run(
      "INSERT INTO oauth_tokens (id, integration_id, service, access_token, refresh_token, expires_at, token_type, scopes, created_at) VALUES (?,?,?,?,?,?,?,?,?)",
      [randomUUID().slice(0, 12), integrationId, service, token.accessToken, token.refreshToken || null, token.expiresAt || null, token.tokenType, JSON.stringify(token.scopes || []), new Date().toISOString()]
    );
  }

  // Get stored token
  getTokens(integrationId: string): OAuthToken | null {
    const row = db.query("SELECT * FROM oauth_tokens WHERE integration_id = ?").get(integrationId) as any;
    if (!row) return null;
    return {
      accessToken: row.access_token,
      refreshToken: row.refresh_token,
      expiresAt: row.expires_at,
      tokenType: row.token_type,
      scopes: JSON.parse(row.scopes || "[]"),
    };
  }

  // Auto-refresh if expired
  async getValidToken(integrationId: string, service: string): Promise<string | null> {
    let token = this.getTokens(integrationId);
    if (!token) return null;

    // Check if expired (with 5 min buffer)
    if (token.expiresAt && new Date(token.expiresAt).getTime() < Date.now() + 300000) {
      if (token.refreshToken) {
        try {
          token = await this.refreshToken(service, token.refreshToken);
          this.storeTokens(integrationId, service, token);
        } catch {
          return null;
        }
      } else {
        return null;
      }
    }

    return token.accessToken;
  }

  private generateCodeVerifier(): string {
    const array = new Uint8Array(32);
    crypto.getRandomValues(array);
    return this.base64UrlEncode(array);
  }

  private generateCodeChallenge(verifier: string): string {
    const hash = createHash("sha256").update(verifier).digest();
    return this.base64UrlEncode(hash);
  }

  private base64UrlEncode(buffer: Uint8Array): string {
    return Buffer.from(buffer).toString("base64url");
  }
}

export const oauthManager = new OAuthManager();

import crypto from "crypto";

export interface GDriveUploadResult {
  ok: boolean;
  fileId?: string;
  webViewLink?: string;
  error?: string;
}

function base64UrlEncode(strOrBuffer: string | Buffer): string {
  const buf = typeof strOrBuffer === "string" ? Buffer.from(strOrBuffer) : strOrBuffer;
  return buf
    .toString("base64")
    .replace(/=/g, "")
    .replace(/\+/g, "-")
    .replace(/\//g, "_");
}

/**
 * Generates an OAuth2 access token for Google Drive API using a Service Account Key (RS256 JWT).
 * This access token is fetched on demand and never expires long-term (suitable for 5-6+ years of background cron execution).
 */
async function getAccessTokenFromServiceAccount(
  clientEmail: string,
  privateKeyRaw: string
): Promise<string> {
  const privateKey = privateKeyRaw.replace(/\\n/g, "\n");
  const now = Math.floor(Date.now() / 1000);

  const header = base64UrlEncode(JSON.stringify({ alg: "RS256", typ: "JWT" }));
  const payload = base64UrlEncode(
    JSON.stringify({
      iss: clientEmail,
      scope: "https://www.googleapis.com/auth/drive.file",
      aud: "https://oauth2.googleapis.com/token",
      exp: now + 3600,
      iat: now,
    })
  );

  const unsignedToken = `${header}.${payload}`;
  const signer = crypto.createSign("RSA-SHA256");
  signer.update(unsignedToken);
  const signature = base64UrlEncode(signer.sign(privateKey));
  const jwt = `${unsignedToken}.${signature}`;

  const res = await fetch("https://oauth2.googleapis.com/token", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      grant_type: "urn:ietf:params:oauth:grant-type:jwt-bearer",
      assertion: jwt,
    }),
  });

  if (!res.ok) {
    const errText = await res.text();
    throw new Error(`Google Service Account Token Error (${res.status}): ${errText}`);
  }

  const data = await res.json();
  return data.access_token;
}

/**
 * Exchanges a Google OAuth2 Refresh Token for a fresh access token.
 */
async function getAccessTokenFromRefreshToken(
  clientId: string,
  clientSecret: string,
  refreshToken: string
): Promise<string> {
  const res = await fetch("https://oauth2.googleapis.com/token", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      client_id: clientId,
      client_secret: clientSecret,
      refresh_token: refreshToken,
      grant_type: "refresh_token",
    }),
  });

  if (!res.ok) {
    const errText = await res.text();
    throw new Error(`Google Refresh Token Error (${res.status}): ${errText}`);
  }

  const data = await res.json();
  return data.access_token;
}

/**
 * Resolves a valid Google Drive Access Token using available environment credentials:
 * 1. Service Account (Email + Private Key)
 * 2. OAuth Refresh Token (Client ID + Client Secret + Refresh Token)
 * 3. Direct Access Token (provided parameter or env variable)
 */
export async function resolveGoogleDriveAccessToken(providedToken?: string): Promise<string | null> {
  const refreshToken = process.env.GOOGLE_DRIVE_REFRESH_TOKEN;
  const clientId = process.env.GOOGLE_DRIVE_CLIENT_ID;
  const clientSecret = process.env.GOOGLE_DRIVE_CLIENT_SECRET;

  if (refreshToken && clientId && clientSecret) {
    try {
      return await getAccessTokenFromRefreshToken(clientId, clientSecret, refreshToken);
    } catch (e: any) {
      console.error("[gdrive-sync] Failed to obtain access token from Refresh Token:", e.message);
    }
  }

  const serviceEmail = process.env.GOOGLE_DRIVE_SERVICE_ACCOUNT_EMAIL;
  const serviceKey = process.env.GOOGLE_DRIVE_PRIVATE_KEY;

  if (serviceEmail && serviceKey) {
    try {
      return await getAccessTokenFromServiceAccount(serviceEmail, serviceKey);
    } catch (e: any) {
      console.error("[gdrive-sync] Failed to obtain access token from Service Account:", e.message);
    }
  }

  const envToken =
    providedToken ||
    process.env.GOOGLE_DRIVE_ACCESS_TOKEN ||
    process.env.MASTER_GOOGLE_DRIVE_TOKEN;

  return envToken || null;
}

/**
 * Returns environment configuration status of Google Drive integration for the admin dashboard.
 */
export function getGoogleDriveEnvInfo() {
  const hasServiceAccount = Boolean(
    process.env.GOOGLE_DRIVE_SERVICE_ACCOUNT_EMAIL && process.env.GOOGLE_DRIVE_PRIVATE_KEY
  );
  const hasRefreshToken = Boolean(
    process.env.GOOGLE_DRIVE_REFRESH_TOKEN &&
      process.env.GOOGLE_DRIVE_CLIENT_ID &&
      process.env.GOOGLE_DRIVE_CLIENT_SECRET
  );
  const hasDirectToken = Boolean(
    process.env.GOOGLE_DRIVE_ACCESS_TOKEN || process.env.MASTER_GOOGLE_DRIVE_TOKEN
  );
  const folderId =
    process.env.GOOGLE_DRIVE_FOLDER_ID || process.env.MASTER_GOOGLE_DRIVE_FOLDER_ID || null;

  const isConfigured = hasServiceAccount || hasRefreshToken || hasDirectToken;
  const authMethod = hasRefreshToken
    ? "OAuth Refresh Token (Automated)"
    : hasServiceAccount
    ? "Service Account (Automated)"
    : hasDirectToken
    ? "Direct Access Token"
    : "None";

  return {
    isConfigured,
    authMethod,
    folderId,
    serviceAccountEmail: process.env.GOOGLE_DRIVE_SERVICE_ACCOUNT_EMAIL || null,
  };
}

/**
 * Uploads a file buffer directly to Google Drive via Google Drive v3 REST API.
 */
export async function uploadToGoogleDrive(params: {
  accessToken?: string;
  fileName: string;
  fileBuffer: Buffer;
  folderId?: string;
}): Promise<GDriveUploadResult> {
  const { fileName, fileBuffer } = params;

  try {
    const accessToken = await resolveGoogleDriveAccessToken(params.accessToken);

    if (!accessToken) {
      return {
        ok: false,
        error:
          "Google Drive connection not configured. Please set GOOGLE_DRIVE_SERVICE_ACCOUNT_EMAIL & GOOGLE_DRIVE_PRIVATE_KEY (or GOOGLE_DRIVE_ACCESS_TOKEN) in environment variables.",
      };
    }

    const folderId =
      params.folderId ||
      process.env.GOOGLE_DRIVE_FOLDER_ID ||
      process.env.MASTER_GOOGLE_DRIVE_FOLDER_ID;

    const metadata: Record<string, any> = {
      name: fileName,
      mimeType: "application/zip",
    };
    if (folderId) {
      metadata.parents = [folderId];
    }

    // Step 1: Create file metadata entry in target folder
    const createRes = await fetch(
      "https://www.googleapis.com/drive/v3/files?supportsAllDrives=true&fields=id,name,webViewLink",
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${accessToken}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify(metadata),
      }
    );

    if (!createRes.ok) {
      const errText = await createRes.text();
      return { ok: false, error: `Google Drive API Create Error (${createRes.status}): ${errText}` };
    }

    const createdFile = await createRes.json();
    const fileId = createdFile.id;

    // Step 2: Upload content bytes into the created file entry
    const patchRes = await fetch(
      `https://www.googleapis.com/upload/drive/v3/files/${fileId}?uploadType=media&supportsAllDrives=true&fields=id,name,webViewLink`,
      {
        method: "PATCH",
        headers: {
          Authorization: `Bearer ${accessToken}`,
          "Content-Type": "application/zip",
        },
        body: new Uint8Array(fileBuffer),
      }
    );

    if (!patchRes.ok) {
      const patchErr = await patchRes.text();
      return {
        ok: false,
        error: `Google Drive Media Upload Failed (${patchRes.status}): ${patchErr}`,
      };
    }

    const json = await patchRes.json();
    return {
      ok: true,
      fileId: json.id || fileId,
      webViewLink: json.webViewLink || createdFile.webViewLink,
    };
  } catch (error: any) {
    return {
      ok: false,
      error: error.message || String(error),
    };
  }
}


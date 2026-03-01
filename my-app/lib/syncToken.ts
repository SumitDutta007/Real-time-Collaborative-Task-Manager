import { authApi } from "./api";

interface UserInfo {
  email: string;
  name: string;
  image?: string | null;
}

/**
 * Decode a JWT payload without verifying the signature.
 * Safe to use client-side just to read the `email` claim.
 */
function decodeJwtEmail(token: string): string | null {
  try {
    const payload = token.split(".")[1];
    // atob requires standard base64; JWT uses base64url — replace chars
    const json = atob(payload.replace(/-/g, "+").replace(/_/g, "/"));
    const parsed = JSON.parse(json);
    return parsed.email ?? null;
  } catch {
    return null;
  }
}

/**
 * Ensures a valid JWT token for THIS user is stored in localStorage.
 * Handles three cases:
 *  1. No token → sync with backend to get one.
 *  2. Token exists but belongs to a DIFFERENT user (e.g. another tab was
 *     logged in as someone else) → clear it and re-sync.
 *  3. Token is for the right user but may be expired → verify with backend,
 *     re-sync if rejected.
 */
export async function syncBackendToken(user: UserInfo): Promise<void> {
  const existingToken = localStorage.getItem("token");

  if (existingToken) {
    // First: check whose token this is without a network round-trip
    const tokenEmail = decodeJwtEmail(existingToken);
    if (tokenEmail && tokenEmail !== user.email) {
      // Wrong user — clear immediately and fall through to re-sync
      console.warn(
        `Token belongs to ${tokenEmail}, but current user is ${user.email}. Re-syncing…`
      );
      localStorage.removeItem("token");
    } else {
      // Right user (or couldn't decode) — verify it's still valid on backend
      try {
        await authApi.verifyToken();
        return; // token is good
      } catch {
        console.warn("Stored token is invalid or expired, re-syncing…");
        localStorage.removeItem("token");
      }
    }
  }

  try {
    const response = await authApi.syncUser({
      email: user.email,
      name: user.name,
      image: user.image,
    });
    if (response.data.token) {
      localStorage.setItem("token", response.data.token);
    }
  } catch (error) {
    console.error("Failed to sync token with backend:", error);
  }
}

import { env } from "@/config/env";

/**
 * GET /api/auth/google
 *
 * Mục đích: Redirect user tới Google OAuth consent screen
 *
 * Flow:
 * 1. Frontend click "Sign in Google" → GET /api/auth/google
 * 2. Tạo OAuth URL với params: client_id, redirect_uri, scope, etc
 * 3. Redirect user tới Google: https://accounts.google.com/o/oauth2/v2/auth?...
 * 4. User login Google → Google redirect back tới /api/auth/google/callback?code=XXX
 */
export const GET = () => {
  // Step 1: Lấy client_id từ env
  const clientId = env.NEXT_PUBLIC_GOOGLE_CLIENT_ID;

  // Step 2: Tạo redirect_uri (Google sẽ redirect về đây sau user login)
  const redirectUri = `${env.NEXT_PUBLIC_APP_URL}/api/auth/google/callback`;

  // Step 3: Tạo OAuth URL parameters
  const params = new URLSearchParams({
    client_id: clientId,
    redirect_uri: redirectUri,
    response_type: "code", // Yêu cầu authorization code (không phải token trực tiếp)
    scope: "openid email profile", // Quyền lấy: openid, email, profile info
    access_type: "offline", // Lấy refresh token để access offline
  });

  // Step 4: Redirect tới Google OAuth screen
  return Response.redirect(`https://accounts.google.com/o/oauth2/v2/auth?${params}`);
};

import { env } from "@/config/env";

// Starts the Google OAuth flow by redirecting the user to Google's consent screen.
export const GET = () => {
  const clientId = env.NEXT_PUBLIC_GOOGLE_CLIENT_ID;
  const redirectUri = `${env.NEXT_PUBLIC_APP_URL}/api/auth/google/callback`;

  const params = new URLSearchParams({
    client_id: clientId,
    redirect_uri: redirectUri,
    response_type: "code",
    scope: "openid email profile",
    access_type: "offline",
  });

  return Response.redirect(`https://accounts.google.com/o/oauth2/v2/auth?${params}`);
};

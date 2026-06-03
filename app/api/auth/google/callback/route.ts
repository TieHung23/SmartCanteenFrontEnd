import { env } from "@/config/env";

type GoogleIdTokenPayload = {
  email?: string;
  hd?: string;
};

const getGoogleEmail = (idToken: string) => {
  const payloadPart = idToken.split(".")[1];

  if (!payloadPart) {
    return null;
  }

  try {
    const normalizedPayload = payloadPart.replace(/-/g, "+").replace(/_/g, "/");
    const paddedPayload = normalizedPayload.padEnd(
      normalizedPayload.length + ((4 - (normalizedPayload.length % 4)) % 4),
      "=",
    );

    const payload = JSON.parse(
      Buffer.from(paddedPayload, "base64").toString("utf8"),
    ) as GoogleIdTokenPayload;

    return payload.email ?? null;
  } catch {
    return null;
  }
};

// Handle Google OAuth callback: exchange code for id_token, send id_token to backend,
// receive access token and redirect the client to the completion page with the token.
export const GET = async (request: Request) => {
  const { searchParams } = new URL(request.url);
  const code = searchParams.get("code");
  const error = searchParams.get("error");

  if (error) {
    console.error("[OAuth] Google error:", error);
    return Response.redirect(`${env.NEXT_PUBLIC_APP_URL}/login?error=${error}`);
  }

  if (!code) {
    console.error("[OAuth] No authorization code received");
    return Response.redirect(`${env.NEXT_PUBLIC_APP_URL}/login?error=no_code`);
  }

  try {
    console.log("[OAuth] Received code from Google, exchanging with Google token endpoint...");

    const tokenResponse = await fetch("https://oauth2.googleapis.com/token", {
      method: "POST",
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
      },
      body: new URLSearchParams({
        code,
        client_id: env.NEXT_PUBLIC_GOOGLE_CLIENT_ID,
        client_secret: env.GOOGLE_CLIENT_SECRET,
        redirect_uri: `${env.NEXT_PUBLIC_APP_URL}/api/auth/google/callback`,
        grant_type: "authorization_code",
      }),
    });

    if (!tokenResponse.ok) {
      const errorText = await tokenResponse.text();
      console.error("[OAuth] Google token exchange failed:", tokenResponse.status, errorText);
      return Response.redirect(`${env.NEXT_PUBLIC_APP_URL}/login?error=google_token_error`);
    }

    const googleTokenData = await tokenResponse.json();
    const idToken = googleTokenData.id_token;

    if (!idToken) {
      console.error("[OAuth] Google response did not include id_token");
      return Response.redirect(`${env.NEXT_PUBLIC_APP_URL}/login?error=no_id_token`);
    }

    const email = getGoogleEmail(idToken);

    if (!email || !email.toLowerCase().endsWith("@fpt.edu.vn")) {
      console.error("[OAuth] Google account is not allowed:", email);
      return Response.redirect(`${env.NEXT_PUBLIC_APP_URL}/login?error=google_domain_invalid`);
    }

    const backendResponse = await fetch(`${env.NEXT_PUBLIC_API_URL}/api/Auth/google`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ IdToken: idToken }),
    });

    if (!backendResponse.ok) {
      const errorText = await backendResponse.text();
      console.error("[OAuth] Backend exchange failed:", backendResponse.status, errorText);
      return Response.redirect(`${env.NEXT_PUBLIC_APP_URL}/login?error=backend_error`);
    }

    const backendBodyText = await backendResponse.text();
    let backendData: unknown = null;

    try {
      backendData = backendBodyText ? JSON.parse(backendBodyText) : null;
    } catch {
      backendData = backendBodyText;
    }

    const accessToken =
      (typeof backendData === "string" ? backendData : null) ??
      (typeof backendData === "object" && backendData !== null
        ? ((
            backendData as {
              token?: string;
              accessToken?: string;
              access_token?: string;
              value?: {
                token?: string;
                accessToken?: string;
                access_token?: string;
              };
              data?: {
                token?: string;
                accessToken?: string;
                access_token?: string;
              };
            }
          ).data?.token ??
          (
            backendData as {
              value?: { token?: string; accessToken?: string; access_token?: string };
            }
          ).value?.token ??
          (
            backendData as {
              value?: { token?: string; accessToken?: string; access_token?: string };
            }
          ).value?.accessToken ??
          (
            backendData as {
              value?: { token?: string; accessToken?: string; access_token?: string };
            }
          ).value?.access_token ??
          (backendData as { token?: string; accessToken?: string; access_token?: string }).token ??
          (backendData as { token?: string; accessToken?: string; access_token?: string })
            .accessToken ??
          (backendData as { token?: string; accessToken?: string; access_token?: string })
            .access_token)
        : null);

    if (!accessToken) {
      console.error("[OAuth] Backend didn't return token", backendBodyText);
      return Response.redirect(`${env.NEXT_PUBLIC_APP_URL}/login?error=no_token`);
    }

    const redirectUrl = new URL(`${env.NEXT_PUBLIC_APP_URL}/auth/google/complete`);
    redirectUrl.searchParams.set("token", accessToken);

    return Response.redirect(redirectUrl);
  } catch (error) {
    console.error("[OAuth] Unexpected error:", error);
    return Response.redirect(`${env.NEXT_PUBLIC_APP_URL}/login?error=server_error`);
  }
};

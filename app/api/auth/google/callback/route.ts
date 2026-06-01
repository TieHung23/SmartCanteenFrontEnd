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

/**
 * GET /api/auth/google/callback?code=...
 *
 * Mục đích: Nhận authorization code từ Google, exchange với Google để lấy id_token,
 * rồi gửi id_token sang backend
 *
 * Flow:
 * 1. Google redirect về đây với ?code=XXX (authorization code)
 * 2. Exchange code với Google token endpoint bằng client_secret
 * 3. Lấy id_token từ Google response
 * 4. Gửi id_token tới backend /api/Auth/google
 * 5. Backend trả accessToken
 * 6. Lưu token vào redirect URL param
 * 7. Redirect tới /auth/google/complete?token=XXX (client-side xử lý)
 */
export const GET = async (request: Request) => {
  // Step 1: Parse query params từ URL
  const { searchParams } = new URL(request.url);
  const code = searchParams.get("code");
  const error = searchParams.get("error");

  // Step 2: Check có lỗi từ Google không
  if (error) {
    console.error("[OAuth] Google error:", error);
    // Redirect về login page với error param
    return Response.redirect(`${env.NEXT_PUBLIC_APP_URL}/login?error=${error}`);
  }

  // Step 3: Check có code không
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

    /**
     * Step 4: Gửi id_token tới backend
     *
     * Tại sao gửi tới backend?
     * - Backend đang validate Google ID token
     * - ID token được Google ký, backend có thể verify an toàn
     * - Backend trả token mà frontend không thể fake
     */
    const backendResponse = await fetch(`${env.NEXT_PUBLIC_API_URL}/api/Auth/google`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ IdToken: idToken }),
    });

    // Step 5: Check backend response có OK không
    if (!backendResponse.ok) {
      const errorText = await backendResponse.text();
      console.error("[OAuth] Backend exchange failed:", backendResponse.status, errorText);
      return Response.redirect(`${env.NEXT_PUBLIC_APP_URL}/login?error=backend_error`);
    }

    // Step 6: Parse token từ backend response
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

    /**
     * Step 7: Redirect tới complete page với token
     *
     * Tại sao không lưu token ở đây?
     * - Đây là server route, không có access tới localStorage
     * - Phải gửi token qua URL/cookie để client lưu
     * - Complete page là client component → có thể access localStorage
     */
    const redirectUrl = new URL(`${env.NEXT_PUBLIC_APP_URL}/auth/google/complete`);
    redirectUrl.searchParams.set("token", accessToken);

    return Response.redirect(redirectUrl);
  } catch (error) {
    console.error("[OAuth] Unexpected error:", error);
    return Response.redirect(`${env.NEXT_PUBLIC_APP_URL}/login?error=server_error`);
  }
};

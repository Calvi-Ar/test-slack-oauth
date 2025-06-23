import { NextRequest, NextResponse } from "next/server";
import axios from "axios";

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const code = searchParams.get("code");
  const state = searchParams.get("state");
  const error = searchParams.get("error");

  console.log("OAuth callback received:", { code: !!code, state, error });

  // Check for OAuth errors
  if (error) {
    console.error("OAuth error from Slack:", error);
    return NextResponse.redirect(new URL(`/?error=${error}`, request.url));
  }

  // Validate required parameters
  if (!code) {
    console.error("Missing authorization code");
    return NextResponse.redirect(new URL("/?error=missing_code", request.url));
  }

  try {
    // Check environment variables
    const clientId = process.env.NEXT_PUBLIC_SLACK_CLIENT_ID;
    const clientSecret = process.env.SLACK_CLIENT_SECRET;
    const redirectUri =
      process.env.SLACK_REDIRECT_URI ||
      `${request.nextUrl.origin}/api/auth/callback`;

    console.log("Environment check:", {
      hasClientId: !!clientId,
      hasClientSecret: !!clientSecret,
      redirectUri,
    });

    if (!clientId || !clientSecret) {
      console.error("Missing environment variables");
      return NextResponse.redirect(
        new URL("/?error=config_error", request.url)
      );
    }

    // Exchange the authorization code for an access token using OpenID Connect
    const tokenResponse = await axios.post(
      "https://slack.com/api/openid.connect.token",
      new URLSearchParams({
        client_id: clientId,
        client_secret: clientSecret,
        code: code,
        redirect_uri: redirectUri,
        grant_type: "authorization_code",
      }),
      {
        headers: { "Content-Type": "application/x-www-form-urlencoded" },
      }
    );

    console.log("Token response status:", tokenResponse.status);
    console.log("Token response data:", tokenResponse.data);

    if (!tokenResponse.data.ok) {
      console.error("Slack OpenID token error:", tokenResponse.data.error);
      return NextResponse.redirect(
        new URL(
          `/?error=oauth_failed&details=${tokenResponse.data.error}`,
          request.url
        )
      );
    }

    const { access_token, id_token } = tokenResponse.data;

    // Optionally, verify the nonce in the id_token (JWT) here if needed
    // (For full security, decode and verify the nonce matches what you sent)

    // Fetch user info from OpenID Connect userInfo endpoint
    let userInfo = null;
    try {
      const userInfoResponse = await axios.get(
        "https://slack.com/api/openid.connect.userInfo",
        {
          headers: {
            Authorization: `Bearer ${access_token}`,
          },
        }
      );
      if (userInfoResponse.data.ok) {
        userInfo = userInfoResponse.data;
      } else {
        console.error("Failed to get user info:", userInfoResponse.data.error);
      }
    } catch (userErr) {
      console.error("Error fetching user info:", userErr);
    }

    if (!userInfo) {
      return NextResponse.redirect(
        new URL(
          "/?error=user_info_failed&details=Could not retrieve user info",
          request.url
        )
      );
    }

    // Create a session (in a real app, you'd use a proper session management system)
    const sessionData = {
      access_token,
      user: {
        id: userInfo.sub,
        name: userInfo.name || "",
        email: userInfo.email || "",
        avatar: userInfo.picture || "",
        team_id: userInfo["https://slack.com/team_id"] || "",
        team_name: userInfo["https://slack.com/team_name"] || "",
      },
    };

    // Set session cookie (in production, use secure, httpOnly cookies)
    const response = NextResponse.redirect(new URL("/home", request.url));
    response.cookies.set("slack_session", JSON.stringify(sessionData), {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: 60 * 60 * 24 * 7, // 7 days
    });

    console.log("OpenID Connect flow completed successfully");
    return response;
  } catch (error) {
    console.error("OpenID callback error:", error);
    if (axios.isAxiosError(error)) {
      console.error("Axios error details:", {
        status: error.response?.status,
        data: error.response?.data,
        message: error.message,
      });
    }
    return NextResponse.redirect(new URL("/?error=server_error", request.url));
  }
}

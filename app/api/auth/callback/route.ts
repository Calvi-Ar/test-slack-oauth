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
    const clientId = process.env.SLACK_CLIENT_ID;
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

    // Exchange the authorization code for an access token
    console.log("Exchanging code for token...");
    const tokenResponse = await axios.post(
      "https://slack.com/api/oauth.access",
      {
        client_id: clientId,
        client_secret: clientSecret,
        code: code,
        redirect_uri: redirectUri,
      }
    );

    console.log("Token response status:", tokenResponse.status);
    console.log("Token response data:", tokenResponse.data);

    if (!tokenResponse.data.ok) {
      console.error("Slack OAuth error:", tokenResponse.data.error);
      return NextResponse.redirect(
        new URL(
          `/?error=oauth_failed&details=${tokenResponse.data.error}`,
          request.url
        )
      );
    }

    const { access_token, user } = tokenResponse.data;
    console.log("Token exchange successful, getting user info...");

    // Get user info using the access token
    const userResponse = await axios.get(
      "https://slack.com/api/users.identity",
      {
        headers: {
          Authorization: `Bearer ${access_token}`,
        },
      }
    );

    console.log("User response status:", userResponse.status);
    console.log("User response data:", userResponse.data);

    if (!userResponse.data.ok) {
      console.error("Failed to get user info:", userResponse.data.error);
      return NextResponse.redirect(
        new URL(
          `/?error=user_info_failed&details=${userResponse.data.error}`,
          request.url
        )
      );
    }

    const userInfo = userResponse.data.user;
    console.log("User info retrieved successfully:", {
      id: userInfo.id,
      name: userInfo.name,
    });

    // Create a session (in a real app, you'd use a proper session management system)
    const sessionData = {
      access_token,
      user: {
        id: userInfo.id,
        name: userInfo.name,
        email: userInfo.email,
        avatar: userInfo.image_192 || userInfo.image_512,
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

    console.log("OAuth flow completed successfully");
    return response;
  } catch (error) {
    console.error("OAuth callback error:", error);
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

import { NextRequest, NextResponse } from "next/server";
import axios from "axios";

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const code = searchParams.get("code");
  const state = searchParams.get("state");
  const error = searchParams.get("error");

  // Check for OAuth errors
  if (error) {
    return NextResponse.redirect(new URL(`/?error=${error}`, request.url));
  }

  // Validate required parameters
  if (!code) {
    return NextResponse.redirect(new URL("/?error=missing_code", request.url));
  }

  try {
    // Exchange the authorization code for an access token
    const tokenResponse = await axios.post(
      "https://slack.com/api/oauth.access",
      {
        client_id: process.env.SLACK_CLIENT_ID,
        client_secret: process.env.SLACK_CLIENT_SECRET,
        code: code,
        redirect_uri:
          process.env.SLACK_REDIRECT_URI ||
          `${request.nextUrl.origin}/api/auth/callback`,
      }
    );

    if (!tokenResponse.data.ok) {
      console.error("Slack OAuth error:", tokenResponse.data.error);
      return NextResponse.redirect(
        new URL("/?error=oauth_failed", request.url)
      );
    }

    const { access_token, user } = tokenResponse.data;

    // Get user info using the access token
    const userResponse = await axios.get(
      "https://slack.com/api/users.identity",
      {
        headers: {
          Authorization: `Bearer ${access_token}`,
        },
      }
    );

    if (!userResponse.data.ok) {
      console.error("Failed to get user info:", userResponse.data.error);
      return NextResponse.redirect(
        new URL("/?error=user_info_failed", request.url)
      );
    }

    const userInfo = userResponse.data.user;

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

    return response;
  } catch (error) {
    console.error("OAuth callback error:", error);
    return NextResponse.redirect(new URL("/?error=server_error", request.url));
  }
}

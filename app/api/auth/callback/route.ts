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

    // Prepare the token exchange request
    const tokenRequestData = {
      client_id: clientId,
      client_secret: clientSecret,
      code: code,
      redirect_uri: redirectUri,
    };

    console.log("Token exchange request data:", {
      client_id: clientId,
      client_secret: clientSecret ? "***" : "MISSING",
      code: code,
      redirect_uri: redirectUri,
    });

    // Exchange the authorization code for an access token (V2 endpoint)
    console.log("Exchanging code for token (V2 endpoint)...");
    const tokenResponse = await axios.post(
      "https://slack.com/api/oauth.v2.access",
      tokenRequestData
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

    // Use the correct access token for user info
    const { access_token, authed_user } = tokenResponse.data;
    let userAccessToken = access_token;
    if (authed_user && authed_user.access_token) {
      userAccessToken = authed_user.access_token;
    }
    let userInfo = null;

    // If identity scopes are present, fetch user info using the user access token
    try {
      const userResponse = await axios.get(
        "https://slack.com/api/users.identity",
        {
          headers: {
            Authorization: `Bearer ${userAccessToken}`,
          },
        }
      );
      if (userResponse.data.ok) {
        userInfo = userResponse.data.user;
      } else {
        console.error("Failed to get user info:", userResponse.data.error);
      }
    } catch (userErr) {
      console.error("Error fetching user info:", userErr);
    }

    // Fallback if userInfo is not available
    if (!userInfo && authed_user) {
      userInfo = {
        id: authed_user.id,
        name: authed_user.name || "",
        email: authed_user.email || "",
        avatar: authed_user.image_192 || authed_user.image_512 || "",
      };
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
      access_token: userAccessToken,
      user: {
        id: userInfo.id,
        name: userInfo.real_name || userInfo.name || "",
        email: userInfo.profile?.email || userInfo.email || "",
        avatar: userInfo.profile?.image_192 || userInfo.avatar || "",
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

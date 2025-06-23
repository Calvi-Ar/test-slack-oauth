"use client";

import { useState, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";

export default function LoginPage() {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");
  const router = useRouter();
  const searchParams = useSearchParams();

  useEffect(() => {
    // Check for error parameters in URL
    const errorParam = searchParams.get("error");
    const detailsParam = searchParams.get("details");

    if (errorParam) {
      let errorMessage = "Authentication failed";

      switch (errorParam) {
        case "oauth_failed":
          errorMessage = `OAuth failed${
            detailsParam ? `: ${detailsParam}` : ""
          }`;
          break;
        case "user_info_failed":
          errorMessage = `Failed to get user info${
            detailsParam ? `: ${detailsParam}` : ""
          }`;
          break;
        case "config_error":
          errorMessage = "Configuration error - check environment variables";
          break;
        case "missing_code":
          errorMessage = "Missing authorization code";
          break;
        case "server_error":
          errorMessage = "Server error occurred";
          break;
        default:
          errorMessage = `Error: ${errorParam}${
            detailsParam ? ` - ${detailsParam}` : ""
          }`;
      }

      setError(errorMessage);
    }
  }, [searchParams]);

  // Log error to browser console for debugging
  useEffect(() => {
    if (error) {
      // eslint-disable-next-line no-console
      console.error("[Slack OAuth Error]", error);
    }
  }, [error]);

  const handleSlackAuth = async () => {
    setIsLoading(true);
    setError("");

    try {
      // Generate a random state parameter for security
      const state = Math.random().toString(36).substring(2, 15);

      // Store state in sessionStorage for verification
      sessionStorage.setItem("slack_oauth_state", state);

      // Construct the Slack OAuth v2 URL for Sign in with Slack (user identity)
      const clientId = process.env.NEXT_PUBLIC_SLACK_CLIENT_ID;
      const redirectUri =
        process.env.NEXT_PUBLIC_SLACK_REDIRECT_URI ||
        `${window.location.origin}/api/auth/callback`;

      // Only use user_scope for identity
      const userScopes =
        "identity.basic,identity.email,identity.avatar,identity.team,openid,profile";
      const authUrl =
        `https://slack.com/oauth/v2/authorize?client_id=${clientId}` +
        `&user_scope=${encodeURIComponent(userScopes)}` +
        `&redirect_uri=${encodeURIComponent(redirectUri)}` +
        `&state=${state}`;

      // Redirect to Slack OAuth
      window.location.href = authUrl;
    } catch (err) {
      setError("Failed to initiate Slack authentication");
      // eslint-disable-next-line no-console
      console.error(
        "[Slack OAuth Error] Failed to initiate Slack authentication",
        err
      );
      setIsLoading(false);
    }
  };

  return (
    <div className="container">
      <div className="card">
        <h1 className="title">Welcome</h1>
        <p className="subtitle">Sign in with your Slack account to continue</p>

        <button
          className={`slack-button ${isLoading ? "loading" : ""}`}
          onClick={handleSlackAuth}
          disabled={isLoading}
        >
          {isLoading ? (
            <>
              <div className="spinner"></div>
              Authenticating...
            </>
          ) : (
            <>
              <svg
                width="20"
                height="20"
                viewBox="0 0 24 24"
                fill="currentColor"
              >
                <path d="M6 15a2 2 0 1 1 0-4 2 2 0 0 1 0 4zm0 2a4 4 0 1 0 0-8 4 4 0 0 0 0 8zm6-8a2 2 0 1 1 0-4 2 2 0 0 1 0 4zm0 2a4 4 0 1 0 0-8 4 4 0 0 0 0 8zm6 8a2 2 0 1 1 0-4 2 2 0 0 1 0 4zm0 2a4 4 0 1 0 0-8 4 4 0 0 0 0 8z" />
              </svg>
              Auth with Slack
            </>
          )}
        </button>

        {error && <p className="error-message">{error}</p>}
      </div>
    </div>
  );
}

"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

export default function HomePage() {
  const [user, setUser] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    // Check if user is authenticated
    const checkAuth = async () => {
      try {
        const response = await fetch("/api/auth/me");
        if (response.ok) {
          const userData = await response.json();
          setUser(userData);
        } else {
          // If not authenticated, redirect to login
          router.push("/");
        }
      } catch (error) {
        console.error("Auth check failed:", error);
        router.push("/");
      } finally {
        setIsLoading(false);
      }
    };

    checkAuth();
  }, [router]);

  const handleLogout = async () => {
    try {
      await fetch("/api/auth/logout", { method: "POST" });
      router.push("/");
    } catch (error) {
      console.error("Logout failed:", error);
    }
  };

  if (isLoading) {
    return (
      <div className="container">
        <div className="card">
          <div className="spinner"></div>
          <p>Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="container">
      <div className="card">
        <h1 className="title">Welcome!</h1>
        <p className="success-message">Successfully logged in</p>

        {user && (
          <div style={{ marginBottom: "2rem" }}>
            <p style={{ marginBottom: "0.5rem" }}>
              <strong>Name:</strong> {user.name}
            </p>
            <p style={{ marginBottom: "0.5rem" }}>
              <strong>Email:</strong> {user.email}
            </p>
            {user.avatar && (
              <img
                src={user.avatar}
                alt="Profile"
                style={{
                  width: "64px",
                  height: "64px",
                  borderRadius: "50%",
                  marginTop: "1rem",
                }}
              />
            )}
          </div>
        )}

        <button
          className="slack-button"
          onClick={handleLogout}
          style={{ backgroundColor: "#e53e3e" }}
        >
          Logout
        </button>
      </div>
    </div>
  );
}

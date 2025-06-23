import { NextRequest, NextResponse } from "next/server";

export async function GET(request: NextRequest) {
  try {
    const sessionCookie = request.cookies.get("slack_session");

    if (!sessionCookie) {
      return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
    }

    const sessionData = JSON.parse(sessionCookie.value);

    if (!sessionData.user) {
      return NextResponse.json({ error: "Invalid session" }, { status: 401 });
    }

    return NextResponse.json(sessionData.user);
  } catch (error) {
    console.error("Auth check error:", error);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}

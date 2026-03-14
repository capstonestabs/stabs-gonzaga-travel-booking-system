import { NextResponse } from "next/server";
import { releaseExpiredSlotLocks } from "@/lib/availability";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  const authHeader = request.headers.get("authorization");
  
  // Optional security if you want to protect the CRON trigger
  if (
    process.env.CRON_SECRET &&
    authHeader !== `Bearer ${process.env.CRON_SECRET}`
  ) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const releasedCount = await releaseExpiredSlotLocks();
    return NextResponse.json({ success: true, releasedCount });
  } catch (error) {
    return NextResponse.json({ error: "Failed to release slots" }, { status: 500 });
  }
}

import { NextRequest, NextResponse } from "next/server";
import { randomUUID } from "crypto";

interface PrintJob {
  id: string;
  data: any;
  createdAt: number;
}

const printJobsStore = new Map<string, PrintJob>();

function cleanupExpiredJobs() {
  const TEN_MINUTES = 10 * 60 * 1000;
  const now = Date.now();
  for (const [id, job] of printJobsStore.entries()) {
    if (now - job.createdAt > TEN_MINUTES) {
      printJobsStore.delete(id);
    }
  }
}

export async function POST(request: NextRequest) {
  try {
    cleanupExpiredJobs();
    const body = await request.json();

    const jobId = `job_${randomUUID().replace(/-/g, "").slice(0, 12)}`;
    printJobsStore.set(jobId, {
      id: jobId,
      data: body,
      createdAt: Date.now(),
    });

    const host = request.headers.get("host") || "127.0.0.1:3000";

    return NextResponse.json({
      success: true,
      jobId,
      deepLink: `wts://print?jobId=${jobId}&copies=${body.copies || 1}&host=${encodeURIComponent(host)}`,
    });
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || "Failed to create print job" },
      { status: 400 }
    );
  }
}

export async function GET(request: NextRequest) {
  try {
    cleanupExpiredJobs();
    const url = new URL(request.url);
    const jobId = url.searchParams.get("id") || url.searchParams.get("jobId");

    if (!jobId) {
      return NextResponse.json({ error: "Job ID is required" }, { status: 400 });
    }

    const job = printJobsStore.get(jobId);
    if (!job) {
      return NextResponse.json({ error: "Print job not found or expired" }, { status: 404 });
    }

    return NextResponse.json(job.data);
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || "Failed to fetch print job" },
      { status: 500 }
    );
  }
}

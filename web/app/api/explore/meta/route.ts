import { NextResponse } from "next/server";
import { getMeta } from "@/lib/server/dataset";

export async function GET() {
  const meta = getMeta();
  return NextResponse.json(meta);
}

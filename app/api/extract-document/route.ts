// This file is kept for reference but is not used in the current implementation
// Document extraction is now handled client-side for text files and via manual input for other formats

import type { NextRequest } from "next/server"

export async function POST(req: NextRequest) {
  return Response.json(
    { error: "This endpoint is deprecated. Document extraction is now handled differently." },
    { status: 400 },
  )
}

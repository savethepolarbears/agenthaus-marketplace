import { POST } from "../src/app/api/plugins/[slug]/share/route";
import { NextRequest } from "next/server";

async function run() {
  const req = new NextRequest("http://localhost:3000/api/plugins/test/share", {
    method: "POST",
    headers: {
      "x-forwarded-for": "127.0.0.1",
      "origin": "http://localhost:3000"
    }
  });

  const res = await POST(req, { params: Promise.resolve({ slug: "test" }) });
  console.log("Status:", res.status);
  const data = await res.json();
  console.log("Data:", data);
}

run().catch(console.error);

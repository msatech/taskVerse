import { logout } from "@/lib/session";
import { redirect } from "next/navigation";
import type { NextRequest } from "next/server";

export async function GET(request: NextRequest) {
  await logout();
  redirect("/login");
}

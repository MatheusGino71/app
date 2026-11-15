import { cookies } from "next/headers";
import { getStore } from "./store";
export const SESSION_COOKIE = "atelier_session";
export async function currentUser() {
  const token = (await cookies()).get(SESSION_COOKIE)?.value;
  if (!token) return null;
  return (await getStore()).session(token);
}

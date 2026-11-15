import { AppError } from "./store";
export function assertSameOrigin(request: Request) {
  const rawOrigin = request.headers.get("origin"); const host = request.headers.get("host");
  if (!rawOrigin || !host) throw new AppError("Origem da solicitação inválida.", 403);
  let origin: URL;
  try { origin = new URL(rawOrigin); } catch { throw new AppError("Origem da solicitação inválida.", 403); }
  if (!["http:", "https:"].includes(origin.protocol)) throw new AppError("Origem da solicitação inválida.", 403);
  // Next can normalize request.url to localhost. Host preserves the browser's actual authority.
  const expected = new URL(process.env.ATELIER_APP_ORIGIN || `${origin.protocol}//${host}`).origin;
  if (origin.origin !== expected || rawOrigin !== origin.origin) throw new AppError("Origem da solicitação inválida.", 403);
}

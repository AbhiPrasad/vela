import type { MiddlewareHandler } from "astro";

const API_URL = import.meta.env.API_URL ?? "http://localhost:8787";

export const onRequest: MiddlewareHandler = async (context, next) => {
  const { pathname } = context.url;

  // Initialize locals
  context.locals.user = null;
  context.locals.session = null;

  // Try to get session from cookies
  const cookies = context.request.headers.get("cookie");

  if (cookies) {
    try {
      // Forward cookies to API to get session
      const response = await fetch(`${API_URL}/api/auth/get-session`, {
        headers: {
          cookie: cookies,
        },
        credentials: "include",
      });

      if (response.ok) {
        const data = await response.json();
        if (data.session && data.user) {
          context.locals.user = data.user;
          context.locals.session = data.session;
        }
      }
    } catch {
      // Session fetch failed, continue without auth
    }
  }

  // Protect admin routes
  if (pathname.startsWith("/admin")) {
    const user = context.locals.user;

    // Redirect to login if not authenticated
    if (!user) {
      const redirectUrl = encodeURIComponent(pathname);
      return context.redirect(`/auth/login?redirect=${redirectUrl}`);
    }

    // Check role for admin access
    if (!["editor", "admin"].includes(user.role)) {
      return new Response("Forbidden", { status: 403 });
    }

    // Users-only pages require admin role
    if (pathname.startsWith("/admin/users") && user.role !== "admin") {
      return new Response("Forbidden", { status: 403 });
    }
  }

  return next();
});

import { NextResponse } from "next/server";
import * as jose from "jose";
import { Redis } from "@upstash/redis";
import { validateCsrfOriginAndReferer, validateCsrfRequest } from "@/lib/csrf";
import getApiRouteRule from "@/lib/rbac-policy";

let redisClient;

function getRedisClient() {
  if (
    !redisClient &&
    process.env.UPSTASH_REDIS_REST_URL &&
    process.env.UPSTASH_REDIS_REST_TOKEN
  ) {
    redisClient = new Redis({
      url: process.env.UPSTASH_REDIS_REST_URL,
      token: process.env.UPSTASH_REDIS_REST_TOKEN,
    });
  }
  return redisClient;
}

const FIREBASE_PROJECT_ID = process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID;
const FIREBASE_AUTH_DOMAIN = process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN;
const FIREBASE_API_KEY = process.env.NEXT_PUBLIC_FIREBASE_API_KEY;

// Allowed clock skew when validating JWT `exp` (seconds).
const CLOCK_TOLERANCE_SECONDS = 60;

// ─── Rate Limiting ────────────────────────────────────────────────────────────
const RATE_LIMIT_WINDOW_MS = 15 * 60 * 1000; // 15 minutes
const RATE_LIMIT_MAX = 5;

<<<<<<< HEAD
// Dev-only in-memory fallback
=======
function getRedis() {
  if (!redisClient) {
    redisClient = new Redis({
      url: process.env.UPSTASH_REDIS_REST_URL,
      token: process.env.UPSTASH_REDIS_REST_TOKEN,
    });
  }
  return redisClient;
}

// Dev-only in-memory fallback (never used in production)
>>>>>>> origin/master
const devRateLimitMap = new Map();

const AUTH_RATE_LIMITED_PATHS = [
  "/api/auth/login",
  "/api/auth/signup",
  "/api/auth/logout",
  "/api/auth/forgot-password",
  "/api/auth/reset-password",
  "/api/auth/verify-email",
  "/api/auth/verify-otp",
];

const PUBLIC_PATHS = ["/activity", "/auth", "/verify"];

function isAuthRoute(pathname) {
  return AUTH_RATE_LIMITED_PATHS.some((path) => pathname.startsWith(path));
}

async function rateLimit(ip, pathname, request) {
<<<<<<< HEAD
  const cookies =
    typeof request.cookies?.get === "function"
      ? request.cookies
      : { get: () => undefined };
  const sessionFingerprint =
    cookies.get("__Secure-next-auth.session-token")?.value ||
    cookies.get("next-auth.session-token")?.value ||
    cookies.get("authToken")?.value ||
    "";
=======
  const cookies = typeof request.cookies?.get === "function" ? request.cookies : { get: () => undefined };
  const sessionFingerprint = cookies.get("__Secure-next-auth.session-token")?.value
    || cookies.get("next-auth.session-token")?.value
    || cookies.get("authToken")?.value
    || "";
>>>>>>> origin/master
  const key = `ratelimit:auth:${ip}_${pathname}_${sessionFingerprint.slice(0, 16)}`;
  const limit = RATE_LIMIT_MAX;
  const windowMs = RATE_LIMIT_WINDOW_MS;

<<<<<<< HEAD
  const redis = getRedisClient();

  if (redis) {
    try {
=======
  const hasRedis =
    process.env.UPSTASH_REDIS_REST_URL && process.env.UPSTASH_REDIS_REST_TOKEN;

  if (hasRedis) {
    try {
      const redis = getRedis();
>>>>>>> origin/master
      const now = Date.now();
      const windowStart = now - windowMs;

      const multi = redis.multi();
      multi.zremrangebyscore(key, 0, windowStart);
      multi.zadd(key, { score: now, member: `${now}-${Math.random()}` });
      multi.zcard(key);
      multi.expire(key, Math.ceil(windowMs / 1000));
      const [, , count] = await multi.exec();

      const current = Number(count);
      if (current > limit) {
        const oldest = await redis.zrange(key, 0, 0, { withScores: true });
<<<<<<< HEAD
        const resetTime =
          oldest.length >= 2 ? Number(oldest[1]) + windowMs : now + windowMs;
=======
        const resetTime = oldest.length >= 2 ? Number(oldest[1]) + windowMs : now + windowMs;
>>>>>>> origin/master
        const retryAfter = Math.ceil((resetTime - now) / 1000);
        return { allowed: false, remaining: 0, retryAfter };
      }

      return { allowed: true, remaining: limit - current };
    } catch (err) {
      console.error("[rate-limit] Upstash Redis error — denying request:", err);
<<<<<<< HEAD
      return {
        allowed: false,
        remaining: 0,
        retryAfter: Math.ceil(windowMs / 1000),
      };
=======
      return { allowed: false, remaining: 0, retryAfter: Math.ceil(windowMs / 1000) };
>>>>>>> origin/master
    }
  }

  // Development-only in-memory fallback
  const entry = devRateLimitMap.get(key);
  const now = Date.now();

  if (!entry || now > entry.resetTime) {
    devRateLimitMap.set(key, { count: 1, resetTime: now + windowMs });
    return { allowed: true, remaining: limit - 1 };
  }

  if (entry.count >= limit) {
    const retryAfter = Math.ceil((entry.resetTime - now) / 1000);
    return { allowed: false, remaining: 0, retryAfter };
  }

  entry.count += 1;
  return { allowed: true, remaining: limit - entry.count };
}

<<<<<<< HEAD
let lastCleanupTime = 0;
function cleanupRateLimitMap() {
  try {
    const now = Date.now();
    if (now - lastCleanupTime < 5 * 60 * 1000) return;
    lastCleanupTime = now;
    if (devRateLimitMap.size === 0) return;
=======
// Periodically clean up expired entries to prevent unbounded memory growth
// This runs on every middleware invocation but only cleans every 5 minutes
let lastCleanupTime = 0;

function cleanupRateLimitMap() {
  try {
    const now = Date.now();

    if (now - lastCleanupTime < 5 * 60 * 1000) return;

    lastCleanupTime = now;

    if (devRateLimitMap.size === 0) return;

>>>>>>> origin/master
    for (const [key, entry] of devRateLimitMap.entries()) {
      if (now > entry.resetTime) {
        devRateLimitMap.delete(key);
      }
    }
  } catch {
    // Cleanup failure must never crash the middleware
  }
}
<<<<<<< HEAD
=======

>>>>>>> origin/master
// ─── CSP ──────────────────────────────────────────────────────────────────────

function buildPageCsp(nonce) {
  const frameSrc = [
    "'self'",
    "https://accounts.google.com",
    "https://*.google.com",
    "https://*.firebaseapp.com",
  ];

  if (FIREBASE_AUTH_DOMAIN) {
    frameSrc.push(`https://${FIREBASE_AUTH_DOMAIN}`);
  }

  const cspDirectives = [
    "default-src 'self'",
    process.env.NODE_ENV === "development"
      ? `script-src 'self' 'nonce-${nonce}' 'unsafe-eval' https://apis.google.com https://www.gstatic.com https://www.googletagmanager.com`
      : `script-src 'self' 'nonce-${nonce}' https://apis.google.com https://www.gstatic.com https://www.googletagmanager.com`,
    "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
    "font-src 'self' https://fonts.gstatic.com",
    "img-src 'self' data: blob: https://lh3.googleusercontent.com https://*.public.blob.vercel-storage.com https://github.com https://www.google-analytics.com https://avatars.githubusercontent.com",
    "connect-src 'self' blob: https://*.googleapis.com https://*.firebaseio.com wss://*.firebaseio.com https://*.firebase.io https://identitytoolkit.googleapis.com https://securetoken.googleapis.com https://www.google-analytics.com https://region1.google-analytics.com https://*.public.blob.vercel-storage.com https://api.emailjs.com https://api.github.com",
    "media-src 'self' blob:",
    "worker-src 'self' blob:",
    `frame-src ${Array.from(new Set(frameSrc)).join(" ")}`,
    "object-src 'none'",
    "base-uri 'self'",
    "form-action 'self'",
    "upgrade-insecure-requests",
  ];

  if (process.env.CSP_REPORT_URL) {
    cspDirectives.push(`report-uri ${process.env.CSP_REPORT_URL}`);
  }

  return cspDirectives.join("; ");
}

// ─── Firebase Token Verification ─────────────────────────────────────────────

async function getFirebasePublicKeys() {
  try {
    const response = await fetch(
      "https://www.googleapis.com/robot/v1/metadata/x509/securetoken@system.gserviceaccount.com",
      { next: { revalidate: 3600 } }
    );
    if (!response.ok) throw new Error("Failed to fetch public keys");
    return await response.json();
  } catch (error) {
    console.error("Failed to fetch Firebase public keys:", error);
    return {};
  }
}

async function verifyIdToken(token) {
  try {
    if (!FIREBASE_PROJECT_ID) return null;
    const publicKeys = await getFirebasePublicKeys();

    const parts = token.split(".");
    if (parts.length < 2) return null;

    const header = JSON.parse(Buffer.from(parts[0], "base64").toString());
    const kid = header.kid;

    if (kid && publicKeys[kid]) {
      const publicKey = await jose.importSPKI(publicKeys[kid], "RS256");
      const { payload } = await jose.jwtVerify(token, publicKey, {
        issuer: `https://securetoken.google.com/${FIREBASE_PROJECT_ID}`,
        audience: FIREBASE_PROJECT_ID,
        clockTolerance: CLOCK_TOLERANCE_SECONDS,
      });

      return {
        uid: payload.sub,
        email: payload.email,
        email_verified: payload.email_verified === true,
        role: payload.role || null,
      };
    }
    return null;
  } catch {
    return null;
  }
}

<<<<<<< HEAD
// ─── Middleware Main ─────────────────────────────────────────────────────────
=======
// ─── RBAC enforcement ────────────────────────────────────────────────────────

function enforceApiRbac(pathname, isTokenValid, isEmailVerified, userRole) {
  const rule = getApiRouteRule(pathname);

  if (!rule) {
    // Not an API route — no RBAC enforcement
    return null;
  }

  if (rule.public) {
    return null;
  }

  if (!isTokenValid) {
    return { error: "Unauthorized", status: 401 };
  }

  if (!isEmailVerified) {
    return { error: "Forbidden: Email not verified", status: 403 };
  }

  if (rule.roles && rule.roles.length > 0) {
    if (!userRole) {
      return { error: "Forbidden: No role assigned", status: 403 };
    }
    if (!rule.roles.includes(userRole)) {
      return { error: "Forbidden: Role mismatch", status: 403 };
    }
  }

  return null;
}

// ─── Middleware ───────────────────────────────────────────────────────────────
>>>>>>> origin/master

export async function middleware(request) {
  const { pathname } = request.nextUrl;
  if (
    PUBLIC_PATHS.some(
      (path) => pathname === path || pathname.startsWith(`${path}/`)
    )
  ) {
    return NextResponse.next();
  }
  const isUnsafeMethod = !["GET", "HEAD", "OPTIONS"].includes(request.method);
  cleanupRateLimitMap();

  if (pathname.startsWith("/api/") && isUnsafeMethod) {
    const contentLength = Number(request.headers.get("content-length"));
    if (!Number.isNaN(contentLength) && contentLength > 1024 * 1024) {
      return NextResponse.json(
        { error: "Payload too large (limit 1MB)" },
        { status: 413 }
      );
    }
  }

  if (isAuthRoute(pathname)) {
    const ip =
      request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ||
      "unknown";
    const { allowed, retryAfter } = await rateLimit(ip, pathname, request);
    if (!allowed) {
      return NextResponse.json(
        {
          success: false,
          message: `Too many attempts. Try again in ${retryAfter}s.`,
        },
        { status: 429, headers: { "Retry-After": String(retryAfter) } }
      );
    }
  }

  const requestHeaders = new Headers(request.headers);
  const nonce = crypto.randomUUID();
  requestHeaders.set("x-nonce", nonce);

  let authToken =
    request.headers.get("authorization")?.split(" ")[1] ||
    request.cookies.get("authToken")?.value;
  let payload = authToken ? await verifyIdToken(authToken) : null;

<<<<<<< HEAD
  if (
    pathname.startsWith("/api/") &&
    isUnsafeMethod &&
    request.cookies.get("authToken")
  ) {
    try {
      validateCsrfOriginAndReferer(request);
      validateCsrfRequest(request);
    } catch (error) {
      return NextResponse.json(
        { error: error.message || "Forbidden" },
        { status: 403 }
      );
    }
  }

=======
  let isTokenValid = false;
  let isEmailVerified = false;
  let userRole = null;

  if (authToken) {
    const payload = await verifyIdToken(authToken);
    if (payload) {
      isTokenValid = true;
      isEmailVerified = !!payload.email_verified;
      userRole = payload.role || null;
    }
  }

  if (pathname.startsWith("/api/") && isUnsafeMethod) {
    if (isTokenValid && pathname.startsWith("/api/")) {
      const sessionId =
        request.cookies.get("sessionId")?.value ||
        request.headers.get("x-session-id");
      if (sessionId) {
        try {
          const redis = getRedisClient();
          if (redis) {
            const exists = await redis.exists(`session:${sessionId}`);
            if (exists !== 1) {
              return NextResponse.json(
                { error: "Session expired or terminated concurrently" },
                { status: 401 }
              );
            }
          }
        } catch {
          // Redis unavailable — continue without session validation
        }
      }
    }

    const tokenFromCookie = request.cookies.get("authToken")?.value || null;
    if (tokenFromCookie) {
      try {
        validateCsrfOriginAndReferer(request);
        validateCsrfRequest(request);
      } catch (error) {
        return NextResponse.json(
          { error: error.message || "Forbidden: invalid CSRF request" },
          { status: error.statusCode || 403 }
        );
      }
    }
  }

  const protectedDashboards = [
    {
      prefix: "/student",
      apiPrefix: "/api/student",
      role: "student",
      defaultPath: "/student/dashboard",
    },
    {
      prefix: "/teacher",
      apiPrefix: "/api/teacher",
      role: "teacher",
      defaultPath: "/teacher/dashboard",
    },
    {
      prefix: "/admin",
      apiPrefix: "/api/admin",
      role: "admin",
      defaultPath: "/admin/dashboard",
    },
    {
      prefix: "/institute",
      apiPrefix: "/api/institute",
      role: "institute",
      defaultPath: "/institute/dashboard",
    },
    {
      prefix: "/parent",
      apiPrefix: "/api/parent",
      role: "parent",
      defaultPath: "/parent/dashboard",
    },
  ];

  const matchedDashboard = protectedDashboards.find(
    (dashboard) =>
      pathname.startsWith(dashboard.prefix) ||
      (dashboard.apiPrefix && pathname.startsWith(dashboard.apiPrefix))
  );

  // ── 2. RBAC enforcement for all API routes ──
  // This runs before handler execution, enforcing the centralized policy
  // defined in API_ROUTE_RULES. Fail-closed: unmatched paths default to
  // authenticated access.
  if (pathname.startsWith("/api/") && !matchedDashboard) {
    const rbacResult = enforceApiRbac(pathname, isTokenValid, isEmailVerified, userRole);
    if (rbacResult) {
      return NextResponse.json(
        { error: rbacResult.error },
        { status: rbacResult.status }
      );
    }
  }

  if (matchedDashboard) {
    if (!isTokenValid) {
      if (pathname.startsWith("/api/")) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
      }
      return NextResponse.redirect(new URL("/auth", request.url));
    }
    if (!isEmailVerified) {
      if (pathname.startsWith("/api/")) {
        return NextResponse.json(
          { error: "Forbidden: Email not verified" },
          { status: 403 }
        );
      }
      return NextResponse.redirect(new URL("/verify", request.url));
    }
    if (userRole !== matchedDashboard.role) {
      if (pathname.startsWith("/api/")) {
        return NextResponse.json(
          { error: "Forbidden: Role mismatch" },
          { status: 403 }
        );
      }
      const correctDashboard = protectedDashboards.find(
        (d) => d.role === userRole
      );
      const redirectTarget = correctDashboard
        ? correctDashboard.defaultPath
        : "/profile";
      return NextResponse.redirect(new URL(redirectTarget, request.url));
    }
  }

  const generalProtectedRoutes = ["/profile", "/settings"];
  const isGeneralProtected = generalProtectedRoutes.some((route) =>
    pathname.startsWith(route)
  );

  if (isGeneralProtected) {
    if (!isTokenValid) {
      return NextResponse.redirect(new URL("/auth", request.url));
    }
    if (!isEmailVerified) {
      return NextResponse.redirect(new URL("/verify", request.url));
    }
  }

  if (pathname.startsWith("/verify")) {
    if (!isTokenValid) {
      return NextResponse.redirect(new URL("/auth", request.url));
    }
    if (isEmailVerified) {
      const correctDashboard = protectedDashboards.find(
        (d) => d.role === userRole
      );
      const redirectTarget = correctDashboard
        ? correctDashboard.defaultPath
        : "/profile";
      return NextResponse.redirect(new URL(redirectTarget, request.url));
    }
  }

  if (pathname === "/auth" && isTokenValid && isEmailVerified && userRole) {
    const correctDashboard = protectedDashboards.find(
      (d) => d.role === userRole
    );
    if (correctDashboard) {
      return NextResponse.redirect(
        new URL(correctDashboard.defaultPath, request.url)
      );
    }
  }

  const isPage =
    !pathname.startsWith("/_next") &&
    !pathname.startsWith("/api") &&
    !pathname.match(/\.(?:png|jpg|jpeg|gif|svg|ico|css|js|woff2?|json)$/);

>>>>>>> origin/master
  const response = NextResponse.next({ request: { headers: requestHeaders } });

  // Baseline Security Headers
  response.headers.set("X-Content-Type-Options", "nosniff");
  response.headers.set("Referrer-Policy", "strict-origin-when-cross-origin");
  response.headers.set("X-XSS-Protection", "1; mode=block");

  if (pathname.startsWith("/api/")) {
    response.headers.set(
      "Cache-Control",
      "no-cache, no-store, must-revalidate"
    );
    response.headers.set("X-Frame-Options", "DENY");
  } else {
    response.headers.set("Content-Security-Policy", buildPageCsp(nonce));
    response.headers.set("X-Frame-Options", "SAMEORIGIN");
  }

  return response;
}

// Exported for unit testing (in-memory fallback behavior)
export {
  isAuthRoute,
  rateLimit,
  cleanupRateLimitMap,
  devRateLimitMap,
  resetForTest,
};

// Test helper to control cleanup timer
function resetForTest(now) {
  lastCleanupTime = now;
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|manifest.json|sw.js|workbox-.*).*)",
  ],
};

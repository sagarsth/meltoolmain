// app/utils/session.server.ts

import { createCookieSessionStorage, redirect } from "@remix-run/node";
import { db } from "./db.server";
import type { Staff } from "@prisma/client";

type SessionData = {
  userId: string;
  created?: string; // Add created to the SessionData type
};

type SessionFlashData = {
  error: string;
  success?: string;
  info?: string;
};

const sessionSecret = process.env.SESSION_SECRET;
if (!sessionSecret) {
  if (process.env.NODE_ENV === "production") {
    throw new Error("SESSION_SECRET must be set in production");
  } else {
    console.warn(
      "\x1b[33m⚠️  No SESSION_SECRET set. This is okay in development, but must be set in production.\x1b[0m"
    );
  }
}

const storage = createCookieSessionStorage<SessionData, SessionFlashData>({
  cookie: {
    name: "ME_session",
    secure: process.env.NODE_ENV === "production",
    secrets: [sessionSecret || "default_secret_for_development"],
    sameSite: "lax",
    path: "/",
    maxAge: 60 * 60 * 24 * 30, // 30 days
    httpOnly: true,
    ...(process.env.NODE_ENV === "production"
      ? {
          secure: true,
          domain: process.env.DOMAIN,
          sameSite: "strict" as const,
        }
      : {}),
  },
});

async function createUserSession(userId: string, redirectTo: string) {
  const session = await storage.getSession();
  session.set("userId", userId);
  session.set("created" as keyof SessionData, new Date().toISOString()); // Type assertion
  
  return redirect(redirectTo, {
    headers: {
      "Set-Cookie": await storage.commitSession(session),
    },
  });
}

async function getUserSession(request: Request) {
  const cookieHeader = request.headers.get("Cookie");
  return storage.getSession(cookieHeader);
}

async function getUserId(request: Request): Promise<string | null> {
  const session = await getUserSession(request);
  const userId = session.get("userId");
  if (!userId || typeof userId !== "string") return null;
  return userId;
}

async function requireUserId(
  request: Request,
  redirectTo: string = new URL(request.url).pathname
): Promise<string> {
  const session = await getUserSession(request);
  const userId = session.get("userId");
  
  if (!userId || typeof userId !== "string") {
    const searchParams = new URLSearchParams([["redirectTo", redirectTo]]);
    throw redirect(`/login?${searchParams}`);
  }
  
  return userId;
}

type SafeStaff = Omit<Staff, 'password'>;  // Define a type without the password field

async function getUser(request: Request): Promise<SafeStaff | null> {
  const userId = await getUserId(request);
  if (typeof userId !== "string") {
    return null;
  }

  try {
    const user = await db.staff.findUnique({
      where: { id: userId },
    });
    
    if (!user) throw new Error('User not found');

    // Create a new object without the password field
    const { password, ...safeUser } = user;
    return safeUser;
    
  } catch (error) {
    console.error("Error fetching user:", error);
    throw await logout(request);
  }
}

async function logout(request: Request) {
  const session = await getUserSession(request);
  return redirect("/login", {
    headers: {
      "Set-Cookie": await storage.destroySession(session),
      "Clear-Site-Data": '"cookies", "storage"',
    },
  });
}

async function setFlashMessage(
  request: Request,
  message: { type: 'error' | 'success' | 'info'; text: string }
) {
  const session = await getUserSession(request);
  session.flash(message.type, message.text);
  return session;
}

async function getFlashMessage(request: Request) {
  const session = await getUserSession(request);
  return {
    error: session.get("error"),
    success: session.get("success"),
    info: session.get("info"),
  };
}

export { 
  createUserSession, 
  getUserId, 
  requireUserId, 
  getUser, 
  logout,
  setFlashMessage,
  getFlashMessage,
  storage 
};
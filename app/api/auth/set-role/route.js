import { jsonError, jsonSuccess } from "@/lib/api-response";
import { withErrorHandler, authenticateRequest } from "@/lib/error-handler";
import { initializeFirebase } from "@/lib/firebase-admin";
import admin from "firebase-admin";
import { z } from "zod";

const ALLOWED_ROLES = ["student", "teacher", "institute"];

const setRoleSchema = z.object({
  role: z.enum(ALLOWED_ROLES, {
    errorMap: () => ({ message: "Role must be student, teacher, or institute" }),
  }),
  fullName: z.string().trim().min(1, "Full name is required").max(100),
  instituteName: z.string().trim().max(200).optional(),
});

export const POST = withErrorHandler(async (request) => {
  const decodedToken = await authenticateRequest(request);

  const body = await request.json();

  const validation = setRoleSchema.safeParse(body);
  if (!validation.success) {
    return jsonError(
      validation.error.issues[0]?.message || "Validation failed",
      400
    );
  }

  const { role, fullName, instituteName } = validation.data;

  initializeFirebase();
  const db = admin.firestore();

  // Prevent privilege escalation: only block if the requested role CONFLICTS
  // with an existing one. Existing users whose role matches still need their
  // Firebase custom claim set (migration path), so we let them through.
  const existingProfile = await db.collection("users").doc(decodedToken.uid).get();
  if (existingProfile.exists) {
    const existingRole = existingProfile.data()?.role;
    if (existingRole && existingRole !== role) {
      return jsonError(
        `Forbidden: Account is already registered as "${existingRole}". Role cannot be changed.`,
        403
      );
    }
  } else if (decodedToken.role && decodedToken.role !== role) {
    // No Firestore profile yet, but token already carries a different custom claim
    return jsonError(
      `Forbidden: Token already carries role "${decodedToken.role}". Role cannot be changed.`,
      403
    );
  }

  // Cryptographically sign the role into the Firebase token so the
  // middleware can verify it without touching Firestore
  await admin.auth().setCustomUserClaims(decodedToken.uid, { role });

  // Write the user profile to Firestore from the server so the client
  // cannot tamper with the role or any other field
  const userProfile = {
    uid: decodedToken.uid,
    email: decodedToken.email,
    fullName,
    role,
    createdAt: new Date().toISOString(),
    emailVerified: decodedToken.email_verified || false,
    lastLogin: new Date().toISOString(),
  };

  if (role === "institute" && instituteName) {
    userProfile.instituteName = instituteName;
  }

  await db
    .collection("users")
    .doc(decodedToken.uid)
    .set(userProfile, { merge: true });

  return jsonSuccess({ userProfile }, 201);
});

import { NextResponse } from "next/dist/server/web/spec-extension/response";
import { prisma } from "@/lib/prisma";
import { hashPassword } from "@/lib/auth-utils";

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { username, password, labName } = body;

    // 1. Validate Input
    if (!username || !password || !labName) {
      return NextResponse.json(
        { message: "Username, password, and Laboratory Name are required." },
        { status: 400 }
      );
    }

    // 2. Check if the username is already taken
    const existingUser = await prisma.user.findUnique({
      where: { username: username }
    });

    if (existingUser) {
      return NextResponse.json(
        { message: "This username is already taken. Please choose another." },
        { status: 409 }
      );
    }

    // 3. Hash the password using your existing utility
    const hashedPassword = await hashPassword(password);

    // 4. DATABASE TRANSACTION: Create the Lab AND the User together
    // We use a transaction so if one fails, they both fail (no orphaned users or labs)
    const result = await prisma.$transaction(async (tx) => {
      
      // A. Create the Organization (Tenant)
      const newOrg = await tx.organization.create({
        data: {
          name: labName,
          plan: "Free", // Default plan
          isActive: true,
        }
      });

      // B. Create the Default "Lab Profile" for this new organization
      await tx.labProfile.create({
        data: {
          organizationId: newOrg.id,
          name: labName,
          address: "Please update your address in settings",
          phone: "Please update your phone number",
        }
      });

      // C. Create the Admin User linked to this Organization
      const newUser = await tx.user.create({
        data: {
          username: username,
          password: hashedPassword,
          name: "Admin", // Default name
          organizationId: newOrg.id, // 🚨 CRITICAL: Links user to the new lab
          isActive: true,
          isDefaultSignature: true,
        }
      });

      return { org: newOrg, user: newUser };
    });

    // 5. Success! Return a 200 response
    return NextResponse.json(
      { message: "Workspace created successfully!", orgId: result.org.id },
      { status: 201 }
    );

  } catch (error) {
    console.error("Registration error:", error);
    return NextResponse.json(
      { message: "An error occurred while creating your workspace." },
      { status: 500 }
    );
  }
}
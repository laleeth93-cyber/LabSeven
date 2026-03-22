// --- BLOCK app/actions/patient.ts OPEN ---
'use server'

import { prisma } from '@/lib/prisma'
import { revalidatePath } from 'next/cache'

// 1. SEARCH EXISTING PATIENTS
export async function searchPatients(query: string) {
  if (!query || query.length < 2) return [];

  try {
    const patients = await prisma.patient.findMany({
      where: {
        OR: [
          { firstName: { contains: query, mode: 'insensitive' } },
          { phone: { contains: query, mode: 'insensitive' } },
          { patientId: { contains: query, mode: 'insensitive' } }
        ]
      },
      take: 10,
      orderBy: { firstName: 'asc' }
    });
    return patients;
  } catch (error) {
    console.error("Search Error:", error);
    return [];
  }
}

// 2. REGISTER / UPDATE PATIENT
export async function registerPatient(data: any) {
  try {
    // Check if patient with this ID already exists
    const existing = await prisma.patient.findUnique({
      where: { patientId: data.patientId }
    });

    let result;

    if (existing) {
      // UPDATE existing patient
      console.log("Updating existing patient:", data.patientId);
      result = await prisma.patient.update({
        where: { patientId: data.patientId },
        data: {
          designation: data.prefix || 'Mr.',
          firstName: data.firstName,
          lastName: data.lastName,
          gender: data.gender,
          ageY: parseInt(data.age?.Y) || 0,
          ageM: parseInt(data.age?.M) || 0,
          ageD: parseInt(data.age?.D) || 0,
          phone: data.phone,
          email: data.email,
          address: data.address,
          referralType: data.referralType || "Self",
          refDoctor: data.refDoctor || "Self", // <--- MUST HAVE THIS LINE
        }
      });
    } else {
      // CREATE new patient
      console.log("Creating new patient:", data.patientId);
      result = await prisma.patient.create({
        data: {
          patientId: data.patientId, 
          designation: data.prefix || 'Mr.',
          firstName: data.firstName,
          lastName: data.lastName || '',
          gender: data.gender || 'male',
          ageY: parseInt(data.age?.Y) || 0,
          ageM: parseInt(data.age?.M) || 0,
          ageD: parseInt(data.age?.D) || 0,
          phone: data.phone || '0000000000',
          email: data.email || null,
          address: data.address || null,
          referralType: data.referralType || "Self",
          refDoctor: data.refDoctor || "Self", // <--- MUST HAVE THIS LINE
        }
      });
    }

    revalidatePath('/');
    return { success: true, message: "Patient Saved Successfully!", patient: result };

  } catch (error) {
    console.error("Database Error:", error);
    return { success: false, message: "Failed to save. Check inputs." };
  }
}
// --- BLOCK app/actions/patient.ts CLOSE ---
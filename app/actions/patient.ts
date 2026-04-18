'use server'

import { prisma } from '@/lib/prisma'
import { revalidatePath } from 'next/cache'
import { requireAuth } from '@/lib/server-auth'; 

// 1. SEARCH EXISTING PATIENTS
export async function searchPatients(query: string) {
  if (!query || query.length < 2) return [];

  try {
    const { orgId } = await requireAuth(); 
    const patients = await prisma.patient.findMany({
      where: {
        organizationId: orgId, 
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
    const { orgId } = await requireAuth(); 

    const existing = await prisma.patient.findUnique({
      where: { 
        organizationId_patientId: { 
          organizationId: orgId, 
          patientId: data.patientId 
        } 
      }
    });

    let result;

    if (existing) {
      // UPDATE existing patient
      console.log("Updating existing patient:", data.patientId);
      result = await prisma.patient.update({
        where: { 
          organizationId_patientId: { 
            organizationId: orgId, 
            patientId: data.patientId 
          } 
        },
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
          refDoctor: data.refDoctor || "Self", 
        }
      });
    } else {
      // CREATE new patient
      console.log("Creating new patient:", data.patientId);
      result = await prisma.patient.create({
        data: {
          organizationId: orgId, 
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
          refDoctor: data.refDoctor || "Self", 
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

// 3. GENERATE SEQUENTIAL PATIENT ID (TENANT ISOLATED)
export async function getNextPatientId() {
  try {
    const { orgId } = await requireAuth();
    
    // Get today's date in YYYYMMDD format
    const today = new Date();
    const dateStr = today.getFullYear().toString() +
                    (today.getMonth() + 1).toString().padStart(2, '0') +
                    today.getDate().toString().padStart(2, '0');

    // Find the absolute latest patient created TODAY for THIS specific clinic
    const lastPatient = await prisma.patient.findFirst({
      where: {
        organizationId: orgId,
        patientId: { startsWith: dateStr }
      },
      orderBy: { patientId: 'desc' }
    });

    if (lastPatient && lastPatient.patientId.includes('-')) {
      // Extract the serial number and add 1
      const lastSerial = parseInt(lastPatient.patientId.split('-')[1], 10);
      if (!isNaN(lastSerial)) {
        const nextSerial = (lastSerial + 1).toString().padStart(4, '0');
        return `${dateStr}-${nextSerial}`;
      }
    }
    
    // If no patients exist today, start at 0001
    return `${dateStr}-0001`;

  } catch (error) {
    console.error("Failed to generate Patient Sequence:", error);
    return null;
  }
}
// FILE: lib/local-db/syncEngine.ts
import { localDB } from './db';
import { registerPatient } from '@/app/actions/patient';
import { createBill } from '@/app/actions/billing';

export const triggerSupabaseSync = async () => {
  if (!navigator.onLine) {
    console.log("App is offline. Sync paused.");
    return;
  }

  try {
    // 1. Find all local registrations waiting to be uploaded
    const pendingRegistrations = await localDB.registrations
      .where('sync_status')
      .equals('pending')
      .toArray();

    if (pendingRegistrations.length === 0) return;

    console.log(`Attempting to sync ${pendingRegistrations.length} offline registrations...`);

    // 2. Loop through each pending registration and push to Supabase
    for (const reg of pendingRegistrations) {
      try {
        // Step A: Register the patient
        const regResult = await registerPatient(reg.patientData);
        if (!regResult.success || !regResult.patient) {
          throw new Error("Patient Sync Failed");
        }

        // Step B: Update the bill payload with the REAL Patient ID from Supabase
        const updatedBillPayload = {
          ...reg.billPayload,
          patientId: regResult.patient.patientId
        };

        // Step C: Create the Bill
        const billResult = await createBill(updatedBillPayload);
        if (!billResult.success) {
          throw new Error("Bill Sync Failed");
        }

        // Step D: Mark as synced locally!
        await localDB.registrations.update(reg.id, { sync_status: 'synced' });
        console.log(`Successfully synced offline registration: ${reg.id}`);

      } catch (innerError) {
        console.error(`Failed to sync individual record ${reg.id}:`, innerError);
        // We leave it as 'pending' so it tries again on the next loop!
      }
    }

  } catch (err) {
    console.error("Global sync process encountered an error.", err);
  }
};
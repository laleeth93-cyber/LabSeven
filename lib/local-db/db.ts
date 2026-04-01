// FILE: lib/local-db/db.ts
import Dexie, { Table } from 'dexie';

// Define the shape of a complete offline registration package
export interface OfflineRegistration {
  id: string; // Local UUID
  patientData: any; // All patient form values
  billPayload: any; // All billing calculations and items
  invoiceData: any; // The data needed to print the receipt offline
  sync_status: 'pending' | 'synced' | 'failed';
  created_at: string;
}

export class LabSevenLocalDB extends Dexie {
  registrations!: Table<OfflineRegistration>; 

  constructor() {
    super('LabSevenLocalDB');
    
    // We index 'sync_status' so the background worker can find 'pending' records instantly.
    this.version(2).stores({
      registrations: 'id, sync_status, created_at' 
    });
  }
}

export const localDB = new LabSevenLocalDB();
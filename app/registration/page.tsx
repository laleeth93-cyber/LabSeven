"use client";

import React, { useState, useEffect } from 'react';
import { Lock } from 'lucide-react';
import NewRegistration from '@/app/registration/NewRegistration';
import CustomizeRegistrationModal from '@/app/registration/CustomizeRegistrationModal';
import QuotationModal from '@/app/components/QuotationModal';
import { usePermissions } from '@/app/context/PermissionContext';
import MusicBarLoader from '@/app/components/MusicBarLoader';

export interface FieldData {
  id: number;
  label: string;
  category: string;
  isVisible: boolean;
  order: number | null;
  width: string;
  required: boolean;
  placeholder?: string;
  inputType: 'text' | 'select' | 'date' | 'textarea' | 'file' | 'age' | 'phone' | 'multi-select';
  options?: string[];
}

const initialFieldsData: FieldData[] = [
  { id: 1, label: "Patient ID", category: "Basic Info", isVisible: true, order: 1, width: '180px', required: true, inputType: 'text', placeholder: 'Auto-generated' },
  { id: 2, label: "Designation", category: "Basic Info", isVisible: true, order: 2, width: '120px', required: true, inputType: 'select', options: ['Mr.', 'Mrs.', 'Ms.', 'Dr.', 'Baby', 'Master'] },
  { id: 3, label: "First Name", category: "Basic Info", isVisible: true, order: 3, width: '220px', required: true, inputType: 'text', placeholder: 'First Name' },
  { id: 4, label: "Last Name", category: "Basic Info", isVisible: true, order: 4, width: '220px', required: true, inputType: 'text', placeholder: 'Last Name' },
  { id: 6, label: "Gender", category: "Basic Info", isVisible: true, order: 5, width: '150px', required: true, inputType: 'select', options: ['Male', 'Female', 'Other'] },
  { id: 5, label: "Age", category: "Vitals", isVisible: true, order: 6, width: '180px', required: true, inputType: 'age' },
  { id: 7, label: "Height (cm)", category: "Vitals", isVisible: false, order: null, width: '140px', required: false, inputType: 'text', placeholder: '0' },
  { id: 8, label: "Weight (kg)", category: "Vitals", isVisible: false, order: null, width: '140px', required: false, inputType: 'text', placeholder: '0' },
  { id: 9, label: "Phone Number", category: "Contact Info", isVisible: true, order: 7, width: '240px', required: true, inputType: 'phone' },
  { id: 10, label: "Email Address", category: "Contact Info", isVisible: false, order: null, width: '240px', required: false, inputType: 'text', placeholder: 'example@mail.com' },
  { id: 11, label: "Address", category: "Contact Info", isVisible: true, order: 8, width: '100%', required: false, inputType: 'textarea', placeholder: 'Full Address' },
  { id: 12, label: "Aadhaar Number", category: "Identification", isVisible: false, order: null, width: '200px', required: false, inputType: 'text' },
  { id: 13, label: "UHID / MRN", category: "Identification", isVisible: false, order: null, width: '180px', required: false, inputType: 'text' },
  { id: 14, label: "Passport Number", category: "Identification", isVisible: false, order: null, width: '180px', required: false, inputType: 'text' },
  { id: 24, label: "Referring Doctor", category: "Referral", isVisible: true, order: 9, width: '230px', required: false, inputType: 'select', options: ['Self', 'Dr. Smith', 'Dr. Jones', 'Dr. Akram'] },
  { id: 30, label: "Referral Lab", category: "Referral", isVisible: false, order: null, width: '230px', required: false, inputType: 'select', options: ['Self'] },
  { id: 19, label: "Referral Type", category: "Referral", isVisible: false, order: null, width: '180px', required: false, inputType: 'select', options: ['Walk-in', 'Doctor', 'Hospital', 'Camp'] },
  { id: 22, label: "Collection Date", category: "Collection", isVisible: true, order: 10, width: '180px', required: true, inputType: 'date' },
  { id: 23, label: "Collected By", category: "Collection", isVisible: false, order: null, width: '200px', required: false, inputType: 'select', options: ['Lab Technician', 'Nurse', 'Phlebotomist'] },
  { id: 29, label: "Report Delivery", category: "Collection", isVisible: true, order: 11, width: '250px', required: false, inputType: 'multi-select', options: ['Hard Copy', 'Email', 'WhatsApp', 'App'] },
  { id: 17, label: "Clinical History", category: "Medical Info", isVisible: false, order: null, width: '100%', required: false, inputType: 'textarea' },
  { id: 18, label: "Current Meds", category: "Medical Info", isVisible: false, order: null, width: '100%', required: false, inputType: 'textarea' }
];

export default function RegistrationPage() {
  const { orgId, permissions, userRole, permsLoaded } = usePermissions();

  const [isCustomizeModalOpen, setIsCustomizeModalOpen] = useState(false);
  const [isQuotationModalOpen, setIsQuotationModalOpen] = useState(false);
  const [registrationFields, setRegistrationFields] = useState<FieldData[]>(initialFieldsData);

  const canSee = (screenNames: string[]) => {
      if (orgId === 1) return true;
      if (!permsLoaded) return false;

      if (permissions.length === 0) {
          const authScreens = ['User Setup', 'Roles', 'Permissions', 'Doctor Signatures'];
          const isAuthModule = screenNames.every(name => authScreens.includes(name));
          if (userRole.toLowerCase().includes('admin')) return true;
          return !isAuthModule;
      }
      return permissions.some(p => screenNames.includes(p.module) && p.action === 'Access');
  };

  useEffect(() => {
    if (typeof window !== 'undefined') {
        const savedSettings = localStorage.getItem('lab_registration_fields');
        if (savedSettings) {
          try { 
            const parsed = JSON.parse(savedSettings);
            if (Array.isArray(parsed) && parsed.length > 5) {
              const mergedFields = [...parsed];
              initialFieldsData.forEach(initialField => {
                if (!mergedFields.find(f => f.id === initialField.id)) mergedFields.push(initialField);
              });
              setRegistrationFields(mergedFields);
            }
          } catch (e) {}
        }
    }
  }, []); 

  useEffect(() => {
    if (typeof window !== 'undefined' && registrationFields !== initialFieldsData) {
        localStorage.setItem('lab_registration_fields', JSON.stringify(registrationFields));
    }
  }, [registrationFields]);

  if (!permsLoaded) {
      return (
          <div className="flex h-screen w-full items-center justify-center bg-slate-50">
              <MusicBarLoader text="Authenticating..." />
          </div>
      );
  }

  if (!canSee(['Registration'])) {
      return (
        <div className="w-full h-screen flex flex-col items-center justify-center bg-[#f8fafc] p-6 text-center">
            <Lock className="text-slate-300 mb-4" size={48} />
            <h2 className="text-xl font-bold text-slate-700">Access Restricted</h2>
            <p className="text-slate-500 mt-2 text-sm max-w-sm">You do not have permission to view Registration.</p>
        </div>
      );
  }

  return (
    <div className="w-full h-full flex flex-col p-6 overflow-hidden bg-slate-50">
      <div className="w-full h-full flex flex-col mx-auto overflow-hidden">
        <NewRegistration 
            fields={registrationFields}
            onCustomizeClick={() => setIsCustomizeModalOpen(true)} 
            onQuotationClick={() => setIsQuotationModalOpen(true)}
        />
        {isCustomizeModalOpen && (
            <CustomizeRegistrationModal 
              isOpen={isCustomizeModalOpen} 
              onClose={() => setIsCustomizeModalOpen(false)} 
              fields={registrationFields}
              setFields={setRegistrationFields}
            />
        )}
        {isQuotationModalOpen && (
            <QuotationModal 
              isOpen={isQuotationModalOpen}
              onClose={() => setIsQuotationModalOpen(false)}
            />
        )}
      </div>
    </div>
  );
}
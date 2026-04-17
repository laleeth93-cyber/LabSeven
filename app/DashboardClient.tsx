"use client";

import React, { useState, useEffect, Suspense } from 'react'; 
import { useRouter } from 'next/navigation';
import { Lock } from 'lucide-react';
import DashboardOverview from '@/app/components/DashboardOverview';
import { usePermissions } from '@/app/context/PermissionContext';
import MusicBarLoader from '@/app/components/MusicBarLoader'; 

function DashboardContent() {
  const router = useRouter();
  const { orgId, permissions, userRole, permsLoaded } = usePermissions();
  const [activeView, setActiveView] = useState('loading');

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
    if (!permsLoaded) return;

    // Check if they are allowed to see the dashboard. If not, auto-redirect them!
    if (canSee(['Dashboard'])) {
        setActiveView('dashboard');
    } else {
        if (canSee(['Registration'])) router.replace('/registration');
        else if (canSee(['Result Entry'])) router.replace('/results/entry');
        else if (canSee(['Patient List'])) router.replace('/list');
        else if (canSee(['Departments', 'Test Library', 'Formats', 'Parameters', 'Packages'])) router.replace('/tests');
        else if (canSee(['Specimen', 'Vacutainers', 'Method', 'UOM', 'Operator', 'Multivalues'])) router.replace('/masters');
        else if (canSee(['Doctors', 'Partner Labs', 'Hospitals', 'Outsourced Labs'])) router.replace('/referrals');
        else if (canSee(['General Settings'])) router.replace('/lab-profile');
        else if (canSee(['Header Setup', 'Body Settings', 'Footer Layout', 'Page Formatting'])) router.replace('/reports');
        else setActiveView('restricted'); // Total Lockout
    }
  }, [permsLoaded, permissions, userRole, router]);

  if (!permsLoaded || activeView === 'loading') {
      return (
          <div className="flex h-full w-full items-center justify-center">
              <MusicBarLoader text="Authenticating..." />
          </div>
      );
  }

  if (activeView === 'restricted') {
      return (
        <div className="w-full h-full flex flex-col items-center justify-center bg-[#f8fafc] p-6 text-center">
            <Lock className="text-slate-300 mb-4" size={48} />
            <h2 className="text-xl font-bold text-slate-700">Access Restricted</h2>
            <p className="text-slate-500 mt-2 text-sm max-w-sm">You do not have permission to view any modules. Please contact your Lab Administrator.</p>
        </div>
      );
  }

  return (
    <div className="w-full h-full flex flex-col p-6 overflow-hidden">
      <div className="w-full h-full flex flex-col mx-auto overflow-hidden">
        <DashboardOverview />
      </div>
    </div>
  );
}

export default function DashboardClient() {
    return (
        <Suspense fallback={
            <div className="flex h-screen w-full items-center justify-center">
                <MusicBarLoader text="Loading Lab Seven..." />
            </div>
        }>
            <DashboardContent />
        </Suspense>
    );
}
// --- BLOCK app/sensitivity/page.tsx OPEN ---
"use client";

import React, { useEffect, useState } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { Bug, Pill, Layers, ListTree, Info } from 'lucide-react';

import OrganismsPage from '../organisms/page';
import AntibioticsPage from '../antibiotics/page';
import AntibioticClassesPage from '../antibiotic-classes/page';
import MultiValuesPage from '../multi-values/page';
import SusceptibilityInfoPage from '../susceptibility-info/page';

export default function SensitivityPage() {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState('Organisms');
  const searchParams = useSearchParams();
  const tabParam = searchParams.get('tab');

  useEffect(() => {
    if (tabParam) {
        if (tabParam === 'Antibiotics') setActiveTab('Antibiotics');
        else if (tabParam === 'Antibiotic Classes') setActiveTab('Antibiotic Classes');
        else if (tabParam === 'Interpretations') setActiveTab('Interpretations');
        else if (tabParam === 'Susceptibility Info') setActiveTab('Susceptibility Info');
        else setActiveTab('Organisms');
    } else {
        setActiveTab('Organisms');
    }
  }, [tabParam]);

  const tabs = [
    { label: 'Organisms', icon: <Bug size={14}/>, color: 'bg-rose-500' },
    { label: 'Antibiotics', icon: <Pill size={14}/>, color: 'bg-emerald-500' },
    { label: 'Antibiotic Classes', icon: <Layers size={14}/>, color: 'bg-cyan-500' },
    { label: 'Interpretations', icon: <ListTree size={14}/>, color: 'bg-amber-500' },
    { label: 'Susceptibility Info', icon: <Info size={14}/>, color: 'bg-blue-500' },
  ];

  return (
    <div className="flex flex-col w-full h-full bg-[#f1f5f9] font-sans">
      <div className="bg-white border-b border-slate-200 shrink-0 z-20 shadow-sm px-6 pt-3">
        <div className="flex items-center gap-1 overflow-x-auto no-scrollbar">
            {tabs.map(tab => (
                <button 
                    key={tab.label}
                    onClick={() => {
                        setActiveTab(tab.label);
                        router.replace(`/sensitivity?tab=${tab.label}`, { scroll: false });
                    }}
                    className={`flex items-center gap-2 px-4 py-2 text-xs font-bold uppercase tracking-wider transition-all border-b-2 whitespace-nowrap ${
                        activeTab === tab.label ? 'border-[#9575cd] text-[#9575cd] bg-purple-50/50 rounded-t-md' : 'border-transparent text-slate-500 hover:text-slate-700 hover:bg-slate-50 rounded-t-md'
                    }`}
                >
                    {tab.icon}{tab.label}
                </button>
            ))}
        </div>
      </div>
      <div className="flex-1 overflow-hidden relative">
          {activeTab === 'Organisms' && <div className="h-full overflow-hidden"><OrganismsPage /></div>}
          {activeTab === 'Antibiotics' && <div className="h-full overflow-hidden"><AntibioticsPage /></div>}
          {activeTab === 'Antibiotic Classes' && <div className="h-full overflow-hidden"><AntibioticClassesPage /></div>}
          {activeTab === 'Interpretations' && <div className="h-full overflow-hidden"><MultiValuesPage /></div>}
          {activeTab === 'Susceptibility Info' && <div className="h-full overflow-hidden"><SusceptibilityInfoPage /></div>}
      </div>
    </div>
  );
}
// --- BLOCK app/sensitivity/page.tsx CLOSE ---
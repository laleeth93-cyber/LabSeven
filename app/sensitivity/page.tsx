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
    { label: 'Organisms', icon: <Bug size={14}/> },
    { label: 'Antibiotics', icon: <Pill size={14}/> },
    { label: 'Antibiotic Classes', icon: <Layers size={14}/> },
    { label: 'Interpretations', icon: <ListTree size={14}/> },
    { label: 'Susceptibility Info', icon: <Info size={14}/> },
  ];

  return (
    <div className="flex flex-1 overflow-hidden p-0 gap-0 relative h-full font-sans">
      <div className="w-full h-full bg-white rounded-none md:rounded-[10px] md:shadow-xl md:border md:border-slate-200 overflow-hidden flex flex-col relative z-10">
        
        {/* UNIFIED PAGE HEADER: min-h-[38px] h-[38px] xl:min-h-[42px] xl:h-[42px] */}
        <div className="px-2.5 xl:px-3 py-1.5 md:py-0 md:px-2.5 xl:px-3 bg-white md:bg-slate-50 shrink-0 flex items-center justify-between gap-1.5 xl:gap-2 border-b border-slate-200 z-20 min-h-[38px] h-[38px] xl:min-h-[42px] xl:h-[42px]">
            {/* Left: 20px Title in Calibri */}
            <div className="flex items-center gap-1.5 xl:gap-2 shrink-0">
                <div className="p-1 rounded bg-purple-50 text-[#9575cd] shadow-2xs">
                    <Bug size={16} />
                </div>
                <h2 className="text-[20px] font-semibold text-slate-800 tracking-tight leading-none" style={{ fontFamily: "'Calibri', Arial, sans-serif" }}>
                    Sensitivity Configuration
                </h2>
            </div>

            {/* Right: Module Tabs */}
            <div className="hidden md:flex items-center h-[24px] xl:h-[26px] bg-slate-100 rounded-[5px] p-0.5 gap-0.5 border border-slate-200 shrink-0">
                {tabs.map(tab => (
                    <button 
                        key={tab.label}
                        onClick={() => {
                            setActiveTab(tab.label);
                            router.replace(`/sensitivity?tab=${tab.label}`, { scroll: false });
                        }}
                        className={`h-full whitespace-nowrap px-2 xl:px-2.5 rounded text-[11px] xl:text-[12px] font-normal transition-all flex items-center gap-1.5 leading-none ${
                            activeTab === tab.label ? 'bg-white shadow-sm text-slate-800 font-medium' : 'text-slate-500 hover:text-slate-700'
                        }`}
                    >
                        {tab.icon}
                        <span>{tab.label}</span>
                    </button>
                ))}
            </div>
        </div>

        {/* Mobile Tabs Header */}
        <div className="md:hidden flex items-center gap-1 px-2 py-1.5 bg-slate-50 border-b border-slate-200 overflow-x-auto no-scrollbar shrink-0">
            {tabs.map(tab => (
                <button 
                    key={tab.label}
                    onClick={() => {
                        setActiveTab(tab.label);
                        router.replace(`/sensitivity?tab=${tab.label}`, { scroll: false });
                    }}
                    className={`h-[24px] px-2 rounded text-[11px] font-normal whitespace-nowrap flex items-center gap-1 shrink-0 ${
                        activeTab === tab.label ? 'bg-white shadow-sm text-[#9575cd] font-medium border border-slate-200' : 'text-slate-500'
                    }`}
                >
                    {tab.icon}
                    <span>{tab.label}</span>
                </button>
            ))}
        </div>

        {/* Content Area */}
        <div className="flex-1 min-h-0 flex flex-col overflow-hidden bg-[#f8fafc]">
            {activeTab === 'Organisms' && <div className="h-full overflow-hidden"><OrganismsPage embedded={true} /></div>}
            {activeTab === 'Antibiotics' && <div className="h-full overflow-hidden"><AntibioticsPage embedded={true} /></div>}
            {activeTab === 'Antibiotic Classes' && <div className="h-full overflow-hidden"><AntibioticClassesPage embedded={true} /></div>}
            {activeTab === 'Interpretations' && <div className="h-full overflow-hidden"><MultiValuesPage embedded={true} /></div>}
            {activeTab === 'Susceptibility Info' && <div className="h-full overflow-hidden"><SusceptibilityInfoPage embedded={true} /></div>}
        </div>
      </div>
    </div>
  );
}

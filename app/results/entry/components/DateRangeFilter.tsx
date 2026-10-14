"use client";

import React, { useState, useRef, useEffect } from 'react';
import { Calendar as CalendarIcon, ChevronDown, Check, ChevronLeft, ChevronRight } from 'lucide-react';

interface DateRange {
  from: Date | null;
  to: Date | null;
  label: string;
}

interface DateRangeFilterProps {
  onFilterChange: (range: DateRange) => void;
  buttonClassName?: string;
  align?: "start" | "center" | "end";
  initialRange?: DateRange; // 🚨 FIX: Accept external range to sync text labels
}

// --- HELPER: CUSTOM CALENDAR (DATE ONLY) ---
const MiniCalendar = ({ value, onChange, label, hideLabelOnMobile }: { value: Date | null, onChange: (d: Date) => void, label: string, hideLabelOnMobile?: boolean }) => {
  const [viewDate, setViewDate] = useState(value || new Date());

  const currentYear = new Date().getFullYear();
  const years = Array.from({ length: 11 }, (_, i) => currentYear - 5 + i);
  
  const months = [
    "January", "February", "March", "April", "May", "June", 
    "July", "August", "September", "October", "November", "December"
  ];

  const getDaysInMonth = (year: number, month: number) => new Date(year, month + 1, 0).getDate();
  const getFirstDayOfMonth = (year: number, month: number) => new Date(year, month, 1).getDay();

  const handlePrevMonth = () => setViewDate(new Date(viewDate.getFullYear(), viewDate.getMonth() - 1, 1));
  const handleNextMonth = () => setViewDate(new Date(viewDate.getFullYear(), viewDate.getMonth() + 1, 1));

  const handleMonthSelect = (e: React.ChangeEvent<HTMLSelectElement>) => {
    setViewDate(new Date(viewDate.getFullYear(), parseInt(e.target.value), 1));
  };

  const handleYearSelect = (e: React.ChangeEvent<HTMLSelectElement>) => {
    setViewDate(new Date(parseInt(e.target.value), viewDate.getMonth(), 1));
  };

  const daysInMonth = getDaysInMonth(viewDate.getFullYear(), viewDate.getMonth());
  const startDay = getFirstDayOfMonth(viewDate.getFullYear(), viewDate.getMonth());

  const days = [];
  for (let i = 0; i < startDay; i++) days.push(null);
  for (let i = 1; i <= daysInMonth; i++) days.push(new Date(viewDate.getFullYear(), viewDate.getMonth(), i));

  const isSelected = (d: Date) => {
    return value && d.getDate() === value.getDate() && d.getMonth() === value.getMonth() && d.getFullYear() === value.getFullYear();
  };

  const isToday = (d: Date) => {
    const today = new Date();
    return d.getDate() === today.getDate() && d.getMonth() === today.getMonth() && d.getFullYear() === today.getFullYear();
  };

  return (
    <div className="w-[190px] p-1.5 bg-white rounded-lg border border-slate-100 shadow-sm mx-auto">
        <div className={`text-[9px] font-bold text-slate-400 uppercase mb-1.5 text-center ${hideLabelOnMobile ? 'hidden md:block' : ''}`}>{label}</div>
        
        <div className="flex items-center justify-between mb-1.5 px-1">
            <button onClick={handlePrevMonth} className="p-0.5 hover:bg-slate-100 rounded text-slate-500"><ChevronLeft size={12}/></button>
            
            <div className="flex items-center gap-1">
                <select 
                    id={`month-select-${label.replace(/\s+/g, '-')}`}
                    name={`monthSelect-${label.replace(/\s+/g, '-')}`}
                    aria-label={`Select Month for ${label}`} 
                    value={viewDate.getMonth()} 
                    onChange={handleMonthSelect}
                    className="text-[11px] font-bold text-slate-700 bg-transparent cursor-pointer outline-none hover:text-[#9575cd] appearance-none text-center"
                    style={{ textAlignLast: 'center' }} 
                >
                    {months.map((m, i) => <option key={m} value={i}>{m}</option>)}
                </select>

                <select 
                    id={`year-select-${label.replace(/\s+/g, '-')}`}
                    name={`yearSelect-${label.replace(/\s+/g, '-')}`}
                    aria-label={`Select Year for ${label}`} 
                    value={viewDate.getFullYear()} 
                    onChange={handleYearSelect}
                    className="text-[11px] font-bold text-slate-700 bg-transparent cursor-pointer outline-none hover:text-[#9575cd] appearance-none"
                >
                    {years.map(y => <option key={y} value={y}>{y}</option>)}
                </select>
            </div>

            <button onClick={handleNextMonth} className="p-0.5 hover:bg-slate-100 rounded text-slate-500"><ChevronRight size={12}/></button>
        </div>

        <div className="grid grid-cols-7 mb-1">
            {['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa'].map(d => <div key={d} className="text-[9px] text-center text-slate-400 font-medium">{d}</div>)}
        </div>

        <div className="grid grid-cols-7 gap-0.5">
            {days.map((d, idx) => (
                <div key={idx} className="h-6 flex items-center justify-center">
                    {d ? (
                        <button
                            onClick={() => onChange(d)}
                            className={`w-5 h-5 rounded-full text-[10px] font-medium transition-all flex items-center justify-center ${
                                isSelected(d) ? 'bg-[#9575cd] text-white shadow-sm' : isToday(d) ? 'text-[#9575cd] font-bold bg-purple-50' : 'text-slate-600 hover:bg-slate-100'
                            }`}
                        >
                            {d.getDate()}
                        </button>
                    ) : <div />}
                </div>
            ))}
        </div>
    </div>
  );
};

// --- MAIN FILTER COMPONENT ---
export default function DateRangeFilter({ onFilterChange, buttonClassName, align = "end", initialRange }: DateRangeFilterProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [activePreset, setActivePreset] = useState('Today');
  const [displayLabel, setDisplayLabel] = useState('Today'); 
  const [mobileDateTab, setMobileDateTab] = useState<'from' | 'to'>('from');
  const [mobileScreen, setMobileScreen] = useState<'list' | 'calendar'>('list');

  useEffect(() => {
    if (isOpen) {
        setMobileScreen('list');
    }
  }, [isOpen]);
  
  const [tempFrom, setTempFrom] = useState<Date | null>(new Date());
  const [tempTo, setTempTo] = useState<Date | null>(new Date());

  const containerRef = useRef<HTMLDivElement>(null);

  // 🚨 FIX: Force synchronization of the label and preset if a master initialRange is provided
  useEffect(() => {
    if (initialRange && initialRange.label) {
        setDisplayLabel(initialRange.label);
        setTempFrom(initialRange.from);
        setTempTo(initialRange.to);
        
        const presets = ['Today', 'Yesterday', 'Last 7 Days', 'Month to Date', 'Last Month', 'Year to Date', 'Last Year', 'Specific Date', 'Date Range'];
        if (presets.includes(initialRange.label)) {
            setActivePreset(initialRange.label);
        } else {
            setActivePreset(initialRange.from?.getTime() === initialRange.to?.getTime() ? 'Specific Date' : 'Date Range');
        }
    }
  }, [initialRange?.from, initialRange?.to, initialRange?.label]);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) setIsOpen(false);
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const presets = ['Today', 'Yesterday', 'Last 7 Days', 'Month to Date', 'Last Month', 'Year to Date', 'Last Year', 'Specific Date', 'Date Range'];

  const handlePresetClick = (preset: string) => {
    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());

    let from: Date | null = null;
    let to: Date | null = null;

    if (preset === 'Specific Date' || preset === 'Date Range') {
        setActivePreset(preset);
        setMobileScreen('calendar');
        return;
    }

    switch (preset) {
      case 'Today': from = today; to = today; break;
      case 'Yesterday':
        const yest = new Date(today); yest.setDate(today.getDate() - 1);
        from = yest; to = yest; break;
      case 'Last 7 Days':
        const last7 = new Date(today); last7.setDate(today.getDate() - 6);
        from = last7; to = today; break;
      case 'Month to Date':
        from = new Date(today.getFullYear(), today.getMonth(), 1); to = today; break;
      case 'Last Month':
        from = new Date(today.getFullYear(), today.getMonth() - 1, 1);
        to = new Date(today.getFullYear(), today.getMonth(), 0); break;
      case 'Year to Date':
        from = new Date(today.getFullYear(), 0, 1); to = today; break;
      case 'Last Year':
        from = new Date(today.getFullYear() - 1, 0, 1);
        to = new Date(today.getFullYear() - 1, 11, 31); break;
    }

    setActivePreset(preset);
    setDisplayLabel(preset); 
    onFilterChange({ from, to, label: preset });
    setIsOpen(false);
  };

  const applyCustomRange = () => {
    if (!tempFrom) return;
    let from = tempFrom;
    let to = activePreset === 'Specific Date' ? tempFrom : (tempTo || tempFrom);
    const format = (d: Date | null) => d ? d.toLocaleString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' }) : '';
    let label = activePreset === 'Specific Date' ? format(from) : `${format(from)} - ${format(to)}`;

    setActivePreset(activePreset); 
    setDisplayLabel(label); 
    onFilterChange({ from, to, label });
    setIsOpen(false);
  };

  const finalButtonClass = buttonClassName || "flex items-center gap-2 px-3 py-1.5 bg-white border border-slate-200 rounded-md shadow-sm hover:bg-slate-50 transition-all h-8 group min-w-[140px]";

  const alignmentClass = align === 'start' 
    ? 'md:left-0 md:right-auto md:translate-x-0' 
    : align === 'center' 
    ? 'md:left-1/2 md:-translate-x-1/2'
    : 'md:right-0 md:left-auto md:translate-x-0';

  return (
    <div className="relative w-full md:w-auto" ref={containerRef}>
      
      <button onClick={() => setIsOpen(!isOpen)} className={finalButtonClass}>
        <div className="flex items-center gap-1.5 w-full overflow-hidden">
            <CalendarIcon size={12} className="text-slate-500 group-hover:text-[#9575cd] transition-colors shrink-0"/>
            <span className="text-[10px] font-bold text-slate-700 whitespace-nowrap overflow-hidden text-ellipsis text-left flex-1">
                {displayLabel}
            </span>
        </div>
        <ChevronDown size={12} className="text-slate-400 shrink-0 ml-1"/>
      </button>

      {isOpen && (
        <>
          <div className="fixed inset-0 z-[90] bg-slate-900/20 backdrop-blur-[2px] md:hidden" onClick={() => setIsOpen(false)}></div>
          <div className={`fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 md:translate-y-0 z-[100] w-[210px] max-h-[85vh] rounded-xl
            md:absolute ${alignmentClass} md:top-full md:bottom-auto md:w-auto md:mt-2 md:max-h-none
            bg-white shadow-2xl border border-slate-200 flex flex-col md:flex-row overflow-y-auto md:overflow-visible
            animate-in fade-in zoom-in-95 duration-200`}>
          
          <div className={`w-full md:w-40 bg-white md:bg-slate-50/50 md:border-r border-slate-100 py-1 shrink-0 ${mobileScreen === 'list' ? 'flex flex-col' : 'hidden md:flex flex-col'} overflow-y-auto overflow-x-hidden md:overflow-visible no-scrollbar`}>
            <div className="md:hidden px-3 pt-1 pb-1.5 font-bold text-slate-800 text-[11px] border-b border-slate-100 mb-0.5">Select Range</div>
            {presets.map(preset => (
              <button
                key={preset}
                onClick={() => handlePresetClick(preset)}
                className={`w-full text-left px-3 py-1.5 md:py-2 text-[10px] md:text-xs font-bold flex items-center justify-between transition-colors shrink-0 whitespace-nowrap ${
                    activePreset === preset 
                    ? 'bg-purple-50 md:bg-white text-[#9575cd] border-l-2 border-[#9575cd] shadow-[inset_1px_0_0_#9575cd] md:shadow-none' 
                    : 'text-slate-600 hover:bg-slate-50 border-l-2 border-transparent'
                }`}
              >
                {preset}
                <span className={activePreset === preset ? 'inline' : 'hidden md:inline opacity-0'}><Check size={12} className="md:w-3 md:h-3"/></span>
              </button>
            ))}
          </div>
          
          <div className={`p-3 md:p-4 bg-white min-h-[250px] flex-col justify-between w-full ${mobileScreen === 'calendar' ? 'flex' : 'hidden md:flex'}`}>
            <div className="md:hidden flex items-center justify-between border-b border-slate-100 pb-2 mb-3">
               <button onClick={() => setMobileScreen('list')} className="text-slate-500 hover:text-slate-800 font-bold text-xs flex items-center gap-1">
                 <ChevronLeft size={16}/> Options
               </button>
               <span className="font-bold text-[11px] text-slate-800">{activePreset}</span>
            </div>
            <div className="flex flex-col md:flex-row gap-4 items-center md:items-start">
                {activePreset === 'Specific Date' && <MiniCalendar label="Select Date" value={tempFrom} onChange={setTempFrom} />}

                {activePreset === 'Date Range' && (
                    <div className="flex flex-col md:flex-row gap-0 md:gap-4 items-center md:items-start w-full">
                        <div className="md:hidden flex w-full bg-slate-100 rounded-lg p-1 mb-2 max-w-[220px] mx-auto">
                            <button onClick={() => setMobileDateTab('from')} className={`flex-1 py-1 text-[11px] font-bold rounded-md transition-colors ${mobileDateTab === 'from' ? 'bg-white shadow-sm text-slate-800' : 'text-slate-500'}`}>From</button>
                            <button onClick={() => setMobileDateTab('to')} className={`flex-1 py-1 text-[11px] font-bold rounded-md transition-colors ${mobileDateTab === 'to' ? 'bg-white shadow-sm text-slate-800' : 'text-slate-500'}`}>To</button>
                        </div>
                        
                        <div className={`md:block w-full flex justify-center ${mobileDateTab === 'from' ? 'block' : 'hidden'}`}>
                            <MiniCalendar label="From Date" value={tempFrom} onChange={(d) => { setTempFrom(d); setMobileDateTab('to'); }} hideLabelOnMobile={true} />
                        </div>
                        <div className="hidden md:block w-[1px] bg-slate-100 self-stretch"></div>
                        <div className={`md:block w-full flex justify-center ${mobileDateTab === 'to' ? 'block' : 'hidden'}`}>
                            <MiniCalendar label="To Date" value={tempTo} onChange={setTempTo} hideLabelOnMobile={true} />
                        </div>
                    </div>
                )}

                {!['Specific Date', 'Date Range'].includes(activePreset) && (
                    <div className="w-full md:w-[260px] flex flex-col items-center justify-center text-slate-300 gap-2 h-32 md:h-[250px]">
                        <CalendarIcon size={32} strokeWidth={1.5} />
                        <p className="text-xs font-medium">Select "Custom" options to view calendar</p>
                    </div>
                )}
            </div>

            {['Specific Date', 'Date Range'].includes(activePreset) && (
                <div className="flex justify-end pt-3 border-t border-slate-50 mt-4 md:mt-2 gap-2">
                    <button onClick={() => setIsOpen(false)} className="px-3 py-1.5 text-xs font-bold text-slate-500 hover:bg-slate-50 rounded">Cancel</button>
                    <button onClick={applyCustomRange} className="px-4 py-1.5 bg-[#9575cd] text-white text-xs font-bold rounded shadow-sm hover:bg-[#7e57c2] transition-colors">Apply Filter</button>
                </div>
            )}
          </div>
        </div>
        </>
      )}
    </div>
  );
}
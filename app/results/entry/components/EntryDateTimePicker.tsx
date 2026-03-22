// --- BLOCK app/results/entry/components/EntryDateTimePicker.tsx OPEN ---
"use client";

import React, { useState, useRef, useEffect, useId } from 'react';
import { createPortal } from 'react-dom';
import { Clock, Calendar as CalendarIcon, ChevronLeft, ChevronRight, Check } from 'lucide-react';

interface EntryDateTimePickerProps {
  date: string; // ISO String
  onChange: (date: string) => void;
  label?: string; 
  align?: 'left' | 'right'; 
}

export default function EntryDateTimePicker({ date, onChange, label = "Entry:", align = "right" }: EntryDateTimePickerProps) {
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const [popoverPos, setPopoverPos] = useState<{top: number, left: number} | null>(null);
  
  // Create a unique ID for this specific picker, so multiple pickers don't conflict
  const uniqueId = useId();
  const popupId = `datetime-picker-popup-${uniqueId.replace(/:/g, '')}`;
  
  const parseDate = (d: string) => {
    const parsed = new Date(d);
    return isNaN(parsed.getTime()) ? new Date() : parsed;
  };

  const [selectedDate, setSelectedDate] = useState<Date>(parseDate(date));
  const [viewDate, setViewDate] = useState<Date>(parseDate(date)); 
  const [hours, setHours] = useState(parseDate(date).getHours());
  const [minutes, setMinutes] = useState(parseDate(date).getMinutes());

  useEffect(() => {
    if (!isOpen) {
        const d = parseDate(date);
        setSelectedDate(d);
        setHours(d.getHours());
        setMinutes(d.getMinutes());
        setViewDate(d); 
    }
  }, [date, isOpen]);

  // --- SMART POSITIONING LOGIC ---
  useEffect(() => {
    if (isOpen && containerRef.current) {
        const rect = containerRef.current.getBoundingClientRect();
        const width = 280;
        const height = 360; // Approx height of the calendar popup
        
        let left = align === 'left' ? rect.left : (rect.right - width);
        if (left < 10) left = 10;
        if (left + width > window.innerWidth - 10) left = window.innerWidth - width - 10;

        let top = rect.bottom + 5;
        // SMART FIX: If opening downwards pushes it off the screen, open it UPWARDS instead!
        if (top + height > window.innerHeight - 10) {
            top = rect.top - height - 5;
        }

        setPopoverPos({ top, left });
    }
  }, [isOpen, align]);

  // --- CLICK OUTSIDE (Scroll Bug Removed) ---
  useEffect(() => {
    const handleGlobalClick = (event: MouseEvent) => {
       if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
          const popupEl = document.getElementById(popupId);
          if (popupEl && !popupEl.contains(event.target as Node)) {
             setIsOpen(false);
          }
       }
    };

    if(isOpen) {
        document.addEventListener('mousedown', handleGlobalClick);
    }
    
    return () => {
        document.removeEventListener('mousedown', handleGlobalClick);
    };
  }, [isOpen, popupId]);

  const months = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];
  
  const getDaysInMonth = (year: number, month: number) => new Date(year, month + 1, 0).getDate();
  const getFirstDayOfMonth = (year: number, month: number) => new Date(year, month, 1).getDay();

  const handlePrevMonth = () => setViewDate(new Date(viewDate.getFullYear(), viewDate.getMonth() - 1, 1));
  const handleNextMonth = () => setViewDate(new Date(viewDate.getFullYear(), viewDate.getMonth() + 1, 1));

  const daysInMonth = getDaysInMonth(viewDate.getFullYear(), viewDate.getMonth());
  const startDay = getFirstDayOfMonth(viewDate.getFullYear(), viewDate.getMonth());

  const days = [];
  for (let i = 0; i < startDay; i++) days.push(null);
  for (let i = 1; i <= daysInMonth; i++) days.push(new Date(viewDate.getFullYear(), viewDate.getMonth(), i));

  const isSameDay = (d1: Date, d2: Date) => d1.getDate() === d2.getDate() && d1.getMonth() === d2.getMonth() && d1.getFullYear() === d2.getFullYear();
  const isToday = (d: Date) => isSameDay(d, new Date());

  const handleDateClick = (d: Date) => setSelectedDate(d);

  const applyDateTime = () => {
    const newDate = new Date(selectedDate);
    newDate.setHours(hours);
    newDate.setMinutes(minutes);
    newDate.setSeconds(0);
    
    const offset = newDate.getTimezoneOffset() * 60000;
    const localISOTime = (new Date(newDate.getTime() - offset)).toISOString().slice(0, 19);
    
    onChange(localISOTime);
    setIsOpen(false);
  };

  const formatDisplay = (d: Date, h: number, m: number) => {
    const dateStr = d.toLocaleDateString('en-GB', { day: 'numeric', month: 'short' });
    const timeStr = `${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}`;
    return `${dateStr}, ${timeStr}`;
  };

  return (
    <div className="relative" ref={containerRef}>
      <div 
        onClick={(e) => { e.stopPropagation(); setIsOpen(!isOpen); }}
        className={`flex items-center bg-white border rounded-md shadow-sm h-8 px-2 gap-2 cursor-pointer transition-all group select-none min-w-[160px] ${isOpen ? 'border-[#9575cd] ring-1 ring-[#9575cd]' : 'border-slate-200 hover:border-[#9575cd] hover:shadow'}`}
      >
        <Clock size={14} className="text-slate-400 group-hover:text-[#9575cd] transition-colors" />
        <span className="text-[10px] font-bold text-slate-500 group-hover:text-[#9575cd] uppercase tracking-wider whitespace-nowrap">{label}</span>
        <span className="text-xs font-bold text-slate-700 font-mono flex-1 text-right">
            {formatDisplay(selectedDate, hours, minutes)}
        </span>
      </div>

      {isOpen && popoverPos && createPortal(
        <div 
            id={popupId}
            className="fixed bg-white rounded-xl shadow-2xl border border-slate-200 w-[280px] overflow-hidden animate-in fade-in zoom-in-95 duration-200 ring-1 ring-black/5"
            style={{ 
                top: popoverPos.top, 
                left: popoverPos.left, 
                zIndex: 9999999 // HARDCODED FORCE ON TOP
            }}
        >
            <div className="bg-slate-50 px-4 py-3 border-b border-slate-100 flex items-center justify-between">
                <span className="text-xs font-bold text-slate-600">Select Time</span>
                <button onClick={applyDateTime} className="text-[#9575cd] hover:bg-purple-50 p-1 rounded-full transition-colors">
                    <Check size={16} />
                </button>
            </div>

            <div className="p-4 space-y-4">
                <div className="space-y-2">
                    <div className="flex items-center justify-between px-1">
                        <button onClick={handlePrevMonth} className="p-1 hover:bg-slate-100 rounded text-slate-500"><ChevronLeft size={16}/></button>
                        <span className="text-xs font-bold text-slate-700">{months[viewDate.getMonth()]} {viewDate.getFullYear()}</span>
                        <button onClick={handleNextMonth} className="p-1 hover:bg-slate-100 rounded text-slate-500"><ChevronRight size={16}/></button>
                    </div>

                    <div className="grid grid-cols-7 text-center">
                        {['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa'].map(d => (
                            <span key={d} className="text-[10px] font-bold text-slate-400">{d}</span>
                        ))}
                    </div>

                    <div className="grid grid-cols-7 gap-1">
                        {days.map((d, i) => (
                            <div key={i} className="h-7 flex items-center justify-center">
                                {d ? (
                                    <button 
                                        onClick={() => handleDateClick(d)}
                                        className={`w-7 h-7 rounded-full text-xs font-medium transition-all ${
                                            isSameDay(d, selectedDate)
                                            ? 'bg-[#9575cd] text-white shadow-md scale-105'
                                            : isToday(d)
                                                ? 'bg-purple-50 text-[#9575cd] font-bold'
                                                : 'text-slate-600 hover:bg-slate-100'
                                        }`}
                                    >
                                        {d.getDate()}
                                    </button>
                                ) : <div />}
                            </div>
                        ))}
                    </div>
                </div>

                <div className="h-[1px] bg-slate-100 w-full"></div>

                <div className="flex items-center justify-between bg-slate-50 p-2 rounded-lg border border-slate-100">
                    <div className="flex items-center gap-2">
                        <Clock size={14} className="text-slate-400" />
                        <span className="text-xs font-bold text-slate-500">Time</span>
                    </div>
                    
                    <div className="flex items-center gap-1">
                        <div className="relative group">
                            <input 
                                type="number" 
                                min={0} max={23}
                                value={hours.toString().padStart(2, '0')}
                                onChange={(e) => {
                                    let val = parseInt(e.target.value);
                                    if(val > 23) val = 23; if(val < 0) val = 0;
                                    setHours(val);
                                }}
                                className="w-10 h-8 bg-white border border-slate-200 rounded text-center text-sm font-bold text-slate-700 outline-none focus:border-[#9575cd] focus:ring-1 focus:ring-[#9575cd] transition-all"
                            />
                        </div>
                        <span className="text-slate-400 font-bold">:</span>
                        <div className="relative group">
                            <input 
                                type="number" 
                                min={0} max={59}
                                value={minutes.toString().padStart(2, '0')}
                                onChange={(e) => {
                                    let val = parseInt(e.target.value);
                                    if(val > 59) val = 59; if(val < 0) val = 0;
                                    setMinutes(val);
                                }}
                                className="w-10 h-8 bg-white border border-slate-200 rounded text-center text-sm font-bold text-slate-700 outline-none focus:border-[#9575cd] focus:ring-1 focus:ring-[#9575cd] transition-all"
                            />
                        </div>
                    </div>
                </div>

                <div className="grid grid-cols-2 gap-2">
                    <button onClick={() => setIsOpen(false)} className="px-3 py-2 text-xs font-bold text-slate-500 bg-white border border-slate-200 rounded-lg hover:bg-slate-50">Cancel</button>
                    <button onClick={applyDateTime} className="px-3 py-2 text-xs font-bold text-white bg-[#9575cd] rounded-lg shadow-sm hover:bg-[#7e57c2]">Apply Time</button>
                </div>
            </div>
        </div>,
        document.body 
      )}
    </div>
  );
}
// --- BLOCK app/results/entry/components/EntryDateTimePicker.tsx CLOSE ---
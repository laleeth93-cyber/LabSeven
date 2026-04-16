import React from 'react';
import MusicBarLoader from '@/app/components/MusicBarLoader';

export default function Loading() {
    return (
        <div className="w-full h-full flex flex-col items-center justify-center min-h-[70vh] bg-[#f1f5f9] animate-in fade-in duration-300">
            {/* We are reusing your custom animated loader for perfect visual consistency */}
            <MusicBarLoader text="Loading module data..." />
        </div>
    );
}
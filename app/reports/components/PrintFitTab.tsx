// --- app/reports/components/PrintFitTab.tsx Block Open ---
import React from 'react';
import PrintControls from './PrintControls';

interface PrintFitTabProps {
    formData: any;
    handleChange: (e: React.ChangeEvent<any>) => void;
    handleCustomChange: (field: string, value: any) => void;
}

export default function PrintFitTab({ formData, handleChange, handleCustomChange }: PrintFitTabProps) {
    const activeStyle = (formData.letterheadStyle && formData.letterheadStyle.startsWith('custom')) ? formData.letterheadStyle : 'custom1';
    const currentMargins = formData.marginSettings?.[activeStyle] || { top: 120, bottom: 80, left: 40, right: 40 };
    const t = currentMargins.top;
    const b = currentMargins.bottom;
    const l = currentMargins.left;
    const r = currentMargins.right;

    return (
        <div className="h-full w-full overflow-y-auto custom-scrollbar pr-2 pb-4">
            <PrintControls 
                formData={formData}
                handleChange={handleChange}
                handleCustomChange={handleCustomChange}
                activeStyle={activeStyle}
                t={t} b={b} l={l} r={r}
            />
        </div>
    );
}
// --- app/reports/components/PrintFitTab.tsx Block Close ---
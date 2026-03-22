// --- app/reports/components/BodyTab.tsx Block Open ---
import React from 'react';
import BodySettingsPanel from './body/BodySettingsPanel';

interface BodyTabProps {
    bodySettings: any;
    handleToggleBody: (field: string) => void;
    handleBodySettingChange: (field: string, value: any) => void;
}

export default function BodyTab({ 
    bodySettings, 
    handleToggleBody, 
    handleBodySettingChange
}: BodyTabProps) {

    return (
        <div className="h-full w-full overflow-y-auto custom-scrollbar pr-2 pb-4">
            <BodySettingsPanel 
                bodySettings={bodySettings}
                handleToggleBody={handleToggleBody}
                handleBodySettingChange={handleBodySettingChange}
            />
        </div>
    );
}
// --- app/reports/components/BodyTab.tsx Block Close ---
// --- BLOCK app/authorizations/components/PermissionsTab.tsx OPEN ---
import React, { useState } from 'react';
import { Key, Save, Loader2, LayoutGrid, ChevronDown, ChevronRight, CheckSquare, CheckCircle2 } from 'lucide-react';
import { getUserPermissions, saveUserPermissions } from '@/app/actions/authorizations';
import MusicBarLoader from '@/app/components/MusicBarLoader'; 

const ALL_ACTIONS = ['View', 'Add', 'Edit', 'Delete', 'Approve', 'Print'];

const MODULE_HIERARCHY = [
    { 
        module: 'Front Desk', 
        screens: [
            { name: 'Dashboard', actions: ['View'] },
            { name: 'Registration', actions: ['View', 'Add', 'Edit', 'Delete', 'Print'] },
            { name: 'Patient List', actions: ['View', 'Edit', 'Delete', 'Print'] }
        ] 
    },
    { 
        module: 'Laboratory', 
        screens: [
            { name: 'Result Entry', actions: ['View', 'Edit', 'Approve', 'Print'] }
        ] 
    },
    { 
        module: 'Test Config', 
        screens: [
            { name: 'Departments', actions: ['View', 'Add', 'Edit', 'Delete'] },
            { name: 'Test Library', actions: ['View', 'Add', 'Edit', 'Delete'] },
            { name: 'Formats', actions: ['View', 'Edit'] },
            { name: 'Parameters', actions: ['View', 'Add', 'Edit', 'Delete'] },
            { name: 'Packages', actions: ['View', 'Add', 'Edit', 'Delete'] }
        ] 
    },
    { 
        module: 'Sensitivity',
        screens: [
            { name: 'Organism', actions: ['View', 'Add', 'Edit', 'Delete'] },
            { name: 'Antibiotic', actions: ['View', 'Add', 'Edit', 'Delete'] },
            { name: 'Antibiotic Classes', actions: ['View', 'Add', 'Edit', 'Delete'] },
            { name: 'Interpretation', actions: ['View', 'Add', 'Edit', 'Delete'] },
            { name: 'Susceptibility Info', actions: ['View', 'Add', 'Edit', 'Delete'] }
        ]
    },
    { 
        module: 'Masters', 
        screens: [
            { name: 'Specimen', actions: ['View', 'Add', 'Edit', 'Delete'] },
            { name: 'Vacutainers', actions: ['View', 'Add', 'Edit', 'Delete'] },
            { name: 'Method', actions: ['View', 'Add', 'Edit', 'Delete'] },
            { name: 'UOM', actions: ['View', 'Add', 'Edit', 'Delete'] },
            { name: 'Operator', actions: ['View', 'Add', 'Edit', 'Delete'] },
            { name: 'Multivalues', actions: ['View', 'Add', 'Edit', 'Delete'] }
        ] 
    },
    { 
        module: 'Referrals', 
        screens: [
            { name: 'Doctors', actions: ['View', 'Add', 'Edit', 'Delete'] },
            { name: 'Partner Labs', actions: ['View', 'Add', 'Edit', 'Delete'] },
            { name: 'Hospitals', actions: ['View', 'Add', 'Edit', 'Delete'] },
            { name: 'Outsourced Labs', actions: ['View', 'Add', 'Edit', 'Delete'] }
        ] 
    },
    { 
        module: 'Reporting Formatting', 
        screens: [
            { name: 'Header Setup', actions: ['View', 'Edit'] },
            { name: 'Body Settings', actions: ['View', 'Edit'] },
            { name: 'Footer Layout', actions: ['View', 'Edit'] },
            { name: 'Page Formatting', actions: ['View', 'Edit'] }
        ] 
    },
    { 
        module: 'Authorizations', 
        screens: [
            { name: 'User Setup', actions: ['View', 'Add', 'Edit', 'Delete'] },
            { name: 'Roles', actions: ['View', 'Add', 'Edit', 'Delete'] },
            { name: 'Permissions', actions: ['View', 'Edit'] },
            { name: 'Doctor Signatures', actions: ['View', 'Edit'] }
        ] 
    },
    { 
        module: 'Setup', 
        screens: [
            { name: 'General Settings', actions: ['View', 'Edit'] }
        ] 
    }
];

export default function PermissionsTab({ users }: any) {
    const [selectedUserForPerms, setSelectedUserForPerms] = useState<number | ''>('');
    const [isPermsLoading, setIsPermsLoading] = useState(false);
    const [permMatrix, setPermMatrix] = useState<Record<string, string[]>>({});
    const [saveSuccess, setSaveSuccess] = useState(false);

    const handleUserSelectForPerms = async (e: React.ChangeEvent<HTMLSelectElement>) => {
        const val = e.target.value;
        setSelectedUserForPerms(val ? parseInt(val) : '');
        if (!val) return setPermMatrix({});

        setIsPermsLoading(true);
        const res = await getUserPermissions(parseInt(val));
        if (res.success && res.data) {
            const newMatrix: Record<string, string[]> = {};
            res.data.forEach((p: any) => {
                if (!newMatrix[p.module]) newMatrix[p.module] = [];
                newMatrix[p.module].push(p.action);
            });
            setPermMatrix(newMatrix);
        }
        setIsPermsLoading(false);
    };

    const isAllSelected = MODULE_HIERARCHY.every(moduleGroup => {
        const hasModuleAccess = (permMatrix[moduleGroup.module] || []).includes('Access');
        if (!hasModuleAccess) return false;
        
        return moduleGroup.screens.every(screen => {
            const screenPerms = permMatrix[screen.name] || [];
            if (!screenPerms.includes('Access')) return false;
            return screen.actions.every(action => screenPerms.includes(action));
        });
    });

    const handleGlobalSelectAll = (selectAll: boolean) => {
        if (!selectAll) {
            setPermMatrix({});
            return;
        }

        const newMatrix: Record<string, string[]> = {};
        MODULE_HIERARCHY.forEach(moduleGroup => {
            newMatrix[moduleGroup.module] = ['Access'];
            moduleGroup.screens.forEach(screen => {
                newMatrix[screen.name] = ['Access', ...screen.actions];
            });
        });
        setPermMatrix(newMatrix);
    };

    const toggleModuleAccess = (moduleName: string) => {
        setPermMatrix(prev => {
            const newMatrix = { ...prev };
            const current = newMatrix[moduleName] || [];
            if (current.includes('Access')) {
                newMatrix[moduleName] = current.filter(a => a !== 'Access');
            } else {
                newMatrix[moduleName] = [...current, 'Access'];
            }
            return newMatrix;
        });
    };

    const toggleScreenAccess = (screenName: string) => {
        setPermMatrix(prev => {
            const newMatrix = { ...prev };
            const current = newMatrix[screenName] || [];
            if (current.includes('Access')) newMatrix[screenName] = current.filter(a => a !== 'Access');
            else newMatrix[screenName] = [...current, 'Access'];
            return newMatrix;
        });
    };

    const toggleAction = (screenName: string, action: string) => {
        setPermMatrix(prev => {
            const currentScreenPerms = prev[screenName] || [];
            const newMatrix = { ...prev };
            if (currentScreenPerms.includes(action)) newMatrix[screenName] = currentScreenPerms.filter(a => a !== action);
            else newMatrix[screenName] = [...currentScreenPerms, action];
            return newMatrix;
        });
    };

    const handleSavePermissions = async () => {
        if (!selectedUserForPerms) return alert("Please select a user first");
        setIsPermsLoading(true);
        const permissionsToSave: {module: string, action: string}[] = [];
        Object.keys(permMatrix).forEach(itemName => {
            permMatrix[itemName].forEach(act => {
                permissionsToSave.push({ module: itemName, action: act });
            });
        });
        const res = await saveUserPermissions(selectedUserForPerms as number, permissionsToSave);
        setIsPermsLoading(false);
        if (res.success) {
            setSaveSuccess(true);
            setTimeout(() => setSaveSuccess(false), 2000);
        } else {
            alert(res.message);
        }
    };

    return (
        <div className="space-y-2.5 flex-1 flex flex-col h-full min-h-0">
            {/* TOP BAR AS SEPARATE BLOCK */}
            <div className="bg-white rounded-[6px] border border-slate-200 shadow-sm p-2.5 xl:p-3 shrink-0 flex flex-col sm:flex-row justify-between sm:items-center gap-2.5">
                <div>
                    <h3 className="font-semibold text-slate-800 text-[14px] xl:text-[15px] leading-tight" style={{ fontFamily: "'Calibri', Arial, sans-serif" }}>
                        Permissions Matrix
                    </h3>
                    <p className="text-[11px] text-slate-500 font-normal mt-0.5">
                        Explicitly configure module access, screen visibility, and granular operational actions.
                    </p>
                </div>
                
                <div className="flex flex-wrap sm:flex-nowrap items-center gap-2">
                    <select 
                        value={selectedUserForPerms} 
                        onChange={handleUserSelectForPerms} 
                        className="h-[26px] xl:h-[28px] text-[11px] xl:text-[12px] font-normal border border-slate-300 rounded-[5px] px-2.5 bg-white text-slate-700 focus:outline-none focus:border-[#9575cd] min-w-[220px]"
                    >
                        <option value="">-- Select a User to Configure --</option>
                        {users.map((u: any) => <option key={u.id} value={u.id}>{u.name} ({u.username})</option>)}
                    </select>
                    
                    {selectedUserForPerms && (
                        <>
                            <button 
                                onClick={() => handleGlobalSelectAll(!isAllSelected)} 
                                disabled={isPermsLoading}
                                className="h-[24px] xl:h-[26px] px-2.5 xl:px-3 text-[11px] xl:text-[12px] font-medium rounded-[5px] border border-slate-300 bg-white hover:bg-slate-50 text-slate-700 flex items-center gap-1.5 transition-all shadow-2xs disabled:opacity-50"
                            >
                                <CheckSquare size={13} /> {isAllSelected ? 'Clear All' : 'Select All'}
                            </button>
                            <button 
                                onClick={handleSavePermissions} 
                                disabled={isPermsLoading} 
                                className="h-[24px] xl:h-[26px] px-3 xl:px-3.5 text-[11px] xl:text-[12px] font-medium rounded-[5px] text-white flex items-center gap-1.5 shadow-2xs hover:opacity-95 transition-all disabled:opacity-50"
                                style={{ background: saveSuccess ? '#059669' : 'linear-gradient(to right, #9575cd, #b39ddb)' }}
                            >
                                {isPermsLoading ? <Loader2 size={13} className="animate-spin" /> : saveSuccess ? <CheckCircle2 size={13} /> : <Save size={13} />}
                                <span>{saveSuccess ? 'Saved!' : 'Save Mapping'}</span>
                            </button>
                        </>
                    )}
                </div>
            </div>

            {/* MAIN MATRIX AREA */}
            {selectedUserForPerms ? (
                <>
                    {/* DESKTOP TABLE VIEW AS SEPARATE BLOCK */}
                    <div className="hidden md:flex flex-1 flex-col overflow-hidden rounded-[6px] border border-slate-200 shadow-sm bg-white min-h-0">
                        {isPermsLoading ? (
                            <div className="flex justify-center items-center flex-1 p-12">
                                <MusicBarLoader text="Loading Permissions..." />
                            </div>
                        ) : (
                            <>
                                <div className="flex-1 min-h-0 overflow-auto custom-scrollbar relative">
                                    <table className="w-full text-left border-collapse border-spacing-0">
                                        <thead className="bg-[#9575cd] sticky top-0 z-10 text-white border-b border-[#7e57c2]">
                                            <tr>
                                                <th className="text-white font-medium text-[11px] uppercase tracking-wider align-middle leading-none w-[34%]" style={{ padding: '5px 6px', verticalAlign: 'middle', lineHeight: 1 }}>
                                                    System Hierarchy
                                                </th>
                                                {ALL_ACTIONS.map(action => (
                                                    <th key={action} className="text-white font-medium text-[11px] uppercase tracking-wider align-middle leading-none text-center w-[11%]" style={{ padding: '5px 6px', verticalAlign: 'middle', lineHeight: 1 }}>
                                                        {action}
                                                    </th>
                                                ))}
                                            </tr>
                                        </thead>
                                        <tbody className="divide-y divide-slate-100">
                                            {MODULE_HIERARCHY.map(moduleGroup => {
                                                const hasModuleAccess = (permMatrix[moduleGroup.module] || []).includes('Access');
                                                
                                                return (
                                                    <React.Fragment key={moduleGroup.module}>
                                                        <tr className={`border-y border-slate-200 transition-colors ${hasModuleAccess ? 'bg-purple-50/50' : 'bg-slate-50/60 hover:bg-slate-100/60'}`}>
                                                            <td style={{ padding: '5px 6px', verticalAlign: 'middle', lineHeight: 1 }} className="border-r border-slate-200">
                                                                <label className="flex items-center gap-2 cursor-pointer select-none">
                                                                    <input 
                                                                        type="checkbox" 
                                                                        checked={hasModuleAccess}
                                                                        onChange={() => toggleModuleAccess(moduleGroup.module)}
                                                                        className="w-3.5 h-3.5 text-[#9575cd] rounded border-slate-300 focus:ring-[#9575cd] cursor-pointer"
                                                                    />
                                                                    {hasModuleAccess ? <ChevronDown size={14} className="text-[#9575cd]" /> : <ChevronRight size={14} className="text-slate-400" />}
                                                                    <LayoutGrid size={13} className={hasModuleAccess ? "text-[#9575cd]" : "text-slate-400"}/> 
                                                                    <span className={`text-[11px] xl:text-[12px] font-semibold uppercase tracking-wider ${hasModuleAccess ? "text-[#5e35b1]" : "text-slate-600"}`}>
                                                                        {moduleGroup.module}
                                                                    </span>
                                                                </label>
                                                            </td>
                                                            <td colSpan={ALL_ACTIONS.length} style={{ padding: '5px 6px', verticalAlign: 'middle', lineHeight: 1 }}>
                                                                {hasModuleAccess ? (
                                                                    <span className="text-[10px] font-medium text-[#5e35b1] bg-purple-100/70 px-1.5 py-0.5 rounded border border-purple-200/80">
                                                                        Module Active ({moduleGroup.screens.length} Screens)
                                                                    </span>
                                                                ) : (
                                                                    <span className="text-[10px] text-slate-400 italic">
                                                                        Check module box to enable and view screens...
                                                                    </span>
                                                                )}
                                                            </td>
                                                        </tr>

                                                        {hasModuleAccess && moduleGroup.screens.map(screen => {
                                                            const screenPerms = permMatrix[screen.name] || [];
                                                            const hasScreenAccess = screenPerms.includes('Access');
                                                            
                                                            return (
                                                                <tr key={screen.name} className="hover:bg-slate-50/80 transition-colors border-b border-[#d9d9d9]">
                                                                    <td style={{ padding: '5px 6px', verticalAlign: 'middle', lineHeight: 1 }} className="border-r border-slate-200 pl-7">
                                                                        <label className="flex items-center gap-2 cursor-pointer select-none">
                                                                            <input 
                                                                                type="checkbox" 
                                                                                checked={hasScreenAccess}
                                                                                onChange={() => toggleScreenAccess(screen.name)}
                                                                                className="w-3.5 h-3.5 text-[#9575cd] rounded border-slate-300 focus:ring-[#9575cd] cursor-pointer"
                                                                            />
                                                                            <span className={`text-[11px] xl:text-[12px] ${hasScreenAccess ? "text-slate-800 font-medium" : "text-slate-400 font-normal"}`}>
                                                                                {screen.name}
                                                                            </span>
                                                                        </label>
                                                                    </td>
                                                                    {ALL_ACTIONS.map(action => (
                                                                        <td key={action} style={{ padding: '5px 6px', verticalAlign: 'middle', lineHeight: 1 }} className="text-center border-b border-[#d9d9d9]">
                                                                            {screen.actions.includes(action) ? (
                                                                                <input 
                                                                                    type="checkbox" 
                                                                                    checked={screenPerms.includes(action)} 
                                                                                    onChange={() => toggleAction(screen.name, action)} 
                                                                                    disabled={!hasScreenAccess}
                                                                                    className={`w-3.5 h-3.5 rounded focus:ring-[#9575cd] cursor-pointer ${hasScreenAccess ? 'text-[#9575cd] border-slate-300' : 'text-slate-300 border-slate-200 cursor-not-allowed opacity-40'}`}
                                                                                />
                                                                            ) : (
                                                                                <span className="text-slate-300 font-medium select-none text-[11px]">-</span>
                                                                            )}
                                                                        </td>
                                                                    ))}
                                                                </tr>
                                                            );
                                                        })}
                                                    </React.Fragment>
                                                );
                                            })}
                                        </tbody>
                                    </table>
                                </div>

                                {/* PINNED FOOTER */}
                                <div className="px-3 py-1.5 bg-[#f8fafc] border-t border-slate-200 shrink-0 flex items-center justify-between text-[11px] text-slate-500 font-medium">
                                    <div className="flex items-center gap-3">
                                        <span>Configuring User: <strong className="text-slate-700">{users.find((u: any) => u.id === selectedUserForPerms)?.name || 'Selected User'}</strong></span>
                                        <span>•</span>
                                        <span>Enabled Modules: <strong className="text-purple-700">{MODULE_HIERARCHY.filter(m => (permMatrix[m.module] || []).includes('Access')).length} / {MODULE_HIERARCHY.length}</strong></span>
                                    </div>
                                    <div className="text-[10px] text-slate-400">
                                        Changes apply after clicking "Save Mapping"
                                    </div>
                                </div>
                            </>
                        )}
                    </div>

                    {/* MOBILE ACCORDION CARD VIEW */}
                    <div className="md:hidden space-y-2 mb-6">
                        {isPermsLoading ? (
                            <div className="flex justify-center p-8 bg-white rounded-[6px] border border-slate-200">
                                <MusicBarLoader text="Loading Permissions..." />
                            </div>
                        ) : (
                            MODULE_HIERARCHY.map(moduleGroup => {
                                const hasModuleAccess = (permMatrix[moduleGroup.module] || []).includes('Access');

                                return (
                                    <div key={moduleGroup.module} className={`bg-white rounded-[6px] border transition-all overflow-hidden ${hasModuleAccess ? 'border-[#9575cd]/40 shadow-xs' : 'border-slate-200 shadow-xs'}`}>
                                        <div className={`p-2.5 flex items-center justify-between border-b ${hasModuleAccess ? 'bg-[#f8f5ff] border-purple-100' : 'bg-slate-50 border-slate-100'}`}>
                                            <label className="flex items-center gap-2 cursor-pointer min-w-0 flex-1">
                                                <input 
                                                    type="checkbox" 
                                                    checked={hasModuleAccess}
                                                    onChange={() => toggleModuleAccess(moduleGroup.module)}
                                                    className="w-3.5 h-3.5 text-[#9575cd] rounded border-slate-300 focus:ring-[#9575cd] cursor-pointer shrink-0"
                                                />
                                                <LayoutGrid size={14} className={`shrink-0 ${hasModuleAccess ? "text-[#9575cd]" : "text-slate-400"}`}/> 
                                                <span className={`text-[11px] font-semibold uppercase tracking-wider truncate ${hasModuleAccess ? "text-[#5e35b1]" : "text-slate-600"}`}>
                                                    {moduleGroup.module}
                                                </span>
                                            </label>
                                            <span className={`text-[10px] font-medium px-1.5 py-0.5 rounded shrink-0 ${hasModuleAccess ? 'bg-purple-100 text-[#5e35b1]' : 'bg-slate-200/70 text-slate-500'}`}>
                                                {hasModuleAccess ? 'Active' : 'Off'}
                                            </span>
                                        </div>

                                        {hasModuleAccess ? (
                                            <div className="p-2.5 divide-y divide-slate-100 space-y-2">
                                                {moduleGroup.screens.map((screen, sIdx) => {
                                                    const screenPerms = permMatrix[screen.name] || [];
                                                    const hasScreenAccess = screenPerms.includes('Access');

                                                    return (
                                                        <div key={screen.name} className={sIdx > 0 ? "pt-2" : ""}>
                                                            <div className="flex items-center justify-between gap-2 mb-1">
                                                                <label className="flex items-center gap-2 cursor-pointer min-w-0 flex-1">
                                                                    <input 
                                                                        type="checkbox" 
                                                                        checked={hasScreenAccess}
                                                                        onChange={() => toggleScreenAccess(screen.name)}
                                                                        className="w-3.5 h-3.5 text-[#9575cd] rounded border-slate-300 focus:ring-[#9575cd] cursor-pointer shrink-0"
                                                                    />
                                                                    <span className={`text-[11px] font-medium truncate ${hasScreenAccess ? "text-slate-800" : "text-slate-500"}`}>
                                                                        {screen.name}
                                                                    </span>
                                                                </label>
                                                                <span className={`text-[9px] font-semibold px-1.5 py-0.5 rounded ${hasScreenAccess ? 'bg-emerald-50 text-emerald-600' : 'bg-slate-100 text-slate-400'}`}>
                                                                    {hasScreenAccess ? 'Enabled' : 'Disabled'}
                                                                </span>
                                                            </div>

                                                            <div className="flex flex-wrap gap-1 pl-5">
                                                                {screen.actions.map(action => {
                                                                    const isActionChecked = screenPerms.includes(action);

                                                                    return (
                                                                        <button
                                                                            key={action}
                                                                            type="button"
                                                                            onClick={() => hasScreenAccess && toggleAction(screen.name, action)}
                                                                            disabled={!hasScreenAccess}
                                                                            className={`px-2 py-0.5 rounded text-[10px] font-medium transition-all flex items-center gap-1 ${
                                                                                !hasScreenAccess 
                                                                                    ? 'bg-slate-100 text-slate-300 border border-slate-200/50 cursor-not-allowed opacity-60' 
                                                                                    : isActionChecked 
                                                                                        ? 'bg-[#9575cd] text-white shadow-2xs' 
                                                                                        : 'bg-slate-50 text-slate-600 border border-slate-200 hover:bg-slate-100'
                                                                            }`}
                                                                        >
                                                                            <span className={`w-1.5 h-1.5 rounded-full ${isActionChecked ? 'bg-white' : 'bg-slate-300'}`} />
                                                                            {action}
                                                                        </button>
                                                                    );
                                                                })}
                                                            </div>
                                                        </div>
                                                    );
                                                })}
                                            </div>
                                        ) : (
                                            <div className="p-2 text-center text-[10px] text-slate-400 italic">
                                                Enable module to view screens
                                            </div>
                                        )}
                                    </div>
                                );
                            })
                        )}
                    </div>
                </>
            ) : (
                <div className="flex-1 flex flex-col items-center justify-center p-12 text-center bg-white rounded-[6px] border border-slate-200 shadow-sm min-h-[300px]">
                    <div className="w-12 h-12 bg-purple-50 rounded-full flex items-center justify-center mx-auto mb-3 border border-purple-100">
                        <Key size={24} className="text-[#9575cd]" />
                    </div>
                    <h3 className="font-semibold text-slate-800 text-[16px] leading-tight" style={{ fontFamily: "'Calibri', Arial, sans-serif" }}>
                        No User Selected
                    </h3>
                    <p className="text-[12px] text-slate-500 font-normal mt-1 max-w-sm">
                        Select a user from the dropdown above to view, configure, and customize their access permissions.
                    </p>
                </div>
            )}
        </div>
    );
}
// --- BLOCK app/authorizations/components/PermissionsTab.tsx CLOSE ---

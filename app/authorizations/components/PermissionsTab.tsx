// --- app/authorizations/components/PermissionsTab.tsx Block Open ---
import React, { useState } from 'react';
import { Key, Save, Loader2, LayoutGrid, ChevronDown, ChevronRight, CheckSquare } from 'lucide-react';
import { getUserPermissions, saveUserPermissions } from '@/app/actions/authorizations';

// --- EXPANDED HIERARCHY WITH ALL MODULES AS TOP-LEVEL ---
const MODULE_HIERARCHY = [
    { 
        module: 'Front Desk', 
        screens: ['Dashboard', 'Registration', 'Patient List'] 
    },
    { 
        module: 'Laboratory', 
        screens: ['Result Entry'] 
    },
    { 
        module: 'Test Configuration', 
        screens: ['Tests', 'Parameters', 'Test Formats', 'Packages'] 
    },
    { 
        module: 'Masters', 
        screens: ['Departments', 'Specimens', 'Vacutainers', 'Methods', 'UOM', 'Operators', 'Lab Lists'] 
    },
    { 
        module: 'Reporting Formatting', 
        screens: ['Header Setup', 'Body Settings', 'Footer Layout', 'Page Formatting'] 
    },
    { 
        module: 'Authorizations', 
        screens: ['User Setup', 'Roles', 'Permissions', 'Doctor Signatures'] 
    },
    { 
        module: 'Setup', 
        screens: ['General Settings', 'Multivalues', 'Referrals'] 
    }
];

const ACTIONS = ['View', 'Add', 'Edit', 'Delete', 'Approve', 'Print'];

export default function PermissionsTab({ users }: any) {
    const [selectedUserForPerms, setSelectedUserForPerms] = useState<number | ''>('');
    const [isPermsLoading, setIsPermsLoading] = useState(false);
    
    // Matrix now holds actual assigned permissions: 
    const [permMatrix, setPermMatrix] = useState<Record<string, string[]>>({});

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

    // --- GLOBAL SELECT ALL LOGIC ---
    const isAllSelected = MODULE_HIERARCHY.every(moduleGroup => {
        const hasModuleAccess = (permMatrix[moduleGroup.module] || []).includes('Access');
        if (!hasModuleAccess) return false;
        
        return moduleGroup.screens.every(screen => {
            const screenPerms = permMatrix[screen] || [];
            if (!screenPerms.includes('Access')) return false;
            return ACTIONS.every(action => screenPerms.includes(action));
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
                newMatrix[screen] = ['Access', ...ACTIONS];
            });
        });
        setPermMatrix(newMatrix);
    };

    // Grants or Revokes access to an entire Module
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

    // Grants or Revokes access to a specific Screen
    const toggleScreenAccess = (screenName: string) => {
        setPermMatrix(prev => {
            const newMatrix = { ...prev };
            const current = newMatrix[screenName] || [];
            if (current.includes('Access')) newMatrix[screenName] = current.filter(a => a !== 'Access');
            else newMatrix[screenName] = [...current, 'Access'];
            return newMatrix;
        });
    };

    // Grants or Revokes specific Actions within a screen
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
        alert(res.message);
        setIsPermsLoading(false);
    };

    return (
        <div className="space-y-4">
            <div className="flex justify-between items-center bg-white p-4 rounded-xl shadow-sm border border-slate-200">
                <div>
                    <h2 className="font-bold text-slate-800">Permissions Matrix</h2>
                    <p className="text-xs text-slate-500">Explicitly map Module Access, Screen Access, and Individual Actions.</p>
                </div>
                <div className="flex items-center gap-3">
                    <select value={selectedUserForPerms} onChange={handleUserSelectForPerms} className="border border-slate-300 rounded-lg p-2 text-sm font-bold text-slate-700 focus:ring-2 focus:ring-[#9575cd]/50 outline-none min-w-[250px]">
                        <option value="">-- Select a User --</option>
                        {users.map((u: any) => <option key={u.id} value={u.id}>{u.name} ({u.username})</option>)}
                    </select>
                    {selectedUserForPerms && (
                        <div className="flex items-center gap-2">
                            <button 
                                onClick={() => handleGlobalSelectAll(!isAllSelected)} 
                                disabled={isPermsLoading}
                                className={`px-4 py-2 rounded-lg text-sm font-bold flex items-center gap-2 transition-all disabled:opacity-50 ${isAllSelected ? 'bg-slate-200 text-slate-700 hover:bg-slate-300' : 'bg-purple-50 text-purple-700 border border-purple-200 hover:bg-purple-100'}`}
                            >
                                <CheckSquare size={16} /> {isAllSelected ? 'Clear All' : 'Select All'}
                            </button>
                            <button 
                                onClick={handleSavePermissions} 
                                disabled={isPermsLoading} 
                                className="bg-[#9575cd] text-white px-4 py-2 rounded-lg text-sm font-bold shadow-sm hover:bg-[#7e57c2] flex items-center gap-2 transition-all disabled:opacity-50"
                            >
                                {isPermsLoading ? <Loader2 size={16} className="animate-spin" /> : <Save size={16} />} Save Mapping
                            </button>
                        </div>
                    )}
                </div>
            </div>

            {selectedUserForPerms ? (
                <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden mb-8">
                    {isPermsLoading ? (
                        <div className="flex justify-center p-12"><Loader2 className="animate-spin text-[#9575cd]" size={32} /></div>
                    ) : (
                        <table className="w-full text-left text-sm border-collapse">
                            <thead className="bg-slate-50 border-b border-slate-200 text-slate-600">
                                <tr>
                                    <th className="py-3 px-4 font-bold border-r border-slate-200 w-[28%]">System Hierarchy</th>
                                    {ACTIONS.map(action => <th key={action} className="py-3 px-4 font-bold text-center w-[12%]">{action}</th>)}
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100">
                                {MODULE_HIERARCHY.map(moduleGroup => {
                                    // Check if the Module itself has the "Access" permission
                                    const hasModuleAccess = (permMatrix[moduleGroup.module] || []).includes('Access');
                                    
                                    return (
                                        <React.Fragment key={moduleGroup.module}>
                                            {/* MODULE ROW: Checkbox applies only to Module Permission */}
                                            <tr className={`border-y border-slate-200 transition-colors ${hasModuleAccess ? 'bg-[#f8f5ff]' : 'bg-slate-50/50 hover:bg-slate-100'}`}>
                                                <td className="py-3 px-4 font-extrabold text-slate-700 uppercase tracking-wider text-xs border-r border-slate-200">
                                                    <label className="flex items-center gap-3 cursor-pointer">
                                                        <input 
                                                            type="checkbox" 
                                                            checked={hasModuleAccess}
                                                            onChange={() => toggleModuleAccess(moduleGroup.module)}
                                                            className="w-4 h-4 text-[#9575cd] rounded border-slate-300 focus:ring-[#9575cd] cursor-pointer"
                                                        />
                                                        {hasModuleAccess ? <ChevronDown size={16} className="text-[#9575cd]" /> : <ChevronRight size={16} className="text-slate-400" />}
                                                        <LayoutGrid size={15} className={hasModuleAccess ? "text-[#9575cd]" : "text-slate-400"}/> 
                                                        <span className={hasModuleAccess ? "text-[#5e35b1]" : "text-slate-500"}>{moduleGroup.module}</span>
                                                    </label>
                                                </td>
                                                {/* Module row does not have action checkboxes */}
                                                <td colSpan={ACTIONS.length} className={hasModuleAccess ? "bg-[#f8f5ff]" : "bg-slate-50/50"}>
                                                    {!hasModuleAccess && (
                                                        <span className="text-[10px] text-slate-400 px-4 italic">Check module to view screens...</span>
                                                    )}
                                                </td>
                                            </tr>

                                            {/* SCREEN ROWS: Only show if Module is checked! */}
                                            {hasModuleAccess && moduleGroup.screens.map(screen => {
                                                const screenPerms = permMatrix[screen] || [];
                                                const hasScreenAccess = screenPerms.includes('Access');
                                                
                                                return (
                                                    <tr key={screen} className="hover:bg-slate-50 transition-colors">
                                                        <td className="py-3 px-4 font-bold text-slate-600 border-r border-slate-200 pl-10">
                                                            <label className="flex items-center gap-3 cursor-pointer">
                                                                <input 
                                                                    type="checkbox" 
                                                                    checked={hasScreenAccess}
                                                                    onChange={() => toggleScreenAccess(screen)}
                                                                    className="w-4 h-4 text-[#9575cd] rounded border-slate-300 focus:ring-[#9575cd] cursor-pointer"
                                                                />
                                                                <span className={hasScreenAccess ? "text-slate-800" : "text-slate-500"}>{screen}</span>
                                                            </label>
                                                        </td>
                                                        {ACTIONS.map(action => (
                                                            <td key={action} className="py-3 px-4 text-center">
                                                                <input 
                                                                    type="checkbox" 
                                                                    checked={screenPerms.includes(action)} 
                                                                    onChange={() => toggleAction(screen, action)} 
                                                                    disabled={!hasScreenAccess}
                                                                    className={`w-4 h-4 rounded focus:ring-[#9575cd] cursor-pointer ${hasScreenAccess ? 'text-[#9575cd] border-slate-300' : 'text-slate-300 border-slate-200 cursor-not-allowed opacity-50'}`}
                                                                />
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
                    )}
                </div>
            ) : (
                <div className="bg-white p-12 rounded-xl border border-slate-200 shadow-sm flex flex-col items-center justify-center text-center">
                    <Key size={48} className="text-slate-300 mb-4" />
                    <h3 className="font-bold text-slate-700 text-lg">No User Selected</h3>
                    <p className="text-sm text-slate-500 max-w-md mt-2">Select a user from the dropdown menu above to start mapping access permissions.</p>
                </div>
            )}
        </div>
    );
}
// --- app/authorizations/components/PermissionsTab.tsx Block Close ---
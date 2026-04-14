// --- BLOCK app/context/PermissionContext.tsx OPEN ---
"use client";

import React, { createContext, useContext, useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { getUserPermissions } from '@/app/actions/authorizations';

type PermissionContextType = {
    permissions: any[];
    userRole: string;
    permsLoaded: boolean;
    orgId: number | null;
};

const PermissionContext = createContext<PermissionContextType>({
    permissions: [],
    userRole: '',
    permsLoaded: false,
    orgId: null,
});

export function PermissionProvider({ children }: { children: React.ReactNode }) {
    const { data: session, status } = useSession();
    const [permissions, setPermissions] = useState<any[]>([]);
    const [userRole, setUserRole] = useState<string>('');
    const [permsLoaded, setPermsLoaded] = useState(false);

    const orgId = (session?.user as any)?.orgId || null;

    useEffect(() => {
        let isMounted = true;
        
        const fetchPerms = async () => {
            // Don't fetch until NextAuth finishes loading the session
            if (status === 'loading') return; 
            
            if (session?.user) {
                const userId = (session.user as any).id;
                if (userId) {
                    try {
                        const res = await getUserPermissions(parseInt(userId));
                        if (isMounted && res.success) {
                            setPermissions(res.data || []);
                            setUserRole(res.roleName || '');
                        }
                    } catch (e) {
                        console.error("Failed to load permissions", e);
                    }
                }
            }
            if (isMounted) setPermsLoaded(true);
        };

        fetchPerms();
        
        return () => { isMounted = false; };
    }, [session, status]);

    return (
        <PermissionContext.Provider value={{ permissions, userRole, permsLoaded, orgId }}>
            {children}
        </PermissionContext.Provider>
    );
}

// Custom hook to be used in all your pages!
export const usePermissions = () => useContext(PermissionContext);
// --- BLOCK app/context/PermissionContext.tsx CLOSE ---
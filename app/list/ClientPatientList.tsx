"use client";

import React, { useState, useEffect, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { Loader2, AlertCircle, Trash2, Lock } from 'lucide-react';
import useSWR from 'swr';

import ListTable from './components/ListTable';
import ListHeader from './components/ListHeader'; 
import BarcodeModal from '@/app/components/BarcodeModal';
import PatientReportModal from './components/PatientReportModal';
import CultureReportModal from './components/CultureReportModal';
import SmartReportModal from './components/SmartReportModal'; 
import AuditLogModal from './components/AuditLogModal'; 
import RefundModal from './components/RefundModal'; 
import ClearDueModal from './components/ClearDueModal'; 
import InvoiceModal from '@/app/registration/InvoiceModal';
import EditPatientModal from './components/EditPatientModal';
import MusicBarLoader from '@/app/components/MusicBarLoader';

import { usePermissions } from '@/app/context/PermissionContext';
import { getPendingWorklist } from '@/app/actions/result-entry'; 
import { deleteBill } from '@/app/actions/patient-list';

// 🚨 ACCEPTS THE PRE-LOADED SERVER DATA
export default function ClientPatientList({ initialBills }: { initialBills: any[] }) {
    const router = useRouter();

    const { orgId, permissions, userRole, permsLoaded } = usePermissions();

    const [currentPage, setCurrentPage] = useState(1);
    const ITEMS_PER_PAGE = 10;

    const [searchQuery, setSearchQuery] = useState('');
    const [activeFilter, setActiveFilter] = useState('All');
    const [sortOrder, setSortOrder] = useState<'newest' | 'oldest'>('newest');
    const [viewMode, setViewMode] = useState<'list' | 'grid'>('list');
    
    const [advFilters, setAdvFilters] = useState({
        testSearch: '', statusFilter: 'All', refDocFilter: 'All', isUrgentFilter: false
    });
    
    const [dateRange, setDateRange] = useState<{ from: Date | null; to: Date | null; label: string }>({
        from: new Date(), to: new Date(), label: 'Today'
    });

    const filtersList = ['All', 'Pending', 'Partial', 'Completed', 'Printed'];

    const canSee = (screenName: string) => {
        if (orgId === 1) return true;
        if (!permsLoaded) return false;
        if (permissions.length === 0) return true; 
        return permissions.some(p => p.module === screenName && p.action === 'Access');
    };

    const canPerform = (action: string) => {
        if (orgId === 1 || userRole.toLowerCase().includes('admin')) return true;
        if (permissions.length === 0) return true; 
        return permissions.some(p => p.module === 'Patient List' && p.action === action);
    };

    // 🚨 SWR CACHING WITH FALLBACK DATA FOR INSTANT LOAD
    const { data: fetchRes, isLoading, mutate: refreshBills } = useSWR(
        (permsLoaded && canSee('Patient List')) ? 'pending-worklist' : null,
        async () => {
            const res = await getPendingWorklist();
            return res;
        },
        {
            fallbackData: { success: true, data: initialBills }, // Instant Data injection
            revalidateOnFocus: false, 
            keepPreviousData: true    
        }
    );

    const bills = fetchRes?.success && fetchRes?.data ? fetchRes.data : [];

    useEffect(() => {
        const savedView = localStorage.getItem('patientListViewPref');
        if (savedView === 'list' || savedView === 'grid') {
            setViewMode(savedView);
        }
    }, []);

    const handleSetViewMode = (mode: 'list' | 'grid') => {
        setViewMode(mode);
        localStorage.setItem('patientListViewPref', mode);
    };

    const uniqueDoctors = useMemo(() => {
        const docs = new Set<string>();
        bills.forEach((b: any) => {
            const ref = b.patient?.refDoctor;
            if (ref && ref !== 'Self') {
                let doc = ref;
                const hospMatch = doc.match(/\(([^)]+)\)/);
                if (hospMatch) doc = doc.replace(hospMatch[0], '');
                const labMatch = doc.match(/-\s*(.+)$/);
                if (labMatch) doc = doc.replace(labMatch[0], '');
                doc = doc.trim();
                if (doc) docs.add(doc);
            }
        });
        return Array.from(docs);
    }, [bills]);

    const [selectedBill, setSelectedBill] = useState<any>(null);
    const [isBarcodeOpen, setIsBarcodeOpen] = useState(false);
    const [isPatientReportOpen, setIsPatientReportOpen] = useState(false);
    const [isCultureReportOpen, setIsCultureReportOpen] = useState(false);
    const [isSmartReportOpen, setIsSmartReportOpen] = useState(false);
    const [isAuditOpen, setIsAuditOpen] = useState(false);
    const [isRefundOpen, setIsRefundOpen] = useState(false);
    const [isClearDueOpen, setIsClearDueOpen] = useState(false);
    const [isEditOpen, setIsEditOpen] = useState(false); 
    const [isInvoiceOpen, setIsInvoiceOpen] = useState(false);
    const [invoiceData, setInvoiceData] = useState<any>(null);
    const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
    const [billToDelete, setBillToDelete] = useState<any>(null);
    const [isDeleting, setIsDeleting] = useState(false);

    useEffect(() => {
        setCurrentPage(1);
    }, [searchQuery, activeFilter, advFilters, sortOrder, dateRange]);

    const getDocName = (refStr: string) => {
        if (!refStr || refStr.toLowerCase() === 'self') return 'Self';
        let doc = refStr;
        const hospMatch = doc.match(/\(([^)]+)\)/);
        if (hospMatch) doc = doc.replace(hospMatch[0], '');
        const labMatch = doc.match(/-\s*(.+)$/);
        if (labMatch) doc = doc.replace(labMatch[0], '');
        return doc.trim() || 'Self';
    };

    const filteredBills = useMemo(() => {
        let filtered = [...bills];

        filtered.sort((a, b) => {
            const dateA = new Date(a.date).getTime();
            const dateB = new Date(b.date).getTime();
            return sortOrder === 'newest' ? dateB - dateA : dateA - dateB;
        });

        if (searchQuery) {
            const lowerSearch = searchQuery.toLowerCase();
            filtered = filtered.filter((bill: any) => 
                bill.patient?.firstName?.toLowerCase().includes(lowerSearch) ||
                bill.patient?.lastName?.toLowerCase().includes(lowerSearch) ||
                bill.billNumber?.toLowerCase().includes(lowerSearch) ||
                bill.patient?.patientId?.toLowerCase().includes(lowerSearch) ||
                (bill.patient?.phone && bill.patient.phone.includes(lowerSearch))
            );
        }

        if (activeFilter !== 'All') {
            filtered = filtered.filter((bill: any) => {
                const items = bill.items || [];
                if (items.length === 0) return false;
                if (activeFilter === 'Pending') return items.some((i: any) => i.status === 'Pending');
                if (activeFilter === 'Partial') return items.some((i: any) => i.status === 'Entered');
                if (activeFilter === 'Completed') return items.some((i: any) => i.status === 'Approved' || i.status === 'Printed');
                if (activeFilter === 'Printed') return items.every((i: any) => i.status === 'Printed');
                return true;
            });
        }

        if (advFilters.statusFilter !== 'All') {
            filtered = filtered.filter((bill: any) => {
                const items = bill.items || [];
                if (advFilters.statusFilter === 'Pending') return items.some((i: any) => i.status === 'Pending');
                if (advFilters.statusFilter === 'Partial') return items.some((i: any) => i.status === 'Entered');
                if (advFilters.statusFilter === 'Completed') return items.some((i: any) => i.status === 'Approved' || i.status === 'Printed');
                return true;
            });
        }
        if (advFilters.refDocFilter !== 'All') {
            filtered = filtered.filter((bill: any) => getDocName(bill.patient?.refDoctor) === advFilters.refDocFilter);
        }
        if (advFilters.isUrgentFilter) {
            filtered = filtered.filter((bill: any) => bill.items?.some((i: any) => i.isUrgent));
        }
        if (advFilters.testSearch) {
            const lowerTest = advFilters.testSearch.toLowerCase();
            filtered = filtered.filter((bill: any) => bill.items?.some((i: any) => i.test?.name?.toLowerCase().includes(lowerTest)));
        }

        if (dateRange.from && dateRange.to) {
            filtered = filtered.filter((bill: any) => {
                const billDate = new Date(bill.date);
                const bDate = new Date(billDate.getFullYear(), billDate.getMonth(), billDate.getDate());
                const from = dateRange.from ? new Date(dateRange.from.getFullYear(), dateRange.from.getMonth(), dateRange.from.getDate()) : null;
                const to = dateRange.to ? new Date(dateRange.to.getFullYear(), dateRange.to.getMonth(), dateRange.to.getDate()) : null;
                if(from && to) return bDate >= from && bDate <= to;
                return true;
            });
        }

        return filtered;
    }, [bills, searchQuery, activeFilter, advFilters, sortOrder, dateRange]);

    const totalItems = filteredBills.length;
    const totalPages = Math.max(1, Math.ceil(totalItems / ITEMS_PER_PAGE));
    const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
    const paginatedBills = filteredBills.slice(startIndex, startIndex + ITEMS_PER_PAGE);

    const handlePrintBill = (bill: any) => {
        const fullName = `${bill.patient?.designation || ''} ${bill.patient?.firstName || ''} ${bill.patient?.lastName || ''}`.trim();
        const ageString = `${bill.patient?.ageY || 0} Y / ${bill.patient?.gender || 'Unknown'}`;
        
        setInvoiceData({
            billId: bill.billNumber || 'INV-0000',
            billDate: new Date(bill.date || Date.now()).toLocaleString('en-GB'),
            patientName: fullName || 'Unknown Patient',
            ageGender: ageString,
            referredBy: bill.referredBy || bill.patient?.refDoctor || 'Self',
            paymentType: bill.paymentMode || 'Cash',
            items: bill.items?.map((item: any) => ({
                id: item.id,
                name: item.test?.name || item.testName || 'Test',
                price: Number(item.price || 0)
            })) || [],
            subTotal: Number(bill.subTotal || (Number(bill.netAmount || 0) + Number(bill.discountAmount || 0))),
            discount: Number(bill.discountAmount || 0),
            totalAmount: Number(bill.netAmount || 0),
            paidAmount: Number(bill.paidAmount || 0),
            balanceDue: Number(bill.dueAmount || 0),
            note: bill.discountReason || ''
        });
        
        setIsInvoiceOpen(true);
    };

    const handlePrintBarcode = (bill: any) => { setSelectedBill(bill); setIsBarcodeOpen(true); };
    const handleOpenReport = (bill: any) => { setSelectedBill(bill); setIsPatientReportOpen(true); };
    const handleOpenSmartReport = (bill: any) => { setSelectedBill(bill); setIsSmartReportOpen(true); };
    const handleOpenCultureReport = (bill: any) => { setSelectedBill(bill); setIsCultureReportOpen(true); };
    const handleOpenClearDue = (bill: any) => { setSelectedBill(bill); setIsClearDueOpen(true); };
    const handleOpenRefund = (bill: any) => { setSelectedBill(bill); setIsRefundOpen(true); };
    const handleOpenAudit = (bill: any) => { setSelectedBill(bill); setIsAuditOpen(true); };
    
    const handleEditBill = (bill: any) => {
        if (!canPerform('Edit')) return alert("You do not have permission to edit patient records.");
        setSelectedBill(bill);
        setIsEditOpen(true);
    };
    
    const handleDeleteBill = (bill: any) => {
        if (!canPerform('Delete')) return alert("You do not have permission to delete patient records.");
        setBillToDelete(bill);
        setIsDeleteModalOpen(true);
    };

    const executeConfirmDelete = async () => {
        if (!billToDelete) return;
        setIsDeleting(true);
        try {
            const res = await deleteBill(billToDelete.id);
            if (res.success) {
                setIsDeleteModalOpen(false);
                setBillToDelete(null);
                refreshBills(); 
            } else {
                alert(`Failed to delete bill: ${res.message}`);
            }
        } catch (err) {
            alert("An error occurred while deleting the bill.");
            console.error(err);
        } finally {
            setIsDeleting(false);
        }
    };

    if (!permsLoaded) return (
        <div className="h-screen w-full flex items-center justify-center bg-slate-50">
            <MusicBarLoader text="Authenticating..." />
        </div>
    );

    if (!canSee('Patient List')) return (
        <div className="w-full h-screen flex flex-col items-center justify-center bg-slate-50 p-6 text-center">
            <Lock className="text-slate-300 mb-4" size={48} />
            <h2 className="text-xl font-bold text-slate-700">Access Restricted</h2>
            <p className="text-slate-500 mt-2 text-sm max-w-sm">You do not have permission to view the Patient List.</p>
        </div>
    );

    return (
        <React.Fragment>
            {isDeleteModalOpen && billToDelete && (
                <div className="fixed inset-0 z-[99999] bg-slate-900/60 flex items-center justify-center p-4 backdrop-blur-sm animate-in fade-in duration-200">
                    <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden animate-in zoom-in-95 duration-200">
                        <div className="p-6 md:p-8 flex flex-col items-center text-center">
                            <div className="w-16 h-16 bg-red-50 text-red-500 rounded-full flex items-center justify-center mb-5 border-[4px] border-red-100">
                                <AlertCircle size={32} strokeWidth={2.5} />
                            </div>
                            <h2 className="text-xl md:text-2xl font-black text-slate-800 mb-2 tracking-tight">Delete Bill?</h2>
                            <p className="text-slate-500 text-sm mb-8 leading-relaxed">
                                Are you sure you want to permanently delete bill <span className="font-bold text-slate-700 bg-slate-100 px-1.5 py-0.5 rounded">{billToDelete.billNumber}</span> for <span className="font-bold text-slate-700">{billToDelete.patient?.firstName} {billToDelete.patient?.lastName}</span>? 
                                <br/><br/>This action removes it from the list and <span className="text-red-500 font-bold">cannot be undone.</span>
                            </p>
                            <div className="flex gap-3 w-full">
                                <button 
                                    onClick={() => setIsDeleteModalOpen(false)} 
                                    disabled={isDeleting}
                                    className="flex-1 py-3 rounded-xl font-bold text-slate-600 bg-slate-100 hover:bg-slate-200 transition-colors disabled:opacity-50"
                                >
                                    Cancel
                                </button>
                                <button 
                                    onClick={executeConfirmDelete} 
                                    disabled={isDeleting}
                                    className="flex-1 py-3 rounded-xl font-bold text-white bg-red-500 hover:bg-red-600 transition-colors shadow-md hover:shadow-lg active:scale-95 disabled:opacity-50 flex items-center justify-center gap-2"
                                >
                                    {isDeleting ? <Loader2 size={18} className="animate-spin" /> : <Trash2 size={18} />}
                                    Yes, Delete
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            <InvoiceModal isOpen={isInvoiceOpen} onClose={() => setIsInvoiceOpen(false)} data={invoiceData} />
            
            {selectedBill && (
                <BarcodeModal 
                    isOpen={isBarcodeOpen} onClose={() => { setIsBarcodeOpen(false); setSelectedBill(null); }} 
                    data={{
                        billId: selectedBill.billNumber, patientName: `${selectedBill.patient?.firstName} ${selectedBill.patient?.lastName}`,
                        ageGender: `${selectedBill.patient?.ageY}Y / ${selectedBill.patient?.gender}`, date: new Date(selectedBill.date).toLocaleString('en-GB'),
                        items: selectedBill.items?.map((i: any) => ({ id: i.id, name: i.test?.name, price: i.price })) || []
                    }} 
                />
            )}

            {isPatientReportOpen && selectedBill && <PatientReportModal isOpen={isPatientReportOpen} onClose={() => { setIsPatientReportOpen(false); setSelectedBill(null); }} billId={selectedBill.id} />}
            {isCultureReportOpen && selectedBill && <CultureReportModal isOpen={isCultureReportOpen} onClose={() => { setIsCultureReportOpen(false); setSelectedBill(null); }} bill={selectedBill} />}
            {isSmartReportOpen && selectedBill && <SmartReportModal isOpen={isSmartReportOpen} onClose={() => { setIsSmartReportOpen(false); setSelectedBill(null); }} bill={selectedBill} />}
            {isAuditOpen && selectedBill && <AuditLogModal isOpen={isAuditOpen} onClose={() => { setIsAuditOpen(false); setSelectedBill(null); }} auditBill={selectedBill} />}
            
            {isRefundOpen && selectedBill && <RefundModal isOpen={isRefundOpen} onClose={() => { setIsRefundOpen(false); setSelectedBill(null); }} refundBill={selectedBill} onSuccess={refreshBills} />}
            {isClearDueOpen && selectedBill && <ClearDueModal isOpen={isClearDueOpen} onClose={() => { setIsClearDueOpen(false); setSelectedBill(null); }} dueBill={selectedBill} onSuccess={refreshBills} />}
            
            {isEditOpen && selectedBill && (
                <EditPatientModal 
                    isOpen={isEditOpen} 
                    onClose={() => { setIsEditOpen(false); setSelectedBill(null); }} 
                    editBill={selectedBill} 
                    onSuccess={refreshBills} 
                />
            )}

            <div className="flex flex-col h-full bg-slate-50 w-full overflow-hidden relative">
                
                <div className="px-4 md:px-6 pt-4 pb-2 shrink-0 w-full max-w-full z-20">
                    <ListHeader 
                        searchQuery={searchQuery} setSearchQuery={setSearchQuery} onDateChange={setDateRange}
                        activeFilter={activeFilter} setActiveFilter={setActiveFilter} filtersList={filtersList}
                        advFilters={advFilters} setAdvFilters={setAdvFilters} uniqueDoctors={uniqueDoctors}
                        viewMode={viewMode} setViewMode={handleSetViewMode}
                        sortOrder={sortOrder} setSortOrder={setSortOrder}
                    />
                </div>

                <div className="flex-1 overflow-hidden flex flex-col relative w-full pt-1">
                    <ListTable 
                        bills={paginatedBills} isLoading={isLoading} viewMode={viewMode}
                        currentPage={currentPage} totalPages={totalPages} totalItems={totalItems} onPageChange={setCurrentPage}
                        onPrintBill={handlePrintBill} onPrintBarcode={handlePrintBarcode} onOpenReport={handleOpenReport}
                        onOpenSmartReport={handleOpenSmartReport} onOpenCultureReport={handleOpenCultureReport}
                        onOpenClearDue={handleOpenClearDue} onOpenRefund={handleOpenRefund} onOpenAudit={handleOpenAudit}
                        onEditBill={handleEditBill} onDeleteBill={handleDeleteBill}
                    />
                </div>
            </div>
        </React.Fragment>
    );
}
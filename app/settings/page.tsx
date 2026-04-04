// --- BLOCK app/settings/page.tsx OPEN ---
"use client";

import React, { useState } from "react";
import { KeyRound, ShieldCheck, AlertCircle, Save, Loader2 } from "lucide-react";
import toast from "react-hot-toast";
import { changeUserPassword } from "@/app/actions/settings";
import { signOut } from "next-auth/react";

export default function SettingsPage() {
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [isProcessing, setIsProcessing] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // 1. Basic Frontend Validation
    if (!currentPassword || !newPassword || !confirmPassword) {
        toast.error("Please fill out all password fields.");
        return;
    }

    if (newPassword !== confirmPassword) {
        toast.error("New passwords do not match!");
        return;
    }

    if (newPassword.length < 6) {
        toast.error("New password must be at least 6 characters long.");
        return;
    }

    setIsProcessing(true);

    // 2. Call the secure Server Action
    const res = await changeUserPassword(currentPassword, newPassword);

    if (res.success) {
        toast.success(res.message);
        // Clear the form
        setCurrentPassword("");
        setNewPassword("");
        setConfirmPassword("");
        
        // Optional: Force them to log in again with the new password
        // setTimeout(() => signOut({ callbackUrl: "/login" }), 2000);
    } else {
        toast.error(res.message);
    }

    setIsProcessing(false);
  };

  return (
    <div className="w-full max-w-[100vw] min-h-screen bg-slate-50 p-4 md:p-6 font-sans overflow-x-hidden">
      
      {/* Page Header */}
      <div className="mb-8">
        <h1 className="text-2xl font-black text-slate-800 tracking-tight flex items-center gap-2">
          <ShieldCheck className="text-[#a07be1]" size={28} />
          Account Settings
        </h1>
        <p className="text-sm text-slate-500 font-medium mt-1">Manage your personal account security and preferences.</p>
      </div>

      <div className="max-w-xl">
          {/* Security Card */}
          <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
            
            <div className="bg-slate-50 p-5 border-b border-slate-200 flex items-center gap-3">
                <div className="w-10 h-10 bg-purple-100 rounded-full flex items-center justify-center text-purple-600 flex-shrink-0">
                    <KeyRound size={20} />
                </div>
                <div>
                    <h2 className="text-lg font-bold text-slate-800">Change Password</h2>
                    <p className="text-xs text-slate-500 font-medium">Update your password to keep your account secure.</p>
                </div>
            </div>

            <form onSubmit={handleSubmit} className="p-6 space-y-5">
                
                {/* Current Password */}
                <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1.5 uppercase tracking-wide">Current Password</label>
                    <input 
                        type="password" 
                        value={currentPassword}
                        onChange={(e) => setCurrentPassword(e.target.value)}
                        placeholder="Enter your current password"
                        className="w-full h-11 px-3 rounded-lg border border-slate-300 text-sm focus:border-[#a07be1] focus:ring-1 focus:ring-[#a07be1] outline-none transition-all"
                    />
                </div>

                {/* New Password */}
                <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1.5 uppercase tracking-wide">New Password</label>
                    <input 
                        type="password" 
                        value={newPassword}
                        onChange={(e) => setNewPassword(e.target.value)}
                        placeholder="Create a new password"
                        className="w-full h-11 px-3 rounded-lg border border-slate-300 text-sm focus:border-[#a07be1] focus:ring-1 focus:ring-[#a07be1] outline-none transition-all"
                    />
                </div>

                {/* Confirm Password */}
                <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1.5 uppercase tracking-wide">Confirm New Password</label>
                    <input 
                        type="password" 
                        value={confirmPassword}
                        onChange={(e) => setConfirmPassword(e.target.value)}
                        placeholder="Re-type your new password"
                        className="w-full h-11 px-3 rounded-lg border border-slate-300 text-sm focus:border-[#a07be1] focus:ring-1 focus:ring-[#a07be1] outline-none transition-all"
                    />
                    {newPassword && confirmPassword && newPassword !== confirmPassword && (
                        <p className="text-xs text-red-500 mt-2 flex items-center gap-1 font-bold">
                            <AlertCircle size={12} /> Passwords do not match
                        </p>
                    )}
                </div>

                {/* Submit Button */}
                <div className="pt-2">
                    <button 
                        type="submit" 
                        disabled={isProcessing}
                        className="w-full h-11 rounded-lg font-bold text-white bg-[#a07be1] hover:bg-[#8e62d9] transition-colors flex items-center justify-center gap-2 disabled:opacity-70"
                    >
                        {isProcessing ? <Loader2 size={18} className="animate-spin" /> : <Save size={18} />}
                        {isProcessing ? "Updating Security..." : "Update Password"}
                    </button>
                </div>

            </form>
          </div>
      </div>

    </div>
  );
}
// --- BLOCK app/settings/page.tsx CLOSE ---
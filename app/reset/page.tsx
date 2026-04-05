// --- BLOCK app/reset/page.tsx OPEN ---
"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Loader2, ArrowLeft, KeyRound, Mail, ShieldCheck } from "lucide-react";
import toast from "react-hot-toast";
import { sendResetOtp, resetPassword } from "@/app/actions/password-reset";

export default function ResetPasswordPage() {
  const router = useRouter();
  const [step, setStep] = useState(1);
  
  const [email, setEmail] = useState("");
  const [otp, setOtp] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSendOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    const res = await sendResetOtp(email);
    setLoading(false);

    if (res.success) {
      toast.success(res.message);
      setStep(2); // Move to OTP screen
    } else {
      toast.error(res.message);
    }
  };

  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    const res = await resetPassword(email, otp, newPassword);
    setLoading(false);

    if (res.success) {
      toast.success(res.message);
      setTimeout(() => router.push("/login"), 2000); // Send back to login
    } else {
      toast.error(res.message);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-50 p-4 font-sans selection:bg-purple-200">
      <div className="w-full max-w-[400px] bg-white rounded-2xl shadow-xl border border-slate-100 p-8 relative overflow-hidden">
        
        {/* Decorative Top Banner */}
        <div className="absolute top-0 left-0 w-full h-1.5" style={{ background: 'linear-gradient(to right, #b3e5fc, #e1bee7, #9575cd)' }}></div>

        <div className="text-center mb-8 mt-2">
          <div className="mx-auto w-12 h-12 bg-purple-50 rounded-full flex items-center justify-center mb-4">
            <KeyRound size={24} className="text-[#a07be1]" />
          </div>
          <h2 className="text-2xl font-black text-slate-800 tracking-tight">Reset Password</h2>
          <p className="text-xs text-slate-500 mt-2 font-medium">
            {step === 1 ? "Enter your email to receive a secure code" : "Enter the secure code and your new password"}
          </p>
        </div>

        {step === 1 ? (
          <form onSubmit={handleSendOtp} className="space-y-4 animate-in fade-in slide-in-from-bottom-4 duration-500">
            <div>
              <label className="block text-[11px] font-black text-slate-500 uppercase tracking-wider mb-1.5">Email Address</label>
              <div className="relative">
                <Mail size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" />
                <input 
                  type="email" 
                  required 
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full h-11 pl-10 pr-4 rounded-xl border border-slate-200 bg-slate-50 text-sm font-medium text-slate-800 focus:bg-white focus:ring-2 focus:ring-[#a07be1] outline-none transition-all" 
                  placeholder="admin@labseven.in"
                />
              </div>
            </div>
            
            <button 
              type="submit" 
              disabled={loading}
              className="w-full h-11 mt-2 rounded-xl font-bold text-white shadow-md transition-all flex items-center justify-center gap-2 disabled:opacity-60 active:scale-[0.98]"
              style={{ background: 'linear-gradient(135deg, #a07be1, #8e62d9)' }}
            >
              {loading ? <Loader2 size={16} className="animate-spin" /> : null}
              Send Security Code
            </button>
          </form>
        ) : (
          <form onSubmit={handleResetPassword} className="space-y-4 animate-in fade-in slide-in-from-right-4 duration-500">
            <div>
              <label className="block text-[11px] font-black text-slate-500 uppercase tracking-wider mb-1.5">6-Digit Code</label>
              <div className="relative">
                <ShieldCheck size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" />
                <input 
                  type="text" 
                  required 
                  maxLength={6}
                  value={otp}
                  onChange={(e) => setOtp(e.target.value.replace(/\D/g, ''))}
                  className="w-full h-11 pl-10 pr-4 rounded-xl border border-slate-200 bg-slate-50 text-center text-lg font-bold tracking-[0.4em] text-slate-800 focus:bg-white focus:ring-2 focus:ring-[#a07be1] outline-none transition-all" 
                  placeholder="000000"
                />
              </div>
            </div>

            <div>
              <label className="block text-[11px] font-black text-slate-500 uppercase tracking-wider mb-1.5">New Password</label>
              <div className="relative">
                <KeyRound size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" />
                <input 
                  type="password" 
                  required 
                  minLength={6}
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  className="w-full h-11 pl-10 pr-4 rounded-xl border border-slate-200 bg-slate-50 text-sm font-medium text-slate-800 focus:bg-white focus:ring-2 focus:ring-[#a07be1] outline-none transition-all" 
                  placeholder="Create a strong password"
                />
              </div>
            </div>
            
            <button 
              type="submit" 
              disabled={loading || otp.length !== 6 || newPassword.length < 6}
              className="w-full h-11 mt-2 rounded-xl font-bold text-white shadow-md transition-all flex items-center justify-center gap-2 disabled:opacity-60 active:scale-[0.98]"
              style={{ background: 'linear-gradient(135deg, #a07be1, #8e62d9)' }}
            >
              {loading ? <Loader2 size={16} className="animate-spin" /> : null}
              Confirm Reset
            </button>
          </form>
        )}

        <div className="mt-8 text-center">
          <Link href="/login" className="text-xs font-bold text-slate-400 hover:text-slate-600 flex items-center justify-center gap-1.5 transition-colors">
            <ArrowLeft size={14} /> Back to Login
          </Link>
        </div>

      </div>
    </div>
  );
}
// --- BLOCK app/reset/page.tsx CLOSE ---
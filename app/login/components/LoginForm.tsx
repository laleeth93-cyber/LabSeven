// --- BLOCK app/login/components/LoginForm.tsx OPEN ---
"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { signIn } from "next-auth/react";
import { requestOtp, verifyOtpCode, resetPasswordWithVerifiedEmail } from "@/app/actions/otp"; 
import { Loader2, Mail, Lock, KeyRound, ArrowLeft, ShieldCheck, CheckCircle2 } from "lucide-react";
import toast from "react-hot-toast";

const inputBaseClass = "w-full h-9 pl-9 pr-3 rounded-lg bg-slate-50 border border-slate-300 focus:bg-white focus:border-[#a07be1] focus:ring-2 focus:ring-[#a07be1]/20 outline-none focus:outline-none transition-all text-[13px] font-medium text-slate-800 placeholder:text-slate-400 placeholder:font-normal";
const buttonBaseClass = "w-full h-9 mt-1 rounded-lg text-white font-bold text-[13px] shadow-sm transition-all active:scale-95 flex items-center justify-center gap-2 bg-[#a07be1] hover:bg-[#8e62d9] outline-none focus:outline-none disabled:opacity-70";

export default function LoginForm({ isActive }: { isActive: boolean }) {
  const router = useRouter();

  const [loginView, setLoginView] = useState<"login" | "forgot" | "verify" | "update">("login"); 
  const [loginRole, setLoginRole] = useState<"admin" | "user">("admin"); 

  const [loginEmail, setLoginEmail] = useState("");
  const [loginPassword, setLoginPassword] = useState("");
  const [loginOtp, setLoginOtp] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");

  const handleSignIn = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true); setError(""); setMessage("Verifying credentials...");

    try {
      const res = await signIn("credentials", {
        username: loginEmail, // We still pass this to NextAuth's default 'username' handler, but it holds the Email
        password: loginPassword,
        redirect: false,
      });

      if (res?.error) {
        setError(res.error || "Invalid login credentials.");
        setMessage(""); setIsLoading(false); return;
      }

      setMessage("Success! Loading dashboard...");
      router.push("/"); router.refresh();
    } catch (err) {
      setError("A network error occurred."); setMessage(""); setIsLoading(false);
    }
  };

  const handleForgotPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true); setError(""); setMessage("Sending code...");
    const res = await requestOtp(loginEmail, 'RESET');
    if (res.success) {
      setMessage("Check your email for the code.");
      setLoginView("verify");
    } else {
      setError(res.message || "Failed to request code.");
      setMessage("");
    }
    setIsLoading(false);
  };

  const handleVerifyResetOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true); setError(""); setMessage("Verifying code...");
    const res = await verifyOtpCode(loginEmail, loginOtp, 'RESET');
    if (res.success) {
      setMessage("Code verified!");
      setLoginView("update");
    } else {
      setError(res.message || "Invalid verification code.");
      setMessage("");
    }
    setIsLoading(false);
  };

  const handleUpdatePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (newPassword !== confirmPassword) { setError("Passwords do not match."); return; }
    setIsLoading(true); setError(""); setMessage("Updating password...");
    const res = await resetPasswordWithVerifiedEmail(loginEmail, newPassword);
    if (res.success) {
      toast.success("Password updated successfully!");
      setLoginView("login");
    } else {
      setError(res.message || "Failed to update password.");
      setMessage("");
    }
    setIsLoading(false);
  };

  return (
    <div className={`w-full md:w-1/2 h-full flex flex-col justify-center p-6 md:p-10 transition-all duration-500 ${isActive ? 'block' : 'hidden md:flex'}`}>
      
      {loginView === "login" && (
        <div className="animate-in fade-in zoom-in-95 duration-300 max-w-sm mx-auto w-full">
          <div className="text-center mb-5">
            <div className="w-12 h-12 bg-purple-50 rounded-full flex items-center justify-center mx-auto mb-3 md:hidden">
              <Lock className="text-[#a07be1] pointer-events-none" size={20} />
            </div>
            <h1 className="text-2xl font-black text-slate-800 tracking-tight">Welcome Back</h1>
            <p className="text-xs text-slate-500 mt-1 font-medium">Log in to access your laboratory</p>
          </div>

          <div className="flex bg-slate-100 p-1 rounded-lg mb-5 w-full">
            <button type="button" onClick={() => { setLoginRole("admin"); setError(""); }} className={`flex-1 h-8 text-xs font-bold rounded-md transition-all outline-none focus:outline-none ${loginRole === "admin" ? "bg-white text-[#a07be1] shadow-sm border border-slate-200" : "text-slate-500 hover:text-slate-700"}`}>Admin</button>
            <button type="button" onClick={() => { setLoginRole("user"); setError(""); }} className={`flex-1 h-8 text-xs font-bold rounded-md transition-all outline-none focus:outline-none ${loginRole === "user" ? "bg-white text-[#a07be1] shadow-sm border border-slate-200" : "text-slate-500 hover:text-slate-700"}`}>Staff User</button>
          </div>

          {error && <div className="p-2 mb-3 bg-red-50 text-red-600 text-[11px] font-bold rounded-lg border border-red-100 text-center leading-tight flex items-center justify-center gap-1.5"><div className="w-1.5 h-1.5 rounded-full bg-red-500 animate-pulse"></div>{error}</div>}
          {message && <div className="p-2 mb-3 bg-emerald-50 text-emerald-600 text-[11px] font-bold rounded-lg border border-emerald-100 text-center leading-tight">{message}</div>}

          <form onSubmit={handleSignIn} className="space-y-3.5">
            {/* 🚨 THE FIX: A single, clean email input that dynamically changes its placeholder based on the role */}
            <div className="relative animate-in slide-in-from-top-2">
              <Mail className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" size={16} />
              <input type="email" required value={loginEmail} onChange={(e) => setLoginEmail(e.target.value)} className={inputBaseClass} placeholder={loginRole === "admin" ? "admin@laboratory.com" : "staff@laboratory.com"} />
            </div>

            <div className="relative">
              <KeyRound className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" size={16} />
              <input type="password" required value={loginPassword} onChange={(e) => setLoginPassword(e.target.value)} className={inputBaseClass} placeholder="••••••••" />
            </div>
            
            <div className="flex justify-end h-4 items-center">
              {loginRole === "admin" ? (
                <button type="button" onClick={() => { setLoginView("forgot"); setError(""); setMessage(""); }} className="text-[11px] font-bold text-slate-500 hover:text-[#a07be1] transition-colors outline-none focus:outline-none">Forgot password?</button>
              ) : (
                <button type="button" onClick={() => toast.error("Please contact your Lab Administrator to reset your password.", { icon: '🔒', duration: 4000 })} className="text-[11px] font-bold text-slate-500 hover:text-[#a07be1] transition-colors outline-none focus:outline-none">Forgot password?</button>
              )}
            </div>

            <button disabled={isLoading} type="submit" className={`${buttonBaseClass} mt-2`}>
              {isLoading ? <Loader2 className="animate-spin" size={16} /> : "Sign In"}
            </button>
          </form>
        </div>
      )}

      {loginView === "forgot" && (
        <div className="animate-in fade-in slide-in-from-right-4 duration-300 max-w-sm mx-auto w-full">
          <div className="text-center mb-4">
            <h1 className="text-2xl font-black text-slate-800 tracking-tight">Reset Password</h1>
            <p className="text-[11px] text-slate-500 mt-1 font-medium">We'll send you a recovery code</p>
          </div>
          {error && <div className="p-1.5 mb-2.5 bg-red-50 text-red-600 text-[10px] font-bold rounded-lg border border-red-100 text-center">{error}</div>}
          {message && <div className="p-1.5 mb-2.5 bg-emerald-50 text-emerald-600 text-[10px] font-bold rounded-lg border border-emerald-100 text-center">{message}</div>}

          <form onSubmit={handleForgotPassword} className="space-y-3.5">
            <div className="relative">
              <Mail className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" size={15} />
              <input type="email" required value={loginEmail} onChange={(e) => setLoginEmail(e.target.value)} className={inputBaseClass} placeholder="admin@laboratory.com" />
            </div>
            <button disabled={isLoading} type="submit" className={buttonBaseClass}>
              {isLoading ? <Loader2 className="animate-spin" size={15} /> : "Send Code"}
            </button>
            <button type="button" onClick={() => { setLoginView("login"); setError(""); setMessage(""); }} className="w-full h-9 text-[11px] font-bold text-slate-500 hover:text-slate-800 flex items-center justify-center gap-1 transition-colors mt-2 outline-none focus:outline-none bg-slate-100 rounded-lg">
              <ArrowLeft size={13} /> Back to Login
            </button>
          </form>
        </div>
      )}

      {loginView === "verify" && (
        <div className="animate-in fade-in slide-in-from-right-4 duration-300 max-w-sm mx-auto w-full">
          <div className="text-center mb-4">
            <h1 className="text-2xl font-black text-slate-800 tracking-tight">Verify Code</h1>
            <p className="text-[11px] text-slate-500 mt-1">Sent to <span className="font-bold text-[#a07be1]">{loginEmail}</span></p>
          </div>
          {error && <div className="p-1.5 mb-2.5 bg-red-50 text-red-600 text-[10px] font-bold rounded-lg border border-red-100 text-center">{error}</div>}
          {message && <div className="p-1.5 mb-2.5 bg-emerald-50 text-emerald-600 text-[10px] font-bold rounded-lg border border-emerald-100 text-center">{message}</div>}

          <form onSubmit={handleVerifyResetOtp} className="space-y-3.5">
            <div className="relative">
              <ShieldCheck className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" size={15} />
              <input type="text" required value={loginOtp} onChange={(e) => setLoginOtp(e.target.value)} className={`${inputBaseClass} font-mono tracking-[0.2em]`} placeholder="000000" />
            </div>
            <button disabled={isLoading} type="submit" className={buttonBaseClass}>
              {isLoading ? <Loader2 className="animate-spin" size={15} /> : "Verify"}
            </button>
            <button type="button" onClick={() => { setLoginView("login"); setError(""); setMessage(""); }} className="w-full h-9 text-[11px] font-bold text-slate-500 hover:text-slate-800 flex items-center justify-center gap-1 transition-colors mt-2 outline-none focus:outline-none">
              <ArrowLeft size={13} /> Cancel
            </button>
          </form>
        </div>
      )}

      {loginView === "update" && (
        <div className="animate-in fade-in slide-in-from-right-4 duration-300 max-w-sm mx-auto w-full">
          <div className="text-center mb-4">
            <div className="w-10 h-10 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-2"><CheckCircle2 className="text-green-600 pointer-events-none" size={16} /></div>
            <h1 className="text-2xl font-black text-slate-800 tracking-tight">New Password</h1>
          </div>
          {error && <div className="p-1.5 mb-2.5 bg-red-50 text-red-600 text-[10px] font-bold rounded-lg border border-red-100 text-center">{error}</div>}
          {message && <div className="p-1.5 mb-2.5 bg-emerald-50 text-emerald-600 text-[10px] font-bold rounded-lg border border-emerald-100 text-center">{message}</div>}

          <form onSubmit={handleUpdatePassword} className="space-y-3.5">
            <div className="relative">
              <KeyRound className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" size={15} />
              <input type="password" required minLength={6} value={newPassword} onChange={(e) => setNewPassword(e.target.value)} className={inputBaseClass} placeholder="New Password" />
            </div>
            <div className="relative">
              <Lock className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" size={15} />
              <input type="password" required minLength={6} value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} className={inputBaseClass} placeholder="Confirm Password" />
            </div>
            <button disabled={isLoading} type="submit" className={buttonBaseClass}>
              {isLoading ? <Loader2 className="animate-spin" size={15} /> : "Update Password"}
            </button>
          </form>
        </div>
      )}

    </div>
  );
}
// --- BLOCK app/login/components/LoginForm.tsx CLOSE ---
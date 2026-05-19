"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { signIn } from "next-auth/react";
import { requestOtp, verifyOtpCode, resetPasswordWithVerifiedEmail } from "@/app/actions/otp"; 
import { Loader2, Mail, Lock, KeyRound, ArrowLeft, ShieldCheck, CheckCircle2 } from "lucide-react";
import toast from "react-hot-toast";

// 🚨 MICRO REDESIGN: h-8, rounded-md, text-[12px]
const inputBaseClass = "w-full h-8 pl-8 pr-3 rounded-md bg-slate-50 border border-slate-300 focus:bg-white focus:border-[#a07be1] focus:ring-2 focus:ring-[#a07be1]/20 outline-none focus:outline-none transition-all text-[12px] font-medium text-slate-800 placeholder:text-slate-400 placeholder:font-normal";
const buttonBaseClass = "w-full h-8 mt-1 rounded-md text-white font-bold text-[12px] shadow-sm transition-all active:scale-95 flex items-center justify-center gap-2 bg-[#a07be1] hover:bg-[#8e62d9] outline-none focus:outline-none disabled:opacity-70";

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
        username: loginEmail,
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
    <div className={`w-full md:w-1/2 h-full flex flex-col justify-center p-5 md:p-6 transition-all duration-500 ${isActive ? 'block' : 'hidden md:flex'}`}>
      
      {loginView === "login" && (
        <div className="animate-in fade-in zoom-in-95 duration-300 max-w-xs mx-auto w-full">
          <div className="text-center mb-4">
            <div className="w-10 h-10 bg-purple-50 rounded-full flex items-center justify-center mx-auto mb-2 md:hidden">
              <Lock className="text-[#a07be1] pointer-events-none" size={18} />
            </div>
            <h1 className="text-xl font-black text-slate-800 tracking-tight">Welcome Back</h1>
            <p className="text-[11px] text-slate-500 mt-0.5 font-medium">Log in to access your laboratory</p>
          </div>

          <div className="flex bg-slate-100 p-1 rounded-md mb-4 w-full">
            <button type="button" onClick={() => { setLoginRole("admin"); setError(""); }} className={`flex-1 h-7 text-[11px] font-bold rounded-sm transition-all outline-none focus:outline-none ${loginRole === "admin" ? "bg-white text-[#a07be1] shadow-sm border border-slate-200" : "text-slate-500 hover:text-slate-700"}`}>Admin</button>
            <button type="button" onClick={() => { setLoginRole("user"); setError(""); }} className={`flex-1 h-7 text-[11px] font-bold rounded-sm transition-all outline-none focus:outline-none ${loginRole === "user" ? "bg-white text-[#a07be1] shadow-sm border border-slate-200" : "text-slate-500 hover:text-slate-700"}`}>Staff User</button>
          </div>

          {error && <div className="p-1.5 mb-3 bg-red-50 text-red-600 text-[10px] font-bold rounded-md border border-red-100 text-center leading-tight flex items-center justify-center gap-1.5"><div className="w-1.5 h-1.5 rounded-full bg-red-500 animate-pulse"></div>{error}</div>}
          {message && <div className="p-1.5 mb-3 bg-emerald-50 text-emerald-600 text-[10px] font-bold rounded-md border border-emerald-100 text-center leading-tight">{message}</div>}

          <form onSubmit={handleSignIn} className="space-y-3">
            <div className="relative animate-in slide-in-from-top-2">
              <Mail className="absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" size={14} />
              <input type="email" required value={loginEmail} onChange={(e) => setLoginEmail(e.target.value)} className={inputBaseClass} placeholder={loginRole === "admin" ? "admin@laboratory.com" : "staff@laboratory.com"} />
            </div>

            <div className="relative">
              <KeyRound className="absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" size={14} />
              <input type="password" required value={loginPassword} onChange={(e) => setLoginPassword(e.target.value)} className={inputBaseClass} placeholder="••••••••" />
            </div>
            
            <div className="flex justify-end h-3 items-center">
              {loginRole === "admin" ? (
                <button type="button" onClick={() => { setLoginView("forgot"); setError(""); setMessage(""); }} className="text-[10px] font-bold text-slate-500 hover:text-[#a07be1] transition-colors outline-none focus:outline-none">Forgot password?</button>
              ) : (
                <button type="button" onClick={() => toast.error("Please contact your Lab Admin to reset password.", { icon: '🔒', duration: 4000 })} className="text-[10px] font-bold text-slate-500 hover:text-[#a07be1] transition-colors outline-none focus:outline-none">Forgot password?</button>
              )}
            </div>

            <button disabled={isLoading} type="submit" className={`${buttonBaseClass} mt-2`}>
              {isLoading ? <Loader2 className="animate-spin" size={14} /> : "Sign In"}
            </button>
          </form>
        </div>
      )}

      {loginView === "forgot" && (
        <div className="animate-in fade-in slide-in-from-right-4 duration-300 max-w-xs mx-auto w-full">
          <div className="text-center mb-4">
            <h1 className="text-xl font-black text-slate-800 tracking-tight">Reset Password</h1>
            <p className="text-[11px] text-slate-500 mt-0.5 font-medium">We'll send you a recovery code</p>
          </div>
          {error && <div className="p-1.5 mb-2.5 bg-red-50 text-red-600 text-[10px] font-bold rounded-md border border-red-100 text-center">{error}</div>}
          {message && <div className="p-1.5 mb-2.5 bg-emerald-50 text-emerald-600 text-[10px] font-bold rounded-md border border-emerald-100 text-center">{message}</div>}

          <form onSubmit={handleForgotPassword} className="space-y-3">
            <div className="relative">
              <Mail className="absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" size={14} />
              <input type="email" required value={loginEmail} onChange={(e) => setLoginEmail(e.target.value)} className={inputBaseClass} placeholder="admin@laboratory.com" />
            </div>
            <button disabled={isLoading} type="submit" className={buttonBaseClass}>
              {isLoading ? <Loader2 className="animate-spin" size={14} /> : "Send Code"}
            </button>
            <button type="button" onClick={() => { setLoginView("login"); setError(""); setMessage(""); }} className="w-full h-8 text-[11px] font-bold text-slate-500 hover:text-slate-800 flex items-center justify-center gap-1 transition-colors mt-2 outline-none focus:outline-none bg-slate-100 rounded-md">
              <ArrowLeft size={12} /> Back to Login
            </button>
          </form>
        </div>
      )}

      {loginView === "verify" && (
        <div className="animate-in fade-in slide-in-from-right-4 duration-300 max-w-xs mx-auto w-full">
          <div className="text-center mb-4">
            <h1 className="text-xl font-black text-slate-800 tracking-tight">Verify Code</h1>
            <p className="text-[11px] text-slate-500 mt-0.5">Sent to <span className="font-bold text-[#a07be1] truncate block max-w-xs mx-auto">{loginEmail}</span></p>
          </div>
          {error && <div className="p-1.5 mb-2.5 bg-red-50 text-red-600 text-[10px] font-bold rounded-md border border-red-100 text-center">{error}</div>}
          {message && <div className="p-1.5 mb-2.5 bg-emerald-50 text-emerald-600 text-[10px] font-bold rounded-md border border-emerald-100 text-center">{message}</div>}

          <form onSubmit={handleVerifyResetOtp} className="space-y-3">
            <div className="relative">
              <ShieldCheck className="absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" size={14} />
              <input type="text" required value={loginOtp} onChange={(e) => setLoginOtp(e.target.value)} className={`${inputBaseClass} font-mono tracking-[0.2em]`} placeholder="000000" />
            </div>
            <button disabled={isLoading} type="submit" className={buttonBaseClass}>
              {isLoading ? <Loader2 className="animate-spin" size={14} /> : "Verify"}
            </button>
            <button type="button" onClick={() => { setLoginView("login"); setError(""); setMessage(""); }} className="w-full h-8 text-[11px] font-bold text-slate-500 hover:text-slate-800 flex items-center justify-center gap-1 transition-colors mt-2 outline-none focus:outline-none">
              <ArrowLeft size={12} /> Cancel
            </button>
          </form>
        </div>
      )}

      {loginView === "update" && (
        <div className="animate-in fade-in slide-in-from-right-4 duration-300 max-w-xs mx-auto w-full">
          <div className="text-center mb-4">
            <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-2"><CheckCircle2 className="text-green-600 pointer-events-none" size={14} /></div>
            <h1 className="text-xl font-black text-slate-800 tracking-tight">New Password</h1>
          </div>
          {error && <div className="p-1.5 mb-2.5 bg-red-50 text-red-600 text-[10px] font-bold rounded-md border border-red-100 text-center">{error}</div>}
          {message && <div className="p-1.5 mb-2.5 bg-emerald-50 text-emerald-600 text-[10px] font-bold rounded-md border border-emerald-100 text-center">{message}</div>}

          <form onSubmit={handleUpdatePassword} className="space-y-3">
            <div className="relative">
              <KeyRound className="absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" size={14} />
              <input type="password" required minLength={6} value={newPassword} onChange={(e) => setNewPassword(e.target.value)} className={inputBaseClass} placeholder="New Password" />
            </div>
            <div className="relative">
              <Lock className="absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" size={14} />
              <input type="password" required minLength={6} value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} className={inputBaseClass} placeholder="Confirm Password" />
            </div>
            <button disabled={isLoading} type="submit" className={buttonBaseClass}>
              {isLoading ? <Loader2 className="animate-spin" size={14} /> : "Update Password"}
            </button>
          </form>
        </div>
      )}

    </div>
  );
}
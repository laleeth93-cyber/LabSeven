"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { signIn } from "next-auth/react";
import { requestOtp, verifyOtpCode, resetPasswordWithVerifiedEmail } from "@/app/actions/otp"; 
import { Loader2, Mail, Lock, KeyRound, ArrowLeft, ShieldCheck, CheckCircle2 } from "lucide-react";
import toast from "react-hot-toast";

const inputBaseClass = "w-full h-10 pl-9 pr-3 rounded-lg bg-slate-50 border border-slate-300 focus:bg-white focus:border-[#a07be1] focus:ring-2 focus:ring-[#a07be1]/20 outline-none focus:outline-none transition-all text-sm font-medium text-slate-800 placeholder:text-slate-400 placeholder:font-normal";
const buttonBaseClass = "w-full h-10 mt-2 rounded-lg text-white font-bold text-sm shadow-sm transition-all active:scale-95 flex items-center justify-center gap-2 bg-[#a07be1] hover:bg-[#8e62d9] outline-none focus:outline-none disabled:opacity-70";

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
    <div className={`w-full md:w-1/2 h-full flex flex-col justify-center p-5 md:p-8 transition-all duration-500 ${isActive ? 'block' : 'hidden md:flex'}`}>
      
      {loginView === "login" && (
        <div className="animate-in fade-in slide-in-from-bottom-4 duration-300 max-w-sm mx-auto w-full">
          <div className="text-center mb-6">
            <div className="w-12 h-12 bg-purple-50 rounded-full flex items-center justify-center mx-auto mb-3 md:hidden">
              <Lock className="text-[#a07be1] pointer-events-none" size={20} />
            </div>
            <h1 className="text-2xl font-bold text-slate-800 tracking-tight">Welcome Back</h1>
            <p className="text-sm text-slate-500 mt-1 font-medium">Log in to access your laboratory</p>
          </div>

          <div className="flex bg-slate-100 p-1.5 rounded-lg mb-5 w-full">
            <button type="button" onClick={() => { setLoginRole("admin"); setError(""); }} className={`flex-1 h-8 text-xs font-bold rounded-md transition-all outline-none focus:outline-none ${loginRole === "admin" ? "bg-white text-[#a07be1] shadow-sm border border-slate-200" : "text-slate-500 hover:text-slate-700"}`}>Admin</button>
            <button type="button" onClick={() => { setLoginRole("user"); setError(""); }} className={`flex-1 h-8 text-xs font-bold rounded-md transition-all outline-none focus:outline-none ${loginRole === "user" ? "bg-white text-[#a07be1] shadow-sm border border-slate-200" : "text-slate-500 hover:text-slate-700"}`}>Staff User</button>
          </div>

          {error && <div className="p-2 mb-4 bg-red-50 text-red-600 text-xs font-bold rounded-lg border border-red-100 text-center leading-tight flex items-center justify-center gap-2"><div className="w-2 h-2 rounded-full bg-red-500 animate-pulse"></div>{error}</div>}
          {message && <div className="p-2 mb-4 bg-emerald-50 text-emerald-600 text-xs font-bold rounded-lg border border-emerald-100 text-center leading-tight">{message}</div>}

          <form onSubmit={handleSignIn} className="space-y-4">
            <div className="relative">
              <Mail className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" size={16} />
              <input type="email" required value={loginEmail} onChange={(e) => setLoginEmail(e.target.value)} className={inputBaseClass} placeholder={loginRole === "admin" ? "admin@laboratory.com" : "staff@laboratory.com"} />
            </div>

            <div className="relative">
              <KeyRound className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" size={16} />
              <input type="password" required value={loginPassword} onChange={(e) => setLoginPassword(e.target.value)} className={inputBaseClass} placeholder="••••••••" />
            </div>
            
            <div className="flex justify-end pt-1">
              {loginRole === "admin" ? (
                <button type="button" onClick={() => { setLoginView("forgot"); setError(""); setMessage(""); }} className="text-xs font-bold text-slate-500 hover:text-[#a07be1] transition-colors outline-none focus:outline-none">Forgot password?</button>
              ) : (
                <button type="button" onClick={() => toast.error("Please contact your Lab Admin to reset password.", { icon: '🔒', duration: 4000 })} className="text-xs font-bold text-slate-500 hover:text-[#a07be1] transition-colors outline-none focus:outline-none">Forgot password?</button>
              )}
            </div>

            <button disabled={isLoading} type="submit" className={buttonBaseClass}>
              {isLoading ? <Loader2 className="animate-spin" size={16} /> : "Sign In"}
            </button>
          </form>
        </div>
      )}

      {/* Forgot Password View */}
      {loginView === "forgot" && (
        <div className="animate-in fade-in slide-in-from-right-4 duration-300 max-w-sm mx-auto w-full">
          <div className="text-center mb-6">
            <h1 className="text-2xl font-bold text-slate-800 tracking-tight">Reset Password</h1>
            <p className="text-sm text-slate-500 mt-1 font-medium">We'll send you a recovery code</p>
          </div>
          {error && <div className="p-2 mb-4 bg-red-50 text-red-600 text-xs font-bold rounded-lg border border-red-100 text-center">{error}</div>}
          {message && <div className="p-2 mb-4 bg-emerald-50 text-emerald-600 text-xs font-bold rounded-lg border border-emerald-100 text-center">{message}</div>}

          <form onSubmit={handleForgotPassword} className="space-y-4">
            <div className="relative">
              <Mail className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" size={16} />
              <input type="email" required value={loginEmail} onChange={(e) => setLoginEmail(e.target.value)} className={inputBaseClass} placeholder="admin@laboratory.com" />
            </div>
            <button disabled={isLoading} type="submit" className={buttonBaseClass}>
              {isLoading ? <Loader2 className="animate-spin" size={16} /> : "Send Code"}
            </button>
            <button type="button" onClick={() => { setLoginView("login"); setError(""); setMessage(""); }} className="w-full h-10 text-xs font-bold text-slate-500 hover:text-slate-800 flex items-center justify-center gap-1.5 transition-colors mt-3 outline-none focus:outline-none bg-slate-100 rounded-lg">
              <ArrowLeft size={14} /> Back to Login
            </button>
          </form>
        </div>
      )}

      {/* Verify View */}
      {loginView === "verify" && (
        <div className="animate-in fade-in slide-in-from-right-4 duration-300 max-w-sm mx-auto w-full">
          <div className="text-center mb-6">
            <h1 className="text-2xl font-bold text-slate-800 tracking-tight">Verify Code</h1>
            <p className="text-sm text-slate-500 mt-1">Sent to <span className="font-bold text-[#a07be1] truncate block max-w-xs mx-auto">{loginEmail}</span></p>
          </div>
          {error && <div className="p-2 mb-4 bg-red-50 text-red-600 text-xs font-bold rounded-lg border border-red-100 text-center">{error}</div>}
          {message && <div className="p-2 mb-4 bg-emerald-50 text-emerald-600 text-xs font-bold rounded-lg border border-emerald-100 text-center">{message}</div>}

          <form onSubmit={handleVerifyResetOtp} className="space-y-4">
            <div className="relative">
              <ShieldCheck className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" size={16} />
              <input type="text" required value={loginOtp} onChange={(e) => setLoginOtp(e.target.value)} className={`${inputBaseClass} font-mono tracking-[0.2em] text-center text-base`} placeholder="000000" />
            </div>
            <button disabled={isLoading} type="submit" className={buttonBaseClass}>
              {isLoading ? <Loader2 className="animate-spin" size={16} /> : "Verify"}
            </button>
            <button type="button" onClick={() => { setLoginView("login"); setError(""); setMessage(""); }} className="w-full h-10 text-xs font-bold text-slate-500 hover:text-slate-800 flex items-center justify-center gap-1.5 transition-colors mt-3 outline-none focus:outline-none">
              <ArrowLeft size={14} /> Cancel
            </button>
          </form>
        </div>
      )}

      {/* Update Password View */}
      {loginView === "update" && (
        <div className="animate-in fade-in slide-in-from-right-4 duration-300 max-w-sm mx-auto w-full">
          <div className="text-center mb-6">
            <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-3"><CheckCircle2 className="text-green-600 pointer-events-none" size={20} /></div>
            <h1 className="text-2xl font-bold text-slate-800 tracking-tight">New Password</h1>
          </div>
          {error && <div className="p-2 mb-4 bg-red-50 text-red-600 text-xs font-bold rounded-lg border border-red-100 text-center">{error}</div>}
          {message && <div className="p-2 mb-4 bg-emerald-50 text-emerald-600 text-xs font-bold rounded-lg border border-emerald-100 text-center">{message}</div>}

          <form onSubmit={handleUpdatePassword} className="space-y-4">
            <div className="relative">
              <KeyRound className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" size={16} />
              <input type="password" required minLength={6} value={newPassword} onChange={(e) => setNewPassword(e.target.value)} className={inputBaseClass} placeholder="New Password" />
            </div>
            <div className="relative">
              <Lock className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" size={16} />
              <input type="password" required minLength={6} value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} className={inputBaseClass} placeholder="Confirm Password" />
            </div>
            <button disabled={isLoading} type="submit" className={buttonBaseClass}>
              {isLoading ? <Loader2 className="animate-spin" size={16} /> : "Update Password"}
            </button>
          </form>
        </div>
      )}

    </div>
  );
}
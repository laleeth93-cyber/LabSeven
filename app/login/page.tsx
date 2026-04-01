// --- BLOCK app/login/page.tsx OPEN ---
"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { signIn } from "next-auth/react";
import { registerNewSaaSLab } from "@/app/actions/saas-onboarding";
import { Loader2, Mail, Lock, KeyRound, Building2, ArrowLeft, ShieldCheck, User, CheckCircle2, Phone, MapPin, Hash } from "lucide-react";
import toast from "react-hot-toast";

export default function LoginPage() {
  const router = useRouter();

  // --- NAVIGATION STATE ---
  const [isLogin, setIsLogin] = useState(true); 
  const [loginView, setLoginView] = useState<"login" | "forgot" | "verify" | "update">("login"); 
  const [registerView, setRegisterView] = useState<"details" | "verify" | "password">("details");
  const [loginRole, setLoginRole] = useState<"admin" | "user">("admin"); 

  // --- LOGIN FORM STATE ---
  const [loginEmail, setLoginEmail] = useState("");
  const [loginUsername, setLoginUsername] = useState(""); 
  const [loginLabId, setLoginLabId] = useState(""); // 🚨 RESTORED: Lab ID State
  const [loginPassword, setLoginPassword] = useState("");
  const [loginOtp, setLoginOtp] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  // --- REGISTRATION FORM STATE (Simplified) ---
  const [regLabName, setRegLabName] = useState("");
  const [regPhone, setRegPhone] = useState("");
  const [regEmail, setRegEmail] = useState("");
  const [regOtp, setRegOtp] = useState("");
  const [regPassword, setRegPassword] = useState("");
  const [regConfirmPassword, setRegConfirmPassword] = useState("");

  // UI State
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");

  const inputBaseClass = "w-full h-9 pl-9 pr-3 rounded-lg bg-slate-50 border border-slate-300 focus:bg-white focus:border-[#a07be1] focus:ring-2 focus:ring-[#a07be1]/20 outline-none focus:outline-none transition-all text-[13px] font-medium text-slate-800 placeholder:text-slate-400 placeholder:font-normal";
  const buttonBaseClass = "w-full h-9 mt-1 rounded-lg text-white font-bold text-[13px] shadow-sm transition-all active:scale-95 flex items-center justify-center gap-2 bg-[#a07be1] hover:bg-[#8e62d9] outline-none focus:outline-none disabled:opacity-70";

  // ==========================================
  //               LOGIN FLOW
  // ==========================================
  
  const handleSignIn = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true); setError(""); setMessage("Verifying credentials...");

    try {
      const identifier = loginRole === "admin" ? loginEmail : loginUsername;
      
      const res = await signIn("credentials", {
        username: identifier,
        password: loginPassword,
        labId: loginRole === "user" ? loginLabId : undefined, // 🚨 Pass Lab ID if Staff User
        redirect: false,
      });

      if (res?.error) {
        setError(res.error);
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
    setTimeout(() => {
      setMessage("Check your email for the code.");
      setLoginView("verify");
      setIsLoading(false);
    }, 1500);
  };

  const handleVerifyResetOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true); setError(""); setMessage("Verifying code...");
    setTimeout(() => {
      setMessage("Code verified!");
      setLoginView("update");
      setIsLoading(false);
    }, 1500);
  };

  const handleUpdatePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (newPassword !== confirmPassword) { setError("Passwords do not match."); return; }
    setIsLoading(true); setError(""); setMessage("Updating password...");
    setTimeout(() => {
      toast.success("Password updated successfully!");
      setLoginView("login");
      setIsLoading(false);
    }, 1500);
  };

  // ==========================================
  //           REGISTRATION FLOW
  // ==========================================

  const handleRegisterDetails = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true); setError(""); setMessage("Sending verification code...");
    setTimeout(() => {
      setMessage("");
      setRegisterView("verify");
      setIsLoading(false);
    }, 1500);
  };

  const handleVerifyRegisterOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true); setError(""); setMessage("Verifying email...");
    setTimeout(() => {
      setMessage("Email verified!");
      setRegisterView("password");
      setIsLoading(false);
    }, 1500);
  };

  const handleSetRegisterPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(""); 

    if (regPassword !== regConfirmPassword) {
      setError("Passwords do not match!"); return;
    }

    setIsLoading(true); setMessage("Generating Laboratory Environment...");

    try {
      const fallbackAdminName = regEmail.split('@')[0]; 

      const res = await registerNewSaaSLab({
        labName: regLabName,
        email: regEmail,
        phone: regPhone,
        address: "Online Registration", 
        adminName: fallbackAdminName,   
        adminUsername: regEmail,        
        adminPassword: regPassword
      });

      if (res.success) {
        // Show them their new Lab ID so they know it!
        toast.success(`Laboratory created! Your Lab ID is: ${res.organizationId}`, { duration: 6000 });
        setMessage("Redirecting to login...");
        setTimeout(() => {
          setIsLoading(false); setMessage("");
          setLoginEmail(regEmail); setLoginRole("admin");
          setRegisterView("details"); 
          toggleToLogin();
        }, 3500);
      } else {
        setError(res.message || "Registration failed."); setMessage(""); setIsLoading(false);
      }
    } catch (err) {
      setError("A network error occurred."); setMessage(""); setIsLoading(false);
    }
  };

  const toggleToRegister = () => { setIsLogin(false); setRegisterView("details"); setError(""); setMessage(""); };
  const toggleToLogin = () => { setIsLogin(true); setLoginView("login"); setError(""); setMessage(""); };

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-50 p-4 font-sans">
      
      <div className="relative w-full max-w-4xl h-[600px] md:h-[500px] bg-white rounded-2xl shadow-2xl shadow-slate-300 overflow-hidden flex flex-col md:flex-row">

        {/* MOBILE TOGGLE */}
        <div className="md:hidden flex justify-center pt-4 px-5 bg-white z-10 shrink-0">
          <div className="flex bg-slate-100 p-1 rounded-lg w-full max-w-sm">
            <button onClick={toggleToLogin} className={`flex-1 h-8 text-[11px] font-bold rounded-md transition-all outline-none focus:outline-none ${isLogin ? "bg-[#a07be1] text-white shadow-sm" : "text-slate-500"}`}>Sign In</button>
            <button onClick={toggleToRegister} className={`flex-1 h-8 text-[11px] font-bold rounded-md transition-all outline-none focus:outline-none ${!isLogin ? "bg-[#a07be1] text-white shadow-sm" : "text-slate-500"}`}>Register</button>
          </div>
        </div>

        {/* LEFT PANE: SIGN IN FLOW */}
        <div className={`w-full md:w-1/2 h-full flex flex-col justify-center p-6 md:p-10 transition-all duration-500 ${isLogin ? 'block' : 'hidden md:flex'}`}>
          
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
                {loginRole === "user" ? (
                  <div className="space-y-3.5 animate-in slide-in-from-top-2">
                    {/* 🚨 RESTORED: WORKSPACE ID FIELD */}
                    <div className="relative">
                      <Hash className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" size={16} />
                      <input type="text" required value={loginLabId} onChange={(e) => setLoginLabId(e.target.value)} className={inputBaseClass} placeholder="Workspace ID (Lab ID)" />
                    </div>
                    <div className="relative">
                      <User className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" size={16} />
                      <input type="text" required value={loginUsername} onChange={(e) => setLoginUsername(e.target.value)} className={inputBaseClass} placeholder="Staff Username" />
                    </div>
                  </div>
                ) : (
                  <div className="relative animate-in slide-in-from-top-2">
                    <Mail className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" size={16} />
                    <input type="email" required value={loginEmail} onChange={(e) => setLoginEmail(e.target.value)} className={inputBaseClass} placeholder="admin@laboratory.com" />
                  </div>
                )}

                <div className="relative">
                  <KeyRound className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" size={16} />
                  <input type="password" required value={loginPassword} onChange={(e) => setLoginPassword(e.target.value)} className={inputBaseClass} placeholder="••••••••" />
                </div>
                
                <div className="flex justify-end h-4">
                  {loginRole === "admin" && (
                    <button type="button" onClick={() => { setLoginView("forgot"); setError(""); setMessage(""); }} className="text-[11px] font-bold text-slate-500 hover:text-[#a07be1] transition-colors outline-none focus:outline-none">Forgot password?</button>
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

        {/* RIGHT PANE: SIGN UP FLOW */}
        <div className={`w-full md:w-1/2 h-full flex flex-col p-6 md:p-8 transition-all duration-500 overflow-y-auto custom-scrollbar ${!isLogin ? 'block' : 'hidden md:flex'}`}>
          
          {registerView === "details" && (
            <div className="animate-in fade-in zoom-in-95 duration-300 w-full max-w-sm mx-auto my-auto pb-8 md:pb-0">
              <div className="text-center mb-6">
                <div className="w-12 h-12 bg-purple-50 rounded-full flex items-center justify-center mx-auto mb-3 md:hidden">
                  <Building2 className="text-[#a07be1] pointer-events-none" size={20} />
                </div>
                <h1 className="text-2xl font-black text-slate-800 tracking-tight">Create Account</h1>
                <p className="text-xs text-slate-500 mt-1 font-medium">Register your laboratory environment</p>
              </div>

              {error && <div className="p-2 mb-4 bg-red-50 text-red-600 text-[11px] font-bold rounded-lg border border-red-100 text-center leading-tight flex items-center justify-center gap-1.5"><div className="w-1.5 h-1.5 rounded-full bg-red-500 animate-pulse"></div>{error}</div>}
              {message && <div className="p-2 mb-4 bg-emerald-50 text-emerald-600 text-[11px] font-bold rounded-lg border border-emerald-100 text-center leading-tight">{message}</div>}

              <form onSubmit={handleRegisterDetails} className="space-y-4">
                
                <div className="relative">
                  <Building2 className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" size={15} />
                  <input type="text" required value={regLabName} onChange={(e) => setRegLabName(e.target.value)} className={inputBaseClass} placeholder="Laboratory Name *" />
                </div>

                <div className="relative">
                  <Phone className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" size={15} />
                  <input type="tel" required value={regPhone} onChange={(e) => setRegPhone(e.target.value)} className={inputBaseClass} placeholder="Contact Phone *" />
                </div>

                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" size={15} />
                  <input type="email" required value={regEmail} onChange={(e) => setRegEmail(e.target.value)} className={inputBaseClass} placeholder="Official Email ID *" />
                </div>
                
                <button disabled={isLoading} type="submit" className={`${buttonBaseClass} mt-4`}>
                  {isLoading ? <Loader2 className="animate-spin" size={16} /> : "Continue"}
                </button>
              </form>
            </div>
          )}

          {registerView === "verify" && (
            <div className="animate-in fade-in slide-in-from-right-4 duration-300 w-full max-w-sm mx-auto my-auto">
              <div className="text-center mb-5">
                <h1 className="text-2xl font-black text-slate-800 tracking-tight">Verify Email</h1>
                <p className="text-[11px] text-slate-500 mt-1">Sent to <span className="font-bold text-[#a07be1]">{regEmail}</span></p>
              </div>

              {error && <div className="p-1.5 mb-2.5 bg-red-50 text-red-600 text-[10px] font-bold rounded-lg border border-red-100 text-center">{error}</div>}
              {message && <div className="p-1.5 mb-2.5 bg-emerald-50 text-emerald-600 text-[10px] font-bold rounded-lg border border-emerald-100 text-center">{message}</div>}

              <form onSubmit={handleVerifyRegisterOtp} className="space-y-4">
                <div className="relative">
                  <ShieldCheck className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" size={15} />
                  <input type="text" required value={regOtp} onChange={(e) => setRegOtp(e.target.value)} className={`${inputBaseClass} font-mono tracking-[0.2em] text-center text-[15px]`} placeholder="000000" />
                </div>
                
                <button disabled={isLoading} type="submit" className={buttonBaseClass}>
                  {isLoading ? <Loader2 className="animate-spin" size={15} /> : "Verify Account"}
                </button>

                <button type="button" onClick={() => { setRegisterView("details"); setError(""); setMessage(""); }} className="w-full h-9 text-[11px] font-bold text-slate-500 hover:text-slate-800 flex items-center justify-center gap-1 transition-colors mt-2 outline-none focus:outline-none bg-slate-100 rounded-lg">
                  <ArrowLeft size={13} /> Back
                </button>
              </form>
            </div>
          )}

          {registerView === "password" && (
            <div className="animate-in fade-in slide-in-from-right-4 duration-300 w-full max-w-sm mx-auto my-auto">
              <div className="text-center mb-5">
                <div className="w-10 h-10 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-2">
                  <CheckCircle2 className="text-green-600 pointer-events-none" size={16} />
                </div>
                <h1 className="text-2xl font-black text-slate-800 tracking-tight">Secure Account</h1>
                <p className="text-[11px] text-slate-500 mt-1 font-medium">Create your permanent password.</p>
              </div>

              {error && <div className="p-1.5 mb-2.5 bg-red-50 text-red-600 text-[10px] font-bold rounded-lg border border-red-100 text-center">{error}</div>}
              {message && <div className="p-1.5 mb-2.5 bg-emerald-50 text-emerald-600 text-[10px] font-bold rounded-lg border border-emerald-100 text-center">{message}</div>}

              <form onSubmit={handleSetRegisterPassword} className="space-y-4">
                <div className="relative">
                  <KeyRound className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" size={15} />
                  <input type="password" required minLength={6} value={regPassword} onChange={(e) => setRegPassword(e.target.value)} className={inputBaseClass} placeholder="New Password" />
                </div>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" size={15} />
                  <input type="password" required minLength={6} value={regConfirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} className={inputBaseClass} placeholder="Confirm Password" />
                </div>
                
                <button disabled={isLoading} type="submit" className={`${buttonBaseClass} mt-2`}>
                  {isLoading ? <Loader2 className="animate-spin" size={15} /> : "Complete Registration"}
                </button>
              </form>
            </div>
          )}

        </div>

        {/* OVERLAY (Desktop Only) */}
        <div className={`hidden md:block absolute top-0 w-1/2 h-full z-50 transition-transform duration-700 ease-in-out shadow-2xl ${isLogin ? 'translate-x-full' : 'translate-x-0'}`}>
          <div className="absolute inset-0 bg-[#a07be1]"></div>
          <div className="relative w-full h-full flex items-center justify-center overflow-hidden">
            
            <div className={`absolute inset-0 flex flex-col items-center justify-center p-8 text-center transition-all duration-700 ${isLogin ? 'opacity-100 translate-x-0' : 'opacity-0 translate-x-20 pointer-events-none'}`}>
              <Building2 className="text-white/80 mb-4 pointer-events-none" size={36} />
              <h2 className="text-2xl font-black text-white mb-2 tracking-tight">New Here?</h2>
              <p className="text-purple-50 text-[13px] mb-8 font-medium leading-relaxed max-w-[250px]">Register your laboratory today and step into the future of automated diagnostics.</p>
              <button onClick={toggleToRegister} className="px-10 h-10 rounded-lg border-2 border-white text-white text-[13px] font-bold hover:bg-white hover:text-[#a07be1] transition-colors active:scale-95 outline-none focus:outline-none">
                Create Account
              </button>
            </div>

            <div className={`absolute inset-0 flex flex-col items-center justify-center p-8 text-center transition-all duration-700 ${!isLogin ? 'opacity-100 translate-x-0' : 'opacity-0 -translate-x-20 pointer-events-none'}`}>
              <Lock className="text-white/80 mb-4 pointer-events-none" size={36} />
              <h2 className="text-2xl font-black text-white mb-2 tracking-tight">Welcome Back!</h2>
              <p className="text-purple-50 text-[13px] mb-8 font-medium leading-relaxed max-w-[250px]">To keep connected with your dashboard, please log in with your personal info.</p>
              <button onClick={toggleToLogin} className="px-10 h-10 rounded-lg border-2 border-white text-white text-[13px] font-bold hover:bg-white hover:text-[#a07be1] transition-colors active:scale-95 outline-none focus:outline-none">
                Sign In
              </button>
            </div>

          </div>
        </div>

      </div>
    </div>
  );
}
// --- BLOCK app/login/page.tsx CLOSE ---
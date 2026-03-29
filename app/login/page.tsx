// FILE: app/login/page.tsx
"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/utils/supabase/client";
import { Loader2, Mail, Lock, KeyRound } from "lucide-react";

export default function LoginPage() {
  const router = useRouter();
  const supabase = createClient();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [otp, setOtp] = useState("");
  
  const [loginMethod, setLoginMethod] = useState<"password" | "otp">("password");
  const [otpSent, setOtpSent] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");

  const handlePasswordLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError("");

    const { error } = await supabase.auth.signInWithPassword({ email, password });

    if (error) {
      setError(error.message);
      setIsLoading(false);
    } else {
      router.push("/");
      router.refresh();
    }
  };

  const handleSendOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError("");
    setMessage("");

    // Temporarily set to true to create your staff account!
    const { error } = await supabase.auth.signInWithOtp({
      email,
      options: { shouldCreateUser: true } 
    });

    if (error) {
      setError(error.message);
    } else {
      setOtpSent(true);
      setMessage("Check your email for the secure login link/code!");
    }
    setIsLoading(false);
  };

  const handleVerifyOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError("");
    setMessage("Verifying code...");

    try {
      // 1. Try standard email login verification
      const { data, error } = await supabase.auth.verifyOtp({
        email,
        token: otp,
        type: 'email',
      });

      if (error) {
        // 2. Secret Backup: If this is a brand new account, the token might be a 'signup' type!
        if (error.message.toLowerCase().includes("invalid") || error.message.toLowerCase().includes("expired")) {
          const retry = await supabase.auth.verifyOtp({ email, token: otp, type: 'signup' });
          
          if (retry.error) {
            setError("Invalid code. Please request a new one.");
            setMessage("");
            setIsLoading(false);
            return;
          }
        } else {
          setError(error.message);
          setMessage("");
          setIsLoading(false);
          return;
        }
      }

      // 3. Success! Route to the dashboard
      setMessage("Success! Loading dashboard...");
      router.push("/");
      router.refresh();

      // 4. Force the spinner to stop after 3 seconds so the page never freezes
      setTimeout(() => {
        setIsLoading(false);
      }, 3000);

    } catch (err) {
      setError("A network error occurred.");
      setMessage("");
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-50 p-4">
      <div className="w-full max-w-md bg-white rounded-2xl shadow-xl border border-slate-100 p-8">
        
        <div className="text-center mb-8">
          <div className="w-16 h-16 bg-purple-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <Lock className="text-[#9575cd]" size={32} />
          </div>
          <h1 className="text-2xl font-black text-slate-800 tracking-tight">LabSeven</h1>
          <p className="text-sm text-slate-500 font-medium mt-1">Secure Staff Portal</p>
        </div>

        {error && <div className="p-3 mb-4 bg-red-50 text-red-600 text-sm font-bold rounded-lg border border-red-100">{error}</div>}
        {message && <div className="p-3 mb-4 bg-emerald-50 text-emerald-600 text-sm font-bold rounded-lg border border-emerald-100">{message}</div>}

        {!otpSent && (
          <div className="flex bg-slate-100 p-1 rounded-lg mb-6">
            <button type="button" onClick={() => { setLoginMethod("password"); setError(""); }} className={`flex-1 py-2 text-sm font-bold rounded-md transition-all ${loginMethod === "password" ? "bg-white text-slate-800 shadow-sm" : "text-slate-500 hover:text-slate-700"}`}>Password</button>
            <button type="button" onClick={() => { setLoginMethod("otp"); setError(""); }} className={`flex-1 py-2 text-sm font-bold rounded-md transition-all ${loginMethod === "otp" ? "bg-white text-slate-800 shadow-sm" : "text-slate-500 hover:text-slate-700"}`}>Email OTP</button>
          </div>
        )}

        {loginMethod === "password" ? (
          <form onSubmit={handlePasswordLogin} className="space-y-4">
            <div className="space-y-1">
              <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Email Address</label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                <input type="email" required value={email} onChange={(e) => setEmail(e.target.value)} className="w-full pl-10 pr-4 py-3 rounded-lg border border-slate-200 focus:border-[#9575cd] focus:ring-1 focus:ring-[#9575cd] outline-none transition-all text-sm" placeholder="staff@labseven.com" />
              </div>
            </div>
            <div className="space-y-1">
              <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Password</label>
              <div className="relative">
                <KeyRound className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                <input type="password" required value={password} onChange={(e) => setPassword(e.target.value)} className="w-full pl-10 pr-4 py-3 rounded-lg border border-slate-200 focus:border-[#9575cd] focus:ring-1 focus:ring-[#9575cd] outline-none transition-all text-sm" placeholder="••••••••" />
              </div>
            </div>
            <button disabled={isLoading} type="submit" className="w-full py-3 mt-2 rounded-lg text-white font-bold text-sm shadow-md transition-all active:scale-95 flex items-center justify-center gap-2" style={{ background: 'linear-gradient(to right, #9575cd, #7e57c2)' }}>
              {isLoading ? <Loader2 className="animate-spin" size={18} /> : "Secure Login"}
            </button>
          </form>
        ) : (
          <form onSubmit={otpSent ? handleVerifyOtp : handleSendOtp} className="space-y-4">
            {!otpSent ? (
              <>
                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Staff Email Address</label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                    <input type="email" required value={email} onChange={(e) => setEmail(e.target.value)} className="w-full pl-10 pr-4 py-3 rounded-lg border border-slate-200 focus:border-[#9575cd] focus:ring-1 focus:ring-[#9575cd] outline-none transition-all text-sm" placeholder="staff@labseven.com" />
                  </div>
                </div>
                <button disabled={isLoading} type="submit" className="w-full py-3 mt-2 rounded-lg text-white font-bold text-sm shadow-md transition-all active:scale-95 flex items-center justify-center gap-2" style={{ background: 'linear-gradient(to right, #4dd0e1, #26c6da)' }}>
                  {isLoading ? <Loader2 className="animate-spin" size={18} /> : "Send Login Link"}
                </button>
              </>
            ) : (
              <>
                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Enter 8-Digit Code (from email)</label>
                  <input type="text" required maxLength={8} value={otp} onChange={(e) => setOtp(e.target.value)} className="w-full px-4 py-3 rounded-lg border border-slate-200 focus:border-[#4dd0e1] focus:ring-1 focus:ring-[#4dd0e1] outline-none transition-all text-center text-2xl font-mono tracking-[0.25em]" placeholder="00000000" />
                </div>
                <button disabled={isLoading} type="submit" className="w-full py-3 mt-2 rounded-lg text-white font-bold text-sm shadow-md transition-all active:scale-95 flex items-center justify-center gap-2" style={{ background: 'linear-gradient(to right, #4dd0e1, #26c6da)' }}>
                  {isLoading ? <Loader2 className="animate-spin" size={18} /> : "Verify & Login"}
                </button>
                <button type="button" onClick={() => setOtpSent(false)} className="w-full py-2 text-sm text-slate-500 hover:text-slate-700 font-medium">Use a different email</button>
              </>
            )}
          </form>
        )}
      </div>
    </div>
  );
}
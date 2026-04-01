// --- BLOCK app/register/page.tsx OPEN ---
"use client";

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Building2, User, Mail, Phone, MapPin, Lock, ArrowRight, Loader2, CheckCircle2 } from 'lucide-react';
import { registerNewSaaSLab } from '@/app/actions/saas-onboarding';
import Link from 'next/link';

export default function SaaSRegistrationPage() {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [error, setError] = useState('');
  
  const [formData, setFormData] = useState({
    labName: '',
    email: '',
    phone: '',
    address: '',
    adminName: '',
    adminUsername: '',
    adminPassword: '',
    confirmPassword: ''
  });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData(prev => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (formData.adminPassword !== formData.confirmPassword) {
      setError("Passwords do not match!");
      return;
    }

    setIsLoading(true);

    try {
      const res = await registerNewSaaSLab(formData);
      
      if (res.success) {
        setIsSuccess(true);
        // Wait a few seconds so they can read the success message, then send to login
        setTimeout(() => {
          router.push('/login');
        }, 3000);
      } else {
        setError(res.message || "Something went wrong during registration.");
      }
    } catch (err: any) {
      setError("A network error occurred. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  if (isSuccess) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50 p-4">
        <div className="bg-white p-10 rounded-2xl shadow-xl max-w-md w-full text-center border border-emerald-100 animate-in zoom-in-95 duration-500">
          <div className="w-20 h-20 bg-emerald-100 rounded-full flex items-center justify-center mx-auto mb-6">
            <CheckCircle2 size={40} className="text-emerald-500" />
          </div>
          <h2 className="text-2xl font-black text-slate-800 mb-2">Welcome to the Platform!</h2>
          <p className="text-slate-500 mb-8">Your laboratory environment has been successfully generated. We are redirecting you to the login page...</p>
          <div className="flex justify-center">
            <Loader2 className="animate-spin text-emerald-500" size={24} />
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-50 p-4 font-sans select-none relative overflow-hidden">
      
      {/* Decorative Background Elements */}
      <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-purple-200/50 rounded-full blur-3xl pointer-events-none"></div>
      <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-blue-200/50 rounded-full blur-3xl pointer-events-none"></div>

      <div className="bg-white rounded-3xl shadow-2xl max-w-4xl w-full overflow-hidden flex flex-col md:flex-row border border-slate-100 relative z-10">
        
        {/* Left Side: Branding & Pitch */}
        <div className="w-full md:w-5/12 p-10 flex flex-col justify-between relative overflow-hidden" style={{ background: 'linear-gradient(135deg, #5e35b1 0%, #3949ab 100%)' }}>
           <div className="relative z-10">
             <div className="bg-white/20 w-12 h-12 rounded-xl flex items-center justify-center backdrop-blur-sm mb-6 shadow-lg">
                <Building2 className="text-white" size={24} />
             </div>
             <h1 className="text-3xl font-black text-white leading-tight mb-4">
               Launch your digital lab in seconds.
             </h1>
             <p className="text-purple-100 font-medium leading-relaxed mb-8">
               Join our cloud-based LIS platform. Get instant access to pre-configured test masters, intelligent reporting, and seamless billing.
             </p>
           </div>
           
           <div className="relative z-10 space-y-4">
              <div className="flex items-center gap-3 text-purple-100 text-sm font-medium">
                <CheckCircle2 size={16} className="text-emerald-400" /> Auto-populated Test Library
              </div>
              <div className="flex items-center gap-3 text-purple-100 text-sm font-medium">
                <CheckCircle2 size={16} className="text-emerald-400" /> Secure Multi-Tenant Architecture
              </div>
              <div className="flex items-center gap-3 text-purple-100 text-sm font-medium">
                <CheckCircle2 size={16} className="text-emerald-400" /> Smart Smart Reports & Analytics
              </div>
           </div>

           {/* Abstract shapes for design */}
           <div className="absolute -bottom-24 -right-24 w-64 h-64 bg-white/10 rounded-full blur-2xl"></div>
           <div className="absolute top-10 -left-10 w-32 h-32 bg-white/10 rounded-full blur-xl"></div>
        </div>

        {/* Right Side: Registration Form */}
        <div className="w-full md:w-7/12 p-10 bg-white">
          <div className="mb-8">
            <h2 className="text-2xl font-black text-slate-800">Create an Account</h2>
            <p className="text-sm text-slate-500 font-medium mt-1">Set up your lab profile and admin credentials.</p>
          </div>

          {error && (
            <div className="mb-6 p-4 bg-rose-50 border border-rose-100 text-rose-600 rounded-xl text-sm font-bold flex items-center gap-2">
              <div className="w-1.5 h-1.5 rounded-full bg-rose-500 animate-pulse"></div>
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-6">
            
            {/* LAB DETAILS SECTION */}
            <div className="space-y-4">
              <h3 className="text-xs font-black text-slate-400 uppercase tracking-widest border-b pb-2 mb-4">1. Laboratory Details</h3>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-[11px] font-bold text-slate-500 uppercase">Lab Name *</label>
                  <div className="relative">
                    <Building2 className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
                    <input required type="text" name="labName" value={formData.labName} onChange={handleChange} className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-purple-500/20 focus:border-purple-500 transition-all font-medium text-slate-700" placeholder="City Path Labs" />
                  </div>
                </div>

                <div className="space-y-1.5">
                  <label className="text-[11px] font-bold text-slate-500 uppercase">Contact Phone *</label>
                  <div className="relative">
                    <Phone className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
                    <input required type="text" name="phone" value={formData.phone} onChange={handleChange} className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-purple-500/20 focus:border-purple-500 transition-all font-medium text-slate-700" placeholder="+1 234 567 8900" />
                  </div>
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="text-[11px] font-bold text-slate-500 uppercase">Official Email *</label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
                  <input required type="email" name="email" value={formData.email} onChange={handleChange} className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-purple-500/20 focus:border-purple-500 transition-all font-medium text-slate-700" placeholder="admin@citypathlabs.com" />
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="text-[11px] font-bold text-slate-500 uppercase">Full Address *</label>
                <div className="relative">
                  <MapPin className="absolute left-3 top-3 text-slate-400" size={16} />
                  <input required type="text" name="address" value={formData.address} onChange={handleChange} className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-purple-500/20 focus:border-purple-500 transition-all font-medium text-slate-700" placeholder="123 Health Ave, Medical District" />
                </div>
              </div>
            </div>

            {/* ADMIN ACCOUNT SECTION */}
            <div className="space-y-4 pt-4">
              <h3 className="text-xs font-black text-slate-400 uppercase tracking-widest border-b pb-2 mb-4">2. Admin Account</h3>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-[11px] font-bold text-slate-500 uppercase">Your Name *</label>
                  <div className="relative">
                    <User className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
                    <input required type="text" name="adminName" value={formData.adminName} onChange={handleChange} className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-purple-500/20 focus:border-purple-500 transition-all font-medium text-slate-700" placeholder="Dr. John Doe" />
                  </div>
                </div>

                <div className="space-y-1.5">
                  <label className="text-[11px] font-bold text-slate-500 uppercase">Login Username *</label>
                  <div className="relative">
                    <User className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
                    <input required type="text" name="adminUsername" value={formData.adminUsername} onChange={handleChange} className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-purple-500/20 focus:border-purple-500 transition-all font-medium text-slate-700" placeholder="admin123" />
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-[11px] font-bold text-slate-500 uppercase">Password *</label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
                    <input required type="password" name="adminPassword" value={formData.adminPassword} onChange={handleChange} className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-purple-500/20 focus:border-purple-500 transition-all font-medium text-slate-700" placeholder="••••••••" />
                  </div>
                </div>

                <div className="space-y-1.5">
                  <label className="text-[11px] font-bold text-slate-500 uppercase">Confirm Password *</label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
                    <input required type="password" name="confirmPassword" value={formData.confirmPassword} onChange={handleChange} className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-purple-500/20 focus:border-purple-500 transition-all font-medium text-slate-700" placeholder="••••••••" />
                  </div>
                </div>
              </div>
            </div>

            <button 
              type="submit" 
              disabled={isLoading}
              className="w-full bg-[#5e35b1] hover:bg-[#4527a0] text-white font-bold py-3.5 px-6 rounded-xl shadow-lg shadow-purple-500/30 transition-all flex items-center justify-center gap-2 group disabled:opacity-70 disabled:cursor-not-allowed mt-4"
            >
              {isLoading ? (
                <>
                  <Loader2 size={18} className="animate-spin" />
                  Generating Laboratory...
                </>
              ) : (
                <>
                  Register Laboratory
                  <ArrowRight size={18} className="transition-transform group-hover:translate-x-1" />
                </>
              )}
            </button>
            
            <div className="text-center mt-6">
               <p className="text-sm text-slate-500 font-medium">
                 Already have a lab registered?{' '}
                 <Link href="/login" className="text-[#5e35b1] font-bold hover:underline">
                   Sign in here
                 </Link>
               </p>
            </div>

          </form>
        </div>
      </div>
    </div>
  );
}
// --- BLOCK app/register/page.tsx CLOSE ---
"use client";

import React, { useState, useEffect } from "react";
import { Download, Laptop, Smartphone, X, CheckCircle2, Share, PlusSquare, ArrowDownToLine, MonitorDown } from "lucide-react";
import toast from "react-hot-toast";

export default function PWAInstallButton() {
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);
  const [isStandalone, setIsStandalone] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [deviceType, setDeviceType] = useState<"ios" | "android" | "desktop">("desktop");

  useEffect(() => {
    // 1. Register Service Worker for PWA compliance
    if (typeof window !== "undefined" && "serviceWorker" in navigator) {
      navigator.serviceWorker
        .register("/sw.js")
        .catch((err) => console.log("SW register error:", err));
    }

    // 2. Check if already installed & running standalone
    if (typeof window !== "undefined") {
      const standalone =
        window.matchMedia("(display-mode: standalone)").matches ||
        (window.navigator as any).standalone === true;
      setIsStandalone(Boolean(standalone));

      // Detect OS
      const ua = window.navigator.userAgent.toLowerCase();
      if (/iphone|ipad|ipod/.test(ua)) {
        setDeviceType("ios");
      } else if (/android/.test(ua)) {
        setDeviceType("android");
      } else {
        setDeviceType("desktop");
      }
    }

    // 3. Listen for browser PWA beforeinstallprompt event
    const handleBeforeInstall = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e);
    };

    window.addEventListener("beforeinstallprompt", handleBeforeInstall);
    return () => window.removeEventListener("beforeinstallprompt", handleBeforeInstall);
  }, []);

  const handleInstallClick = async () => {
    if (isStandalone) {
      toast.success("Lab Seven is already running as an installed app!");
      return;
    }

    // If browser supports native automated prompt (Chrome, Edge, Android)
    if (deferredPrompt) {
      deferredPrompt.prompt();
      const choiceResult = await deferredPrompt.userChoice;
      if (choiceResult.outcome === "accepted") {
        toast.success("Creating app shortcut on your device!");
      }
      setDeferredPrompt(null);
    } else {
      // Show guided instructions popup for iOS or browsers where prompt is not auto-triggered
      setIsModalOpen(true);
    }
  };

  return (
    <>
      {/* --- DESKTOP BUTTON --- */}
      <button
        type="button"
        onClick={handleInstallClick}
        className="p-2 rounded-lg bg-purple-200/30 hover:bg-purple-200/50 transition-colors cursor-pointer hidden sm:flex items-center justify-center"
        style={{ color: "#9575cd" }}
        title="Download / Install Lab Seven as an app on your PC or Mobile"
      >
        <Download size={20} strokeWidth={2.2} />
      </button>

      {/* --- MOBILE BUTTON --- */}
      <button
        type="button"
        onClick={handleInstallClick}
        className="w-6 h-6 rounded-full bg-white/80 hover:bg-white text-[#7e57c2] border border-slate-200/70 shadow-2xs flex sm:hidden items-center justify-center active:scale-90 transition-all ml-0.5"
        style={{ WebkitTapHighlightColor: "transparent" }}
        title="Download / Install App"
      >
        <Download size={13} strokeWidth={2.2} />
      </button>

      {/* --- GUIDED INSTALL MODAL --- */}
      {isModalOpen && (
        <div
          className="fixed inset-0 z-[200] flex items-center justify-center bg-slate-900/50 backdrop-blur-sm p-4 animate-in fade-in duration-150"
          onClick={() => setIsModalOpen(false)}
        >
          <div
            className="bg-white rounded-2xl w-full max-w-sm shadow-2xl p-5 border border-slate-200 animate-in zoom-in-95 duration-200"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-xl bg-purple-100 text-[#7e57c2] flex items-center justify-center">
                  <Download size={16} strokeWidth={2.2} />
                </div>
                <div>
                  <h3 className="text-sm font-black text-slate-800 leading-tight">Install Lab Seven</h3>
                  <p className="text-[10px] text-slate-500">Create shortcut & open as standalone app</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setIsModalOpen(false)}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100"
              >
                <X size={16} />
              </button>
            </div>

            {/* Instruction Body based on device */}
            <div className="py-4 space-y-3">
              {deviceType === "ios" ? (
                <div className="space-y-2.5 text-xs text-slate-600">
                  <p className="font-bold text-slate-800 flex items-center gap-1.5">
                    <Smartphone size={14} className="text-[#7e57c2]" /> On iPhone & iPad (Safari):
                  </p>
                  <ol className="list-decimal list-inside space-y-1.5 text-[11px] bg-slate-50 p-3 rounded-xl border border-slate-200/80">
                    <li className="flex items-center gap-2">
                      <span className="font-bold">1.</span> Tap the <span className="font-bold text-[#7e57c2] inline-flex items-center gap-0.5"><Share size={12} /> Share</span> button at bottom.
                    </li>
                    <li className="flex items-center gap-2">
                      <span className="font-bold">2.</span> Scroll down and tap <span className="font-bold text-slate-800 inline-flex items-center gap-0.5"><PlusSquare size={12} /> Add to Home Screen</span>.
                    </li>
                    <li className="flex items-center gap-2">
                      <span className="font-bold">3.</span> Tap <span className="font-bold text-emerald-600">Add</span> in the top right.
                    </li>
                  </ol>
                </div>
              ) : deviceType === "android" ? (
                <div className="space-y-2.5 text-xs text-slate-600">
                  <p className="font-bold text-slate-800 flex items-center gap-1.5">
                    <Smartphone size={14} className="text-[#7e57c2]" /> On Android (Chrome):
                  </p>
                  <ol className="list-decimal list-inside space-y-1.5 text-[11px] bg-slate-50 p-3 rounded-xl border border-slate-200/80">
                    <li>Tap the <strong>three dots (⋮)</strong> menu in Chrome.</li>
                    <li>Select <strong>Install app</strong> or <strong>Add to Home screen</strong>.</li>
                    <li>Follow the prompt to add the shortcut.</li>
                  </ol>
                </div>
              ) : (
                <div className="space-y-2.5 text-xs text-slate-600">
                  <p className="font-bold text-slate-800 flex items-center gap-1.5">
                    <Laptop size={14} className="text-[#7e57c2]" /> On PC / Laptop (Chrome / Edge):
                  </p>
                  <ol className="list-decimal list-inside space-y-1.5 text-[11px] bg-slate-50 p-3 rounded-xl border border-slate-200/80">
                    <li className="flex items-center gap-1.5">
                      <span>1. Click the</span>
                      <span className="inline-flex items-center gap-1 bg-white px-1.5 py-0.5 rounded border border-slate-200 text-[#7e57c2] font-bold">
                        <MonitorDown size={12} /> Install
                      </span>
                      <span>icon in your address bar.</span>
                    </li>
                    <li>Or click <strong>Menu (⋮)</strong> → <strong>Cast, save, and share</strong> → <strong>Install Lab Seven</strong>.</li>
                    <li>Check <strong>"Create desktop shortcut"</strong> and click <strong>Install</strong>.</li>
                  </ol>
                </div>
              )}

              <div className="bg-emerald-50 border border-emerald-200/80 rounded-xl p-2.5 flex items-center gap-2">
                <CheckCircle2 size={16} className="text-emerald-600 shrink-0" />
                <span className="text-[10px] text-emerald-800 font-medium leading-tight">
                  Opens in its own clean window without browser address bar and tabs!
                </span>
              </div>
            </div>

            {/* Footer Action */}
            <div className="pt-2">
              <button
                type="button"
                onClick={() => setIsModalOpen(false)}
                className="w-full h-9 rounded-xl bg-[#7e57c2] hover:bg-[#6c43b3] text-white font-bold text-xs shadow-xs active:scale-98 transition-all"
              >
                Got It
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

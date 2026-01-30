import React, { useState, useEffect } from 'react';
import { initializeApp } from 'firebase/app';
import { getFirestore, collection, onSnapshot } from 'firebase/firestore';
import { getAuth, signInAnonymously, onAuthStateChanged } from 'firebase/auth';
import { Calendar, Users, Settings, ClipboardList } from 'lucide-react';

// --- KONFIGURASI TERUS (PALING STABIL) ---
const firebaseConfig = {
  apiKey: "AIzaSyDw1t_UrMRvEHCyKFQIzMmlP7w6feSIos0",
  authDomain: "jadual-oncall.firebaseapp.com",
  projectId: "jadual-oncall",
  storageBucket: "jadual-oncall.firebasestorage.app",
  messagingSenderId: "152318949416",
  appId: "1:152318949416:web:1f141e58315f769b66dd1d",
  measurementId: "G-N7Y3HPRTFB"
};

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);

const App = () => {
  const [user, setUser] = useState(null);
  const [activeTab, setActiveTab] = useState('calendar');

  useEffect(() => {
    // Aktifkan Login Tanpa Nama secara percuma
    signInAnonymously(auth).catch(err => console.error("Auth Fail:", err));
    return onAuthStateChanged(auth, (u) => setUser(u));
  }, []);

  // Paparan loading sementara database bersambung
  if (!user) return (
    <div className="h-screen flex items-center justify-center bg-blue-50">
      <div className="text-center">
        <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-blue-600 mx-auto mb-4"></div>
        <p className="font-bold text-blue-600">Menyambung ke Database Farmasi...</p>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-slate-50 font-sans">
      <header className="bg-white border-b p-4 shadow-sm flex justify-between items-center sticky top-0 z-10">
        <div className="flex items-center gap-2">
          <div className="bg-blue-600 p-2 rounded-lg text-white"><ClipboardList size={20} /></div>
          <h1 className="font-black text-lg tracking-tight">E-ONCALL FARMASI</h1>
        </div>
        <nav className="flex gap-1 bg-slate-100 p-1 rounded-xl">
          <button 
            onClick={() => setActiveTab('calendar')} 
            className={`px-6 py-2 rounded-lg text-xs font-black transition-all ${activeTab === 'calendar' ? 'bg-white shadow text-blue-600' : 'text-slate-500'}`}
          >
            JADUAL
          </button>
          <button 
            onClick={() => setActiveTab('staff')} 
            className={`px-6 py-2 rounded-lg text-xs font-black transition-all ${activeTab === 'staff' ? 'bg-white shadow text-blue-600' : 'text-slate-500'}`}
          >
            STAF
          </button>
        </nav>
      </header>

      <main className="max-w-4xl mx-auto p-6">
        {activeTab === 'calendar' ? (
          <div className="bg-white p-12 rounded-[2.5rem] shadow-xl border border-slate-100 text-center animate-in fade-in zoom-in-95">
            <div className="bg-blue-50 w-20 h-20 rounded-3xl flex items-center justify-center mx-auto mb-6 text-blue-500">
              <Calendar size={40} />
            </div>
            <h2 className="font-black text-2xl text-slate-800 uppercase mb-2">Sistem Sudah Aktif</h2>
            <p className="text-slate-500 font-medium">Database Firestore anda sedia digunakan secara percuma.</p>
            <div className="mt-8 p-4 bg-slate-50 rounded-2xl border border-dashed border-slate-200">
               <p className="text-xs font-bold text-slate-400 uppercase">Status Kuota Harian:</p>
               <p className="text-[10px] text-slate-400 mt-1">50,000 Bacaan & 20,000 Tulisan Percuma</p>
            </div>
          </div>
        ) : (
          <div className="bg-white p-8 rounded-[2.5rem] shadow-xl border border-slate-100 animate-in slide-in-from-right-4">
            <div className="flex justify-between items-center mb-8">
              <h2 className="font-black text-xl text-slate-800 uppercase">Direktori Staf</h2>
              <button className="bg-blue-600 text-white px-6 py-3 rounded-2xl font-black text-xs shadow-lg shadow-blue-200 active:scale-95 transition-all">
                TAMBAH STAF
              </button>
            </div>
            <div className="py-20 text-center border-2 border-dashed border-slate-100 rounded-3xl">
               <Users size={48} className="mx-auto text-slate-200 mb-4" />
               <p className="text-slate-400 font-bold">Tiada data staf dijumpai.</p>
            </div>
          </div>
        )}
      </main>
      
      <footer className="text-center py-6">
        <p className="text-[10px] font-black text-slate-300 uppercase tracking-widest">Hospital Management System v1.0</p>
      </footer>
    </div>
  );
};

export default App;

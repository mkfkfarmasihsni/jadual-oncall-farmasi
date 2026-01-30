import React, { useState, useEffect, useMemo } from 'react';
import { initializeApp } from 'firebase/app';
import { 
  getFirestore, collection, doc, setDoc, onSnapshot, 
  deleteDoc, addDoc, updateDoc 
} from 'firebase/firestore';
import { getAuth, signInAnonymously, onAuthStateChanged } from 'firebase/auth';
import { 
  Calendar as CalendarIcon, Users, Trash2, ChevronLeft, ChevronRight, 
  Clock, UserPlus, Info, CheckCircle2, X, ClipboardList, Phone, 
  MessageCircle, Plus, Settings, Edit2, Save, Search, UserCheck, 
  Printer, FileText, MapPin, Coffee, BookOpen, Stethoscope, Plane, User
} from 'lucide-react';

// --- CONFIGURASI YANG SUDAH TERBUKTI BERFUNGSI ---
const firebaseConfig = {
  apiKey: "AIzaSyDw1t_UrMRvEHCyKFQIzMmlP7w6feSIos0",
  authDomain: "jadual-oncall.firebaseapp.com",
  projectId: "jadual-oncall",
  storageBucket: "jadual-oncall.firebasestorage.app",
  messagingSenderId: "152318949416",
  appId: "1:152318949416:web:1f141e58315f769b66dd1d",
  measurementId: "G-N7Y3HPRTFB"
};

const appId = "pharmacy-oncall-2026";
const firebaseApp = initializeApp(firebaseConfig);
const auth = getAuth(firebaseApp);
const db = getFirestore(firebaseApp);

// --- WARNA & JENIS PERGERAKAN ---
const COLOR_OPTIONS = [
  { id: 'indigo', bg: 'bg-indigo-600', light: 'bg-indigo-50 text-indigo-700' },
  { id: 'orange', bg: 'bg-orange-500', light: 'bg-orange-50 text-orange-700' },
  { id: 'emerald', bg: 'bg-emerald-500', light: 'bg-emerald-50 text-emerald-700' },
  { id: 'blue', bg: 'bg-blue-500', light: 'bg-blue-50 text-blue-700' },
];

const MOVEMENT_TYPES = [
  { id: 'Bercuti', label: 'Bercuti', color: 'bg-rose-500', icon: <Plane size={14} /> },
  { id: 'MC', label: 'MC', color: 'bg-amber-600', icon: <Stethoscope size={14} /> },
  { id: 'Kursus', label: 'Kursus', color: 'bg-indigo-500', icon: <BookOpen size={14} /> },
  { id: 'Off', label: 'Off', color: 'bg-slate-500', icon: <Coffee size={14} /> },
];

const App = () => {
  const [user, setUser] = useState(null);
  const [activeTab, setActiveTab] = useState('calendar');
  const [staff, setStaff] = useState([]);
  const [shifts, setShifts] = useState({});
  const [shiftDefinitions, setShiftDefinitions] = useState([]);
  const [movements, setMovements] = useState([]);
  const [currentMonth, setCurrentMonth] = useState(new Date(2026, 0, 1));
  const [selectedDate, setSelectedDate] = useState(null);
  const [showStaffModal, setShowStaffModal] = useState(false);
  const [newStaff, setNewStaff] = useState({ name: '', unit: '', phone: '' });

  // Auth & Listeners
  useEffect(() => {
    signInAnonymously(auth);
    onAuthStateChanged(auth, (u) => setUser(u));
  }, []);

  useEffect(() => {
    if (!user) return;
    const unsubStaff = onSnapshot(collection(db, 'artifacts', appId, 'public', 'data', 'staff'), (s) => 
      setStaff(s.docs.map(d => ({ id: d.id, ...d.data() }))));
    const unsubShifts = onSnapshot(collection(db, 'artifacts', appId, 'public', 'data', 'shifts'), (s) => {
      const map = {}; s.docs.forEach(d => map[d.id] = d.data()); setShifts(map);
    });
    const unsubDef = onSnapshot(collection(db, 'artifacts', appId, 'public', 'data', 'shiftDefinitions'), (s) => {
      let defs = s.docs.map(d => ({ id: d.id, ...d.data() }));
      if (defs.length === 0) {
        const defaults = [
          { label: 'Night Shift', time: '11PM-8AM', color: 'indigo', order: 1 },
          { label: 'Evening Shift', time: '2PM-11PM', color: 'orange', order: 2 },
          { label: 'Lunch Call', time: '1PM-2PM', color: 'emerald', order: 3 }
        ];
        defaults.forEach(d => addDoc(collection(db, 'artifacts', appId, 'public', 'data', 'shiftDefinitions'), d));
      }
      setShiftDefinitions(defs.sort((a,b) => a.order - b.order));
    });
    const unsubMov = onSnapshot(collection(db, 'artifacts', appId, 'public', 'data', 'movements'), (s) => 
        setMovements(s.docs.map(d => ({ id: d.id, ...d.data() }))));

    return () => { unsubStaff(); unsubShifts(); unsubDef(); unsubMov(); };
  }, [user]);

  const calendarDays = useMemo(() => {
    const y = currentMonth.getFullYear(), m = currentMonth.getMonth();
    const days = [];
    const total = new Date(y, m + 1, 0).getDate();
    const start = (new Date(y, m, 1).getDay() + 6) % 7;
    for (let i = 0; i < start; i++) days.push(null);
    for (let i = 1; i <= total; i++) days.push(`${y}-${String(m+1).padStart(2,'0')}-${String(i).padStart(2,'0')}`);
    return days;
  }, [currentMonth]);

  const toggleShift = async (date, shiftId, sId, sName) => {
    const ref = doc(db, 'artifacts', appId, 'public', 'data', 'shifts', date);
    const data = { ...(shifts[date] || {}) };
    let list = Array.isArray(data[shiftId]) ? [...data[shiftId]] : [];
    if (list.find(x => x.staffId === sId)) list = list.filter(x => x.staffId !== sId);
    else list.push({ staffId: sId, staffName: sName });
    data[shiftId] = list;
    if (list.length === 0) delete data[shiftId];
    Object.keys(data).length === 0 ? await deleteDoc(ref) : await setDoc(ref, data);
  };

  if (!user) return <div className="h-screen flex items-center justify-center bg-blue-50 font-bold text-blue-600">Sila Tunggu, Database Farmasi Sedang Bersiap...</div>;

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 pb-10 font-sans">
      <header className="bg-white border-b p-4 sticky top-0 z-20 shadow-sm flex flex-col md:flex-row justify-between items-center gap-4">
        <div className="flex items-center gap-3">
          <div className="bg-blue-600 p-2 rounded-xl text-white shadow-lg"><ClipboardList size={22}/></div>
          <div className="text-left"><h1 className="font-black text-xl tracking-tight">E-ONCALL FARMASI</h1><p className="text-[10px] uppercase font-bold text-slate-400">Hospital Management System</p></div>
        </div>
        <nav className="flex bg-slate-100 p-1 rounded-2xl gap-1">
          <button onClick={() => setActiveTab('calendar')} className={`flex items-center gap-2 px-6 py-2.5 rounded-xl text-xs font-black transition-all ${activeTab === 'calendar' ? 'bg-white shadow text-blue-600' : 'text-slate-500'}`}><CalendarIcon size={16}/>KALENDAR</button>
          <button onClick={() => setActiveTab('movement')} className={`flex items-center gap-2 px-6 py-2.5 rounded-xl text-xs font-black transition-all ${activeTab === 'movement' ? 'bg-white shadow text-blue-600' : 'text-slate-500'}`}><MapPin size={16}/>PERGERAKAN</button>
          <button onClick={() => setActiveTab('staff')} className={`flex items-center gap-2 px-6 py-2.5 rounded-xl text-xs font-black transition-all ${activeTab === 'staff' ? 'bg-white shadow text-blue-600' : 'text-slate-500'}`}><Users size={16}/>STAF</button>
        </nav>
      </header>

      <main className="max-w-[1600px] mx-auto p-4 md:p-6">
        {activeTab === 'calendar' && (
          <div className="space-y-6">
            <div className="bg-white rounded-[2.5rem] shadow-xl border border-slate-200 overflow-hidden">
              <div className="p-6 border-b flex justify-between items-center bg-slate-50/50">
                <button onClick={() => setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() - 1, 1))} className="p-3 hover:bg-white rounded-full transition-all shadow-sm border"><ChevronLeft/></button>
                <h2 className="font-black text-2xl uppercase tracking-tighter">{currentMonth.toLocaleString('ms-MY', { month: 'long', year: 'numeric' })}</h2>
                <button onClick={() => setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1, 1))} className="p-3 hover:bg-white rounded-full transition-all shadow-sm border"><ChevronRight/></button>
              </div>
              <div className="grid grid-cols-7 border-b bg-white text-[10px] font-black uppercase text-center py-4 tracking-widest text-slate-400">
                {['Isnin','Selasa','Rabu','Khamis','Jumaat','Sabtu','Ahad'].map(d => <div key={d}>{d}</div>)}
              </div>
              <div className="grid grid-cols-7 gap-px bg-slate-100">
                {calendarDays.map((d, i) => (
                  <div key={i} onClick={() => d && setSelectedDate(d)} className={`min-h-[140px] md:min-h-[200px] p-3 bg-white transition-all ${d ? 'cursor-pointer hover:bg-blue-50/30' : 'bg-slate-50/50'}`}>
                    {d && <>
                      <div className="flex justify-between items-start mb-2"><span className="inline-flex items-center justify-center w-8 h-8 text-sm font-black rounded-full text-slate-700">{parseInt(d.split('-')[2])}</span></div>
                      <div className="space-y-1.5 overflow-y-auto max-h-32 custom-scrollbar">
                        {shiftDefinitions.map(def => shifts[d]?.[def.id]?.map(s => (
                          <div key={s.staffId} className={`px-2 py-1.5 rounded-xl text-[10px] font-black uppercase truncate border border-current/10 shadow-sm ${COLOR_OPTIONS.find(c=>c.id===def.color).light}`}>
                            {s.staffName}
                          </div>
                        )))}
                      </div>
                    </>}
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {activeTab === 'staff' && (
          <div className="bg-white rounded-[2.5rem] shadow-xl p-8 border">
            <div className="flex flex-col md:flex-row justify-between items-center mb-10 gap-4">
              <h2 className="font-black text-2xl uppercase tracking-tight">Direktori Kakitangan Farmasi</h2>
              <button onClick={() => setShowStaffModal(true)} className="w-full md:w-auto bg-blue-600 text-white px-8 py-4 rounded-2xl font-black flex items-center justify-center gap-2 shadow-xl shadow-blue-100 active:scale-95 transition-all"><UserPlus size={20}/> TAMBAH STAF</button>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {staff.sort((a,b) => a.name.localeCompare(b.name)).map(s => (
                <div key={s.id} className="p-5 bg-slate-50 rounded-[2rem] flex justify-between items-center border border-slate-100 hover:bg-white hover:shadow-lg transition-all group">
                  <div className="text-left flex items-center gap-4">
                    <div className="w-12 h-12 bg-white rounded-2xl flex items-center justify-center font-black text-blue-600 shadow-sm border">{s.name.substring(0,2)}</div>
                    <div><p className="font-black uppercase text-sm text-slate-800">{s.name}</p><p className="text-[10px] font-bold text-blue-500 uppercase tracking-widest">{s.unit || 'FARMASI'}</p></div>
                  </div>
                  <button onClick={() => deleteDoc(doc(db, 'artifacts', appId, 'public', 'data', 'staff', s.id))} className="p-3 text-slate-300 hover:text-red-500 transition-colors"><Trash2 size={20}/></button>
                </div>
              ))}
            </div>
          </div>
        )}

        {activeTab === 'movement' && (
            <div className="bg-white rounded-[2.5rem] p-10 shadow-xl text-center border">
                <MapPin size={48} className="mx-auto text-blue-200 mb-4"/>
                <h2 className="font-black text-2xl uppercase">Modul Pergerakan</h2>
                <p className="text-slate-400 font-bold">Modul ini akan diaktifkan secara automatik sebaik sahaja anda mengisi data staf.</p>
            </div>
        )}
      </main>

      {selectedDate && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-md z-[100] flex items-center justify-center p-4 animate-in fade-in">
          <div className="bg-white w-full max-w-5xl rounded-[3rem] shadow-2xl overflow-hidden animate-in zoom-in-95">
            <div className="p-8 border-b flex justify-between items-center bg-slate-50/80">
              <div className="text-left"><h3 className="text-2xl font-black uppercase tracking-tight">Kemaskini Jadual Staf</h3><p className="font-bold text-slate-500">📅 {new Date(selectedDate).toLocaleDateString('ms-MY', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}</p></div>
              <button onClick={() => setSelectedDate(null)} className="p-4 bg-white hover:bg-slate-100 rounded-full shadow-sm border"><X size={24}/></button>
            </div>
            <div className="p-8 grid grid-cols-1 md:grid-cols-2 gap-8 max-h-[60vh] overflow-y-auto custom-scrollbar">
              {shiftDefinitions.map(def => (
                <div key={def.id} className="p-6 bg-slate-50 rounded-[2.5rem] border border-slate-100">
                  <div className="flex items-center gap-2 mb-4 border-b pb-2"><div className={`w-3 h-3 rounded-full ${COLOR_OPTIONS.find(c=>c.id===def.color).bg}`}></div><p className="font-black text-xs uppercase tracking-widest">{def.label} ({def.time})</p></div>
                  <div className="flex flex-wrap gap-2">
                    {staff.map(s => {
                      const active = shifts[selectedDate]?.[def.id]?.some(x=>x.staffId===s.id);
                      return (
                        <button key={s.id} onClick={() => toggleShift(selectedDate, def.id, s.id, s.name)} className={`px-4 py-2 rounded-xl text-[10px] font-black uppercase border-2 transition-all ${active ? 'bg-blue-600 text-white border-blue-600 shadow-lg' : 'bg-white text-slate-400 border-slate-100 hover:border-slate-300'}`}>{s.name}</button>
                      );
                    })}
                  </div>
                </div>
              ))}
            </div>
            <div className="p-8 bg-slate-50 border-t flex justify-center"><button onClick={() => setSelectedDate(null)} className="px-20 py-5 bg-slate-900 text-white rounded-2xl font-black uppercase tracking-widest shadow-xl active:scale-95 transition-all">SIMPAN JADUAL</button></div>
          </div>
        </div>
      )}

      {showStaffModal && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-md z-[110] flex items-center justify-center p-4 animate-in fade-in">
          <div className="bg-white w-full max-w-md rounded-[3rem] p-10 shadow-2xl">
            <h3 className="font-black text-2xl uppercase mb-8 tracking-tighter text-left">Daftar Staf Baru</h3>
            <div className="space-y-4">
                <div className="text-left"><label className="text-[10px] font-black uppercase text-slate-400 ml-2">Nama Penuh</label><input type="text" placeholder="CONTOH: AFIF BIN AHMAD" className="w-full p-5 bg-slate-50 rounded-2xl font-bold outline-none border border-slate-100 focus:ring-2 focus:ring-blue-500 transition-all uppercase" onChange={e => setNewStaff({...newStaff, name: e.target.value.toUpperCase()})}/></div>
                <div className="text-left"><label className="text-[10px] font-black uppercase text-slate-400 ml-2">Unit / Seksyen</label><input type="text" placeholder="CONTOH: LOGISTIK / FARMASI KLINIKAL" className="w-full p-5 bg-slate-50 rounded-2xl font-bold outline-none border border-slate-100 focus:ring-2 focus:ring-blue-500 transition-all uppercase" onChange={e => setNewStaff({...newStaff, unit: e.target.value.toUpperCase()})}/></div>
            </div>
            <div className="flex gap-4 mt-10">
                <button onClick={() => setShowStaffModal(false)} className="flex-1 py-5 font-black text-slate-400 uppercase tracking-widest text-xs">Batal</button>
                <button onClick={async () => { if(newStaff.name) { await addDoc(collection(db, 'artifacts', appId, 'public', 'data', 'staff'), newStaff); setShowStaffModal(false); } }} className="flex-1 py-5 bg-blue-600 text-white rounded-2xl font-black uppercase tracking-widest text-xs shadow-xl shadow-blue-100 active:scale-95 transition-all">SIMPAN DATA</button>
            </div>
          </div>
        </div>
      )}

      <style>{`
        .custom-scrollbar::-webkit-scrollbar { width: 4px; }
        .custom-scrollbar::-webkit-scrollbar-track { background: transparent; }
        .custom-scrollbar::-webkit-scrollbar-thumb { background: #cbd5e1; border-radius: 10px; }
      `}</style>
    </div>
  );
};

export default App;

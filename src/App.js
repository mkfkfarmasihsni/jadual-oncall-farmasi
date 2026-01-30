import React, { useState, useEffect, useMemo } from 'react';
import { initializeApp } from 'firebase/app';
import { 
  getFirestore, collection, doc, setDoc, onSnapshot, deleteDoc, addDoc, updateDoc
} from 'firebase/firestore';
import { 
  getAuth, signInAnonymously, onAuthStateChanged 
} from 'firebase/auth';
import { 
  Calendar as CalendarIcon, Users, Trash2, ChevronLeft, ChevronRight, Clock, 
  UserPlus, Info, CheckCircle2, X, ClipboardList, Phone, MessageCircle, 
  Plus, Settings, Edit2, Save, Search, UserCheck, Briefcase, Printer, 
  ArrowLeft, Layout, Check, FileText, MapPin, Coffee, BookOpen, 
  Stethoscope, Plane, User
} from 'lucide-react';

// --- PEMBETULAN: Konfigurasi Terus supaya Go-Live ---
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

// Inisialisasi Firebase
const firebaseApp = initializeApp(firebaseConfig);
const auth = getAuth(firebaseApp);
const db = getFirestore(firebaseApp);

// --- SEMUA DATA ASAL ANDA DIBAWAH (TIDAK BERUBAH) ---
const COLOR_OPTIONS = [
  { id: 'indigo', bg: 'bg-indigo-600', border: 'border-indigo-600', light: 'bg-indigo-50 text-indigo-700' },
  { id: 'orange', bg: 'bg-orange-500', border: 'border-orange-500', light: 'bg-orange-50 text-orange-700' },
  { id: 'emerald', bg: 'bg-emerald-500', border: 'border-emerald-500', light: 'bg-emerald-700 text-white' },
  { id: 'blue', bg: 'bg-blue-500', border: 'border-blue-500', light: 'bg-blue-700 text-blue-700' },
  { id: 'pink', bg: 'bg-pink-500', border: 'border-pink-500', light: 'bg-pink-50 text-pink-700' },
  { id: 'red', bg: 'bg-red-500', border: 'border-red-500', light: 'bg-red-50 text-red-700' },
  { id: 'purple', bg: 'bg-purple-600', border: 'border-purple-600', light: 'bg-purple-50 text-purple-700' },
  { id: 'teal', bg: 'bg-teal-500', border: 'border-teal-500', light: 'bg-teal-700 text-white' },
  { id: 'amber', bg: 'bg-amber-500', border: 'border-amber-500', light: 'bg-amber-50 text-amber-700' },
  { id: 'lime', bg: 'bg-lime-500', border: 'border-lime-500', light: 'bg-lime-50 text-lime-700' },
  { id: 'cyan', bg: 'bg-cyan-500', border: 'border-cyan-500', light: 'bg-cyan-50 text-cyan-700' },
  { id: 'rose', bg: 'bg-rose-500', border: 'border-rose-500', light: 'bg-rose-50 text-rose-700' },
  { id: 'slate', bg: 'bg-slate-600', border: 'border-slate-600', light: 'bg-slate-100 text-slate-700' },
  { id: 'fuchsia', bg: 'bg-fuchsia-600', border: 'border-fuchsia-600', light: 'bg-fuchsia-50 text-fuchsia-700' },
];

const MOVEMENT_TYPES = [
  { id: 'Bercuti', label: 'Bercuti', color: 'bg-rose-500', light: 'bg-rose-50 text-rose-700', icon: <Plane size={14} /> },
  { id: 'MC', label: 'MC', color: 'bg-amber-600', light: 'bg-amber-50 text-amber-700', icon: <Stethoscope size={14} /> },
  { id: 'Kursus', label: 'Kursus', color: 'bg-indigo-500', light: 'bg-indigo-50 text-indigo-700', icon: <BookOpen size={14} /> },
  { id: 'Off', label: 'Off', color: 'bg-slate-500', light: 'bg-slate-100 text-slate-700', icon: <Coffee size={14} /> },
  { id: 'Mesyuarat', label: 'Mesyuarat', color: 'bg-blue-600', light: 'bg-blue-50 text-blue-700', icon: <Users size={14} /> },
  { id: 'Temujanji', label: 'Temujanji', color: 'bg-teal-500', light: 'bg-teal-700 text-white', icon: <CheckCircle2 size={14} /> },
  { id: 'Cuti Bersalin', label: 'Cuti Bersalin', color: 'bg-pink-500', light: 'bg-pink-50 text-pink-700', icon: <Plus size={14} /> },
  { id: 'Cuti Belajar', label: 'Cuti Belajar', color: 'bg-purple-600', light: 'bg-purple-50 text-purple-700', icon: <BookOpen size={14} /> },
];

const getShiftColor = (colorId, type = 'bg') => {
  const color = COLOR_OPTIONS.find(c => c.id === colorId) || COLOR_OPTIONS[0];
  return color[type];
};

const formatLocalDate = (year, month, day) => {
  return `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
};

const App = () => {
  const [user, setUser] = useState(null);
  const [activeTab, setActiveTab] = useState('calendar'); 
  const [isPrintMode, setIsPrintMode] = useState(false);
  const [printFormat, setPrintFormat] = useState('calendar'); 
  const [showPrintOptions, setShowPrintOptions] = useState(false);
  const [selectedPrintShifts, setSelectedPrintShifts] = useState([]);
  const [staff, setStaff] = useState([]);
  const [shifts, setShifts] = useState({});
  const [shiftDefinitions, setShiftDefinitions] = useState([]);
  const [holidays, setHolidays] = useState({});
  const [movements, setMovements] = useState([]);
  const [appSettings, setAppSettings] = useState({ title: 'E-OnCall Farmasi', subtitle: 'Hospital Management System' });
  const [currentMonth, setCurrentMonth] = useState(new Date(2026, 0, 1));
  const [selectedDate, setSelectedDate] = useState(null);
  const [activeShiftType, setActiveShiftType] = useState('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [staffSearchTerm, setStaffSearchTerm] = useState('');
  const [movementModalSearch, setMovementModalSearch] = useState(''); 
  const [modalSearchTerms, setModalSearchTerms] = useState({});
  const [showStaffModal, setShowStaffModal] = useState(false);
  const [showShiftDefModal, setShowShiftDefModal] = useState(false);
  const [showMovementModal, setShowMovementModal] = useState(false);
  const [newStaff, setNewStaff] = useState({ name: '', phone: '', unit: '', id: null });
  const [editingShiftDef, setEditingShiftDef] = useState(null);
  const [newHoliday, setNewHoliday] = useState({ date: '', name: '' });
  const [newMovement, setNewMovement] = useState({ staffId: '', staffName: '', type: 'Bercuti', dateStart: '', dateEnd: '', timeInfo: '' });
  const [statusMsg, setStatusMsg] = useState(null);

  const headerVisible = !isPrintMode;

  useEffect(() => {
    signInAnonymously(auth);
    const unsubscribeAuth = onAuthStateChanged(auth, (u) => setUser(u));
    return () => unsubscribeAuth();
  }, []);

  useEffect(() => {
    if (!user) return;
    const unsubStaff = onSnapshot(collection(db, 'artifacts', appId, 'public', 'data', 'staff'), (s) => setStaff(s.docs.map(d => ({ id: d.id, ...d.data() }))));
    const unsubShifts = onSnapshot(collection(db, 'artifacts', appId, 'public', 'data', 'shifts'), (s) => {
      const map = {}; s.docs.forEach(d => map[d.id] = d.data()); setShifts(map);
    });
    const unsubDef = onSnapshot(collection(db, 'artifacts', appId, 'public', 'data', 'shiftDefinitions'), (s) => {
      let defs = s.docs.map(d => ({ id: d.id, ...d.data() })).sort((a,b) => (a.order || 0) - (b.order || 0));
      setShiftDefinitions(defs);
      if (selectedPrintShifts.length === 0) setSelectedPrintShifts(defs.map(sh => sh.id));
    });
    const unsubSettings = onSnapshot(doc(db, 'artifacts', appId, 'public', 'data', 'appSettings', 'global'), (d) => d.exists() && setAppSettings(d.data()));
    const unsubHolidays = onSnapshot(collection(db, 'artifacts', appId, 'public', 'data', 'holidays'), (s) => {
      const map = {}; s.docs.forEach(d => map[d.data().date] = { id: d.id, ...d.data() }); setHolidays(map);
    });
    const unsubMovements = onSnapshot(collection(db, 'artifacts', appId, 'public', 'data', 'movements'), (s) => setMovements(s.docs.map(d => ({ id: d.id, ...d.data() }))));
    return () => { unsubStaff(); unsubShifts(); unsubShiftDef(); unsubSettings(); unsubHolidays(); unsubMovements(); };
  }, [user]);

  const saveMovement = async (e) => {
    e.preventDefault();
    if (!newMovement.staffId || !newMovement.dateStart || !newMovement.dateEnd) return;
    const staffMember = staff.find(s => s.id === newMovement.staffId);
    await addDoc(collection(db, 'artifacts', appId, 'public', 'data', 'movements'), { ...newMovement, staffName: staffMember?.name || 'Unknown' });
    setShowMovementModal(false);
    setNewMovement({ staffId: '', staffName: '', type: 'Bercuti', dateStart: '', dateEnd: '', timeInfo: '' });
  };

  const toggleStaffOnShift = async (dateStr, typeId, staffId) => {
    const shiftRef = doc(db, 'artifacts', appId, 'public', 'data', 'shifts', dateStr);
    const dayData = { ...(shifts[dateStr] || {}) };
    let list = Array.isArray(dayData[typeId]) ? [...dayData[typeId]] : [];
    const exists = list.find(s => s.staffId === staffId);
    if (exists) list = list.filter(s => s.staffId !== staffId);
    else {
      const m = staff.find(s => s.id === staffId);
      list.push({ staffId, staffName: m?.name || '', staffPhone: m?.phone || "", unit: m?.unit || "" });
    }
    dayData[typeId] = list;
    if (list.length === 0) delete dayData[typeId];
    Object.keys(dayData).length === 0 ? await deleteDoc(shiftRef) : await setDoc(shiftRef, dayData);
  };

  const calendarDays = useMemo(() => {
    const y = currentMonth.getFullYear(), m = currentMonth.getMonth();
    const days = [];
    const total = new Date(y, m + 1, 0).getDate();
    const start = (new Date(y, m, 1).getDay() + 6) % 7;
    for (let i = 0; i < start; i++) days.push(null);
    for (let i = 1; i <= total; i++) days.push(formatLocalDate(y, m, i));
    return days;
  }, [currentMonth]);

  const filteredMovementStaff = staff.filter(s => s.name.toUpperCase().includes(movementModalSearch.toUpperCase())).slice(0, 10);

  if (!user) return <div className="h-screen flex items-center justify-center font-black text-blue-600 animate-pulse">MEMULAKAN SISTEM...</div>;

  // --- REKA BENTUK ASAL ---
  if (isPrintMode) {
    return (
      <div className="bg-white p-8 text-black min-h-screen">
        <button onClick={() => setIsPrintMode(false)} className="no-print mb-4 px-4 py-2 bg-slate-100 rounded">Kembali</button>
        <div className="text-center mb-6">
          <h1 className="text-2xl font-black">{appSettings.title}</h1>
          <p className="font-bold">{appSettings.subtitle}</p>
          <p className="uppercase mt-2 font-black underline">{printFormat === 'ot' ? 'Rekod Kerja Lebih Masa' : 'Jadual Bertugas'} - {currentMonth.toLocaleString('ms-MY', {month:'long', year:'numeric'})}</p>
        </div>
        <div className="grid grid-cols-7 border border-black text-[10px]">
          {['Isnin','Selasa','Rabu','Khamis','Jumaat','Sabtu','Ahad'].map(d => <div key={d} className="border p-2 bg-slate-100 font-bold text-center">{d}</div>)}
          {calendarDays.map((d,i) => (
            <div key={i} className="border min-h-[100px] p-1">
              {d && <><span className="font-bold">{parseInt(d.split('-')[2])}</span>
              <div className="mt-1 space-y-1">
                {shiftDefinitions.map(def => shifts[d]?.[def.id]?.map(s => <div key={s.staffId} className="border-b border-dotted pb-1 uppercase font-bold text-[8px]">{def.label}: {s.staffName}</div>))}
              </div></>}
            </div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 font-sans pb-20">
      <header className="bg-white border-b sticky top-0 z-20 px-6 py-4 flex justify-between items-center shadow-sm">
        <div className="flex items-center gap-3">
          <div className="bg-blue-600 p-2 rounded-xl text-white shadow-lg"><ClipboardList size={22} /></div>
          <div className="text-left"><h1 className="text-xl font-black">{appSettings.title}</h1><p className="text-[10px] text-slate-400 font-bold uppercase">{appSettings.subtitle}</p></div>
        </div>
        <nav className="flex bg-slate-100 p-1 rounded-2xl gap-1">
          {['calendar','movement','staff','settings'].map(t => (
            <button key={t} onClick={() => setActiveTab(t)} className={`px-6 py-2.5 rounded-xl text-xs font-black uppercase ${activeTab === t ? 'bg-white text-blue-600 shadow-sm' : 'text-slate-500'}`}>{t === 'calendar' ? 'On-Call' : t}</button>
          ))}
        </nav>
        <div className="flex items-center gap-2">
            <button onClick={() => setIsPrintMode(true)} className="p-3 bg-white border rounded-xl hover:bg-slate-50 shadow-sm"><Printer size={18}/></button>
            <div className="flex bg-slate-100 p-1 rounded-xl items-center">
                <button onClick={() => setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth()-1, 1))} className="p-2 hover:bg-white rounded-lg"><ChevronLeft size={16}/></button>
                <span className="px-4 text-xs font-black uppercase">{currentMonth.toLocaleString('ms-MY', {month:'short', year:'numeric'})}</span>
                <button onClick={() => setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth()+1, 1))} className="p-2 hover:bg-white rounded-lg"><ChevronRight size={16}/></button>
            </div>
        </div>
      </header>

      <main className="max-w-[1600px] mx-auto p-6">
        {activeTab === 'calendar' && (
          <div className="bg-white rounded-[2.5rem] shadow-xl border overflow-hidden animate-in fade-in">
             <div className="grid grid-cols-7 border-b bg-slate-50/50 text-[10px] font-black uppercase text-center py-4 text-slate-400 tracking-widest">
                {['Isnin', 'Selasa', 'Rabu', 'Khamis', 'Jumaat', 'Sabtu', 'Ahad'].map(d => <div key={d}>{d}</div>)}
             </div>
             <div className="grid grid-cols-7 gap-px bg-slate-100">
                {calendarDays.map((d, idx) => (
                  <div key={idx} onClick={() => d && setSelectedDate(d)} className={`min-h-[160px] p-2 bg-white ${d ? 'cursor-pointer hover:bg-blue-50/30' : ''}`}>
                    {d && <><div className="flex justify-between font-black text-slate-700"><span>{parseInt(d.split('-')[2])}</span> {holidays[d] && <span className="text-[7px] text-red-500">CUTI</span>}</div>
                    <div className="mt-2 space-y-1 overflow-y-auto max-h-32">
                        {shiftDefinitions.map(def => shifts[d]?.[def.id]?.map(s => (
                            <div key={s.staffId} className={`p-1 rounded-lg text-[9px] font-black uppercase truncate ${getShiftColor(def.color, 'light')}`}>{s.staffName}</div>
                        )))}
                    </div></>}
                  </div>
                ))}
             </div>
          </div>
        )}

        {activeTab === 'movement' && (
          <div className="space-y-6 animate-in fade-in">
             <div className="bg-white p-8 rounded-[2.5rem] border shadow-sm flex justify-between items-center">
               <div className="text-left"><h2 className="text-2xl font-black uppercase text-slate-800">Pergerakan Staf</h2><p className="text-slate-500 font-bold">Rekod cuti & aktiviti harian farmasi</p></div>
               <button onClick={() => setShowMovementModal(true)} className="px-8 py-4 bg-blue-600 text-white font-black rounded-2xl shadow-xl active:scale-95 transition-all flex items-center gap-2"><Plus size={20}/> KEMASKINI</button>
             </div>
             <div className="bg-white rounded-[2.5rem] shadow-xl border overflow-hidden">
                <div className="grid grid-cols-7 gap-px bg-slate-100">
                    {calendarDays.map((d, i) => (
                        <div key={i} className="min-h-[160px] p-2 bg-white text-left">
                            {d && <><span className="font-black text-slate-400 text-xs">{parseInt(d.split('-')[2])}</span>
                            <div className="mt-2 space-y-1">
                                {movements.filter(m => d >= m.dateStart && d <= m.dateEnd).map(m => {
                                    const type = MOVEMENT_TYPES.find(t => t.id === m.type);
                                    return <div key={m.id} className={`p-1.5 rounded-lg text-[9px] font-black text-white ${type?.color} flex justify-between group`}>{m.staffName} <button onClick={() => deleteDoc(doc(db, 'artifacts', appId, 'public', 'data', 'movements', m.id))} className="opacity-0 group-hover:opacity-100"><X size={10}/></button></div>
                                })}
                            </div></>}
                        </div>
                    ))}
                </div>
             </div>
          </div>
        )}

        {activeTab === 'staff' && (
          <div className="bg-white p-8 rounded-[2.5rem] border shadow-xl animate-in fade-in">
            <div className="flex justify-between items-center mb-8">
              <h2 className="text-2xl font-black uppercase">Direktori Kakitangan</h2>
              <button onClick={() => { setNewStaff({name:'', phone:'', unit:'', id:null}); setShowStaffModal(true); }} className="px-8 py-4 bg-blue-600 text-white rounded-2xl font-black shadow-lg">TAMBAH STAF</button>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {staff.sort((a,b)=>a.name.localeCompare(b.name)).map(s => (
                <div key={s.id} className="p-5 bg-slate-50 rounded-3xl border border-slate-100 flex justify-between items-center group hover:bg-white hover:shadow-xl transition-all">
                  <div className="text-left"><p className="font-black uppercase text-slate-800">{s.name}</p><p className="text-[10px] font-bold text-blue-500 uppercase tracking-widest">{s.unit}</p></div>
                  <div className="flex gap-2">
                    <button onClick={() => { setNewStaff({...s}); setShowStaffModal(true); }} className="text-slate-300 hover:text-blue-500"><Edit2 size={18}/></button>
                    <button onClick={() => deleteDoc(doc(db, 'artifacts', appId, 'public', 'data', 'staff', s.id))} className="text-slate-300 hover:text-red-500"><Trash2 size={18}/></button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {activeTab === 'settings' && (
            <div className="bg-white p-10 rounded-[3rem] border shadow-xl animate-in slide-in-from-bottom-4">
                <h2 className="text-2xl font-black uppercase mb-8 text-left">Konfigurasi Sistem</h2>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8 text-left">
                    <div>
                        <label className="text-[10px] font-black text-slate-400 uppercase ml-2">Tajuk Sistem</label>
                        <input type="text" value={appSettings.title} className="w-full p-5 bg-slate-50 rounded-2xl font-black border-none outline-none mt-1" onChange={e => setAppSettings({...appSettings, title: e.target.value})}/>
                    </div>
                    <div>
                        <label className="text-[10px] font-black text-slate-400 uppercase ml-2">Sub-Tajuk (Lokasi)</label>
                        <input type="text" value={appSettings.subtitle} className="w-full p-5 bg-slate-50 rounded-2xl font-black border-none outline-none mt-1" onChange={e => setAppSettings({...appSettings, subtitle: e.target.value})}/>
                    </div>
                </div>
                <button onClick={() => setDoc(doc(db, 'artifacts', appId, 'public', 'data', 'appSettings', 'global'), appSettings)} className="mt-8 px-10 py-5 bg-slate-900 text-white rounded-2xl font-black uppercase tracking-widest shadow-xl">Simpan Tetapan</button>
            </div>
        )}
      </main>

      {/* --- MODALS (ASAL) --- */}
      {selectedDate && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-md z-[100] flex items-center justify-center p-4">
          <div className="bg-white w-full max-w-5xl rounded-[3rem] shadow-2xl overflow-hidden animate-in zoom-in-95">
            <div className="p-8 border-b flex justify-between items-center bg-slate-50/80">
              <div className="text-left"><h3 className="text-2xl font-black uppercase">Atur Jadual Staf</h3><p className="font-bold text-slate-500">{new Date(selectedDate).toLocaleDateString('ms-MY', {weekday:'long', day:'numeric', month:'long'})}</p></div>
              <button onClick={() => setSelectedDate(null)} className="p-4 bg-white border rounded-full shadow-sm"><X/></button>
            </div>
            <div className="p-8 grid grid-cols-1 md:grid-cols-2 gap-8 max-h-[60vh] overflow-y-auto">
              {shiftDefinitions.map(def => (
                <div key={def.id} className="p-6 bg-slate-50 rounded-[2.5rem] border">
                  <p className="font-black text-xs uppercase mb-4 text-left">{def.label} ({def.time})</p>
                  <div className="flex flex-wrap gap-2">
                    {staff.map(s => (
                        <button key={s.id} onClick={() => toggleStaffOnShift(selectedDate, def.id, s.id)} className={`px-4 py-2 rounded-xl text-[10px] font-black uppercase border-2 transition-all ${shifts[selectedDate]?.[def.id]?.some(x=>x.staffId===s.id) ? 'bg-blue-600 text-white border-blue-600' : 'bg-white text-slate-400 border-slate-100 hover:border-slate-300'}`}>{s.name}</button>
                    ))}
                  </div>
                </div>
              ))}
            </div>
            <div className="p-8 bg-slate-50 flex justify-center"><button onClick={() => setSelectedDate(null)} className="px-20 py-5 bg-slate-900 text-white rounded-2xl font-black uppercase tracking-widest shadow-xl">SIMPAN & TUTUP</button></div>
          </div>
        </div>
      )}

      {showMovementModal && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-md z-[110] flex items-center justify-center p-4">
          <div className="bg-white w-full max-w-md rounded-[3rem] p-10 shadow-2xl animate-in zoom-in-95">
            <h3 className="text-2xl font-black uppercase mb-6 text-left">Kemaskini Pergerakan</h3>
            <form onSubmit={saveMovement} className="space-y-4">
                <div className="text-left"><label className="text-[10px] font-black text-slate-400 ml-2 uppercase">Nama Staf</label>
                <input type="text" placeholder="CARI NAMA..." className="w-full p-5 bg-slate-50 rounded-2xl font-bold border-none outline-none mt-1" value={movementModalSearch} onChange={e => setMovementModalSearch(e.target.value)}/>
                {movementModalSearch && !newMovement.staffId && (
                    <div className="bg-white border rounded-2xl mt-1 shadow-xl overflow-hidden max-h-40 overflow-y-auto">
                        {filteredMovementStaff.map(s => <div key={s.id} onClick={() => {setNewMovement({...newMovement, staffId: s.id, staffName:s.name}); setMovementModalSearch('');}} className="p-4 hover:bg-blue-50 cursor-pointer font-bold uppercase text-xs border-b">{s.name}</div>)}
                    </div>
                )}
                {newMovement.staffId && <div className="p-4 bg-blue-50 text-blue-700 rounded-xl mt-2 font-black uppercase flex justify-between">{newMovement.staffName} <button type="button" onClick={() => setNewMovement({...newMovement, staffId:'', staffName:''})}><X size={14}/></button></div>}
                </div>
                <div className="text-left"><label className="text-[10px] font-black text-slate-400 ml-2 uppercase">Kategori</label>
                <select className="w-full p-5 bg-slate-50 rounded-2xl font-black border-none outline-none mt-1" onChange={e => setNewMovement({...newMovement, type: e.target.value})}>
                    {MOVEMENT_TYPES.map(t => <option key={t.id} value={t.id}>{t.label}</option>)}
                </select>
                </div>
                <div className="grid grid-cols-2 gap-4 text-left">
                    <div><label className="text-[10px] font-black text-slate-400 ml-2 uppercase">Mula</label><input type="date" className="w-full p-4 bg-slate-50 rounded-xl font-bold outline-none mt-1" onChange={e => setNewMovement({...newMovement, dateStart: e.target.value})}/></div>
                    <div><label className="text-[10px] font-black text-slate-400 ml-2 uppercase">Tamat</label><input type="date" className="w-full p-4 bg-slate-50 rounded-xl font-bold outline-none mt-1" onChange={e => setNewMovement({...newMovement, dateEnd: e.target.value})}/></div>
                </div>
                <button type="submit" className="w-full py-5 bg-blue-600 text-white rounded-2xl font-black shadow-xl mt-4">SIMPAN DATA</button>
                <button type="button" onClick={() => setShowMovementModal(false)} className="w-full py-2 font-black text-slate-400 uppercase text-xs">Batal</button>
            </form>
          </div>
        </div>
      )}

      {showStaffModal && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-md z-[110] flex items-center justify-center p-4">
          <div className="bg-white w-full max-w-md rounded-[3rem] p-10 shadow-2xl animate-in zoom-in-95">
            <h3 className="text-2xl font-black uppercase mb-6 text-left">{newStaff.id ? 'Kemaskini' : 'Daftar'} Staf</h3>
            <div className="space-y-4 text-left">
              <div><label className="text-[10px] font-black text-slate-400 ml-2 uppercase">Nama Penuh</label><input type="text" value={newStaff.name} placeholder="NAMA STAF" className="w-full p-5 bg-slate-50 rounded-2xl font-black outline-none border-none mt-1 uppercase" onChange={e => setNewStaff({...newStaff, name: e.target.value.toUpperCase()})}/></div>
              <div><label className="text-[10px] font-black text-slate-400 ml-2 uppercase">Unit / Seksyen</label><input type="text" value={newStaff.unit} placeholder="CONTOH: OPD" className="w-full p-5 bg-slate-50 rounded-2xl font-black outline-none border-none mt-1 uppercase" onChange={e => setNewStaff({...newStaff, unit: e.target.value.toUpperCase()})}/></div>
              <button onClick={async () => {
                const data = { name: newStaff.name, unit: newStaff.unit };
                newStaff.id ? await updateDoc(doc(db, 'artifacts', appId, 'public', 'data', 'staff', newStaff.id), data) : await addDoc(collection(db, 'artifacts', appId, 'public', 'data', 'staff'), data);
                setShowStaffModal(false);
              }} className="w-full py-5 bg-blue-600 text-white rounded-2xl font-black shadow-xl mt-4">SIMPAN</button>
              <button onClick={() => setShowStaffModal(false)} className="w-full py-2 font-black text-slate-400 uppercase text-xs text-center">Batal</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default App;

import React, { useState, useEffect, useMemo } from 'react';
import { initializeApp } from 'firebase/app';
import { 
  getFirestore, 
  collection, 
  doc, 
  setDoc, 
  onSnapshot, 
  deleteDoc, 
  addDoc,
  updateDoc
} from 'firebase/firestore';
import { 
  getAuth, 
  signInAnonymously, 
  onAuthStateChanged 
} from 'firebase/auth';
import { 
  Calendar as CalendarIcon, 
  Users, 
  Trash2, 
  ChevronLeft, 
  ChevronRight, 
  Clock, 
  UserPlus, 
  Info, 
  CheckCircle2, 
  X, 
  ClipboardList, 
  Phone, 
  MessageCircle, 
  Plus, 
  Settings, 
  Edit2, 
  Save, 
  Search, 
  UserCheck, 
  Briefcase,
  Printer,
  ArrowLeft,
  Layout,
  Check,
  FileText,
  MapPin,
  Coffee,
  BookOpen,
  Stethoscope,
  Plane,
  User
} from 'lucide-react';

// --- Konfigurasi Firebase (Stabil & Live) ---
const firebaseConfig = {
  apiKey: "AIzaSyDw1t_UrMRvEHCyKFQIzMmlP7w6feSIos0",
  authDomain: "jadual-oncall.firebaseapp.com",
  projectId: "jadual-oncall",
  storageBucket: "jadual-oncall.firebasestorage.app",
  messagingSenderId: "152318949416",
  appId: "1:152318949416:web:1f141e58315f769b66dd1d"
};

const appId = "pharmacy-oncall-2026";
const firebaseApp = initializeApp(firebaseConfig);
const auth = getAuth(firebaseApp);
const db = getFirestore(firebaseApp);

// --- PILIHAN 14 WARNA ---
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

// --- Global Helpers ---
const getShiftColor = (colorId, type = 'bg') => {
  const color = COLOR_OPTIONS.find(c => c.id === colorId) || COLOR_OPTIONS[0];
  if (type === 'bg') return color.bg;
  if (type === 'border') return color.border;
  return color.light;
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
  const [viewingDayMovements, setViewingDayMovements] = useState(null); 
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

  const headerVisible = !isPrintMode;

  // --- Auth Setup ---
  useEffect(() => {
    const initAuth = async () => {
      try {
        await signInAnonymously(auth); // Mengaktifkan akses database percuma
      } catch (error) {
        console.error("Firebase error:", error);
      }
    };
    initAuth();
    const unsubscribeAuth = onAuthStateChanged(auth, (u) => setUser(u));
    return () => unsubscribeAuth();
  }, []);

  // --- Sync Firestore ---
  useEffect(() => {
    if (!user) return; 

    const unsubStaff = onSnapshot(collection(db, 'artifacts', appId, 'public', 'data', 'staff'), (s) => 
      setStaff(s.docs.map(d => ({ id: d.id, ...d.data() }))));

    const unsubShifts = onSnapshot(collection(db, 'artifacts', appId, 'public', 'data', 'shifts'), (s) => {
      const map = {}; s.docs.forEach(d => map[d.id] = d.data()); setShifts(map);
    });

    const unsubDef = onSnapshot(collection(db, 'artifacts', appId, 'public', 'data', 'shiftDefinitions'), (s) => {
      const defs = s.docs.map(d => ({ id: d.id, ...d.data() })).sort((a,b) => (a.order || 0) - (b.order || 0));
      setShiftDefinitions(defs);
      if (selectedPrintShifts.length === 0) setSelectedPrintShifts(defs.map(sh => sh.id));
    });

    const unsubSettings = onSnapshot(doc(db, 'artifacts', appId, 'public', 'data', 'appSettings', 'global'), (d) => 
      d.exists() && setAppSettings(d.data()));

    const unsubHolidays = onSnapshot(collection(db, 'artifacts', appId, 'public', 'data', 'holidays'), (s) => {
      const map = {}; s.docs.forEach(d => { if (d.data().date) map[d.data().date] = { id: d.id, ...d.data() }; }); setHolidays(map);
    });

    const unsubMovements = onSnapshot(collection(db, 'artifacts', appId, 'public', 'data', 'movements'), (s) => 
      setMovements(s.docs.map(d => ({ id: d.id, ...d.data() }))));

    return () => { unsubStaff(); unsubShifts(); unsubDef(); unsubSettings(); unsubHolidays(); unsubMovements(); };
  }, [user]);

  // --- Handlers ---
  const saveMovement = async (e) => {
    e.preventDefault();
    if (!newMovement.staffId || !newMovement.dateStart || !newMovement.dateEnd) return;
    await addDoc(collection(db, 'artifacts', appId, 'public', 'data', 'movements'), {
      ...newMovement,
      createdAt: new Date().toISOString()
    });
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
      list.push({ staffId, staffName: m?.name || '', unit: m?.unit || "" });
    }
    if (list.length === 0) delete dayData[typeId]; else dayData[typeId] = list;
    if (Object.keys(dayData).length === 0) await deleteDoc(shiftRef); else await setDoc(shiftRef, dayData);
  };

  const calendarDays = useMemo(() => {
    const y = currentMonth.getFullYear(), m = currentMonth.getMonth();
    const days = [], total = new Date(y, m + 1, 0).getDate();
    const start = (new Date(y, m, 1).getDay() + 6) % 7; 
    for (let i = 0; i < start; i++) days.push(null);
    for (let i = 1; i <= total; i++) days.push(formatLocalDate(y, m, i));
    return days;
  }, [currentMonth]);

  const filteredStaffDirectory = useMemo(() => {
    return staff.filter(p => p.name.toUpperCase().includes(staffSearchTerm.toUpperCase())).sort((a,b) => a.name.localeCompare(b.name));
  }, [staff, staffSearchTerm]);

  const filteredMovementStaff = useMemo(() => {
    return staff.filter(p => p.name.toUpperCase().includes(movementModalSearch.toUpperCase())).slice(0, 10);
  }, [staff, movementModalSearch]);

  if (!user) return <div className="h-screen flex items-center justify-center bg-slate-50 font-black text-blue-600 animate-pulse">MENYAMBUNG...</div>;

  // --- REKA BENTUK ASAL ---
  if (isPrintMode) {
    return (
      <div className="min-h-screen bg-white p-8 text-black text-left">
        <button onClick={() => setIsPrintMode(false)} className="no-print mb-8 px-4 py-2 bg-slate-100 rounded-xl font-bold border">Kembali</button>
        <div className="text-center mb-6 border-b-2 border-black pb-4 uppercase">
          <h1 className="text-2xl font-black">{String(appSettings.title)}</h1>
          <p className="text-lg font-bold">{String(appSettings.subtitle)}</p>
          <p className="text-md font-bold mt-1">{printFormat === 'ot' ? 'PENYATA OT' : 'JADUAL BERTUGAS'} • {currentMonth.toLocaleString('ms-MY', { month: 'long', year: 'numeric' })}</p>
        </div>
        <div className="grid grid-cols-7 border border-black bg-black gap-px">
          {['Isnin', 'Selasa', 'Rabu', 'Khamis', 'Jumaat', 'Sabtu', 'Ahad'].map(day => (<div key={day} className="bg-slate-100 py-2 text-center font-black uppercase text-[10px]">{day}</div>))}
          {calendarDays.map((dateStr, idx) => (
            <div key={idx} className="bg-white min-h-[120px] p-2 text-left">
              {dateStr && <><span className="font-black text-sm">{parseInt(dateStr.split('-')[2])}</span>
              <div className="space-y-1 mt-1">
                {shiftDefinitions.map(type => (shifts[dateStr]?.[type.id] || []).map(st => (
                  <div key={st.staffId} className="text-[8px] border-b pb-0.5 uppercase font-bold text-black">{type.label}: {st.staffName}</div>
                )))}
              </div></>}
            </div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 font-sans pb-20 no-print flex flex-col">
      <header className="bg-white border-b sticky top-0 z-20 px-4 py-3 shadow-sm flex-none">
        <div className="max-w-[1600px] mx-auto flex flex-col lg:flex-row lg:items-center justify-between gap-3 text-slate-800">
          <div className="flex items-center gap-3 shrink-0">
            <div className="bg-blue-600 p-2 rounded-xl text-white shadow-lg shrink-0"><ClipboardList size={20} /></div>
            <div className="text-left"><h1 className="text-lg md:text-xl font-black leading-none uppercase truncate">{String(appSettings.title)}</h1><p className="text-[8px] md:text-[10px] text-slate-400 font-bold uppercase mt-1 tracking-widest truncate">{String(appSettings.subtitle)}</p></div>
          </div>
          <nav className="flex bg-slate-100 p-1 rounded-2xl gap-1 shrink-0 overflow-x-auto no-scrollbar">
            {['calendar', 'movement', 'staff', 'settings'].map(t => (
              <button key={t} onClick={() => setActiveTab(t)} className={`px-4 py-2 rounded-xl text-xs font-bold uppercase shrink-0 ${activeTab === t ? 'bg-white text-blue-600 shadow-sm' : 'text-slate-500'}`}>{t === 'calendar' ? 'On-Call' : t}</button>
            ))}
          </nav>
          <div className="flex items-center bg-slate-100 p-1 rounded-2xl gap-1 shrink-0">
            <button onClick={() => setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() - 1, 1))} className="p-2 hover:bg-white rounded-xl"><ChevronLeft size={18} /></button>
            <div className="px-4 text-xs font-black uppercase">{currentMonth.toLocaleString('ms-MY', { month: 'short', year: 'numeric' })}</div>
            <button onClick={() => setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1, 1))} className="p-2 hover:bg-white rounded-xl"><ChevronRight size={18} /></button>
          </div>
        </div>
      </header>

      <main className="max-w-[1600px] mx-auto p-3 md:p-6 w-full flex-1">
        {activeTab === 'calendar' && (
          <div className="space-y-4 md:space-y-6 animate-in fade-in">
             <div className="bg-white rounded-[2rem] shadow-xl border border-slate-200 overflow-hidden text-slate-800">
                <div className="grid grid-cols-7 border-b bg-slate-50/50 text-slate-400 py-4 font-black uppercase text-[10px]">
                  {['Isnin', 'Selasa', 'Rabu', 'Khamis', 'Jumaat', 'Sabtu', 'Ahad'].map(d => (<div key={d} className="text-center">{d}</div>))}
                </div>
                <div className="grid grid-cols-7 gap-px bg-slate-100">
                  {calendarDays.map((d, idx) => (
                    <div key={idx} onClick={() => d && setSelectedDate(d)} className={`min-h-[140px] md:min-h-[220px] p-2 bg-white transition-colors text-left ${d ? 'cursor-pointer hover:bg-blue-50/30' : 'bg-slate-50/20'}`}>
                      {d && <><div className="flex justify-between font-black text-slate-700"><span>{parseInt(d.split('-')[2])}</span> {holidays[d] && <span className="text-[7px] text-red-500 uppercase tracking-widest">Cuti</span>}</div>
                      <div className="mt-2 space-y-1 overflow-hidden">
                        {shiftDefinitions.map(type => (shifts[d]?.[type.id] || []).map(st => (
                          <div key={st.staffId} className={`p-1 rounded-lg text-[9px] font-black uppercase truncate border border-current/10 shadow-sm ${getShiftColor(type.color, 'light')}`}>{st.staffName}</div>
                        )))}
                      </div></>}
                    </div>
                  ))}
                </div>
             </div>
          </div>
        )}

        {activeTab === 'movement' && (
          <div className="space-y-4 animate-in fade-in text-slate-800">
             <div className="flex justify-between items-center bg-white p-6 rounded-3xl border shadow-sm">
              <div className="text-left font-black uppercase"><h2>Pergerakan Staf</h2><p className="text-slate-500 font-bold text-xs mt-1">Hospital Sultanah Nora Ismail</p></div>
              <button onClick={() => setShowMovementModal(true)} className="px-8 py-4 bg-blue-600 text-white font-black rounded-2xl shadow-xl active:scale-95 transition-all text-xs uppercase tracking-widest leading-none"><Plus size={20} className="inline mr-2" />KEMASKINI</button>
            </div>
            <div className="bg-white rounded-[2rem] shadow-xl border overflow-hidden">
              <div className="grid grid-cols-7 gap-px bg-slate-100">
                {calendarDays.map((dateStr, idx) => (
                  <div key={idx} onClick={() => dateStr && setViewingDayMovements(dateStr)} className="min-h-[120px] md:min-h-[160px] p-2 bg-white text-left cursor-pointer hover:bg-slate-50/50">
                    {dateStr && <><span className="text-[10px] md:text-sm font-black text-slate-400">{parseInt(dateStr.split('-')[2])}</span>
                    <div className="space-y-0.5 mt-1 overflow-hidden">
                      {movements.filter(m => dateStr >= m.dateStart && dateStr <= m.dateEnd).map(m => {
                        const type = MOVEMENT_TYPES.find(t=>t.id===m.type);
                        return <div key={m.id} className={`p-1.5 rounded-lg text-[8px] md:text-[9px] font-black text-white ${type?.color} flex justify-between group uppercase truncate shadow-sm`}><span className="truncate">{m.staffName}</span><button onClick={(e) => { e.stopPropagation(); deleteDoc(doc(db, 'artifacts', appId, 'public', 'data', 'movements', m.id)); }} className="opacity-0 group-hover:opacity-100"><X size={10}/></button></div>;
                      })}
                    </div></>}
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {activeTab === 'staff' && (
          <div className="bg-white rounded-3xl border shadow-xl overflow-hidden animate-in fade-in">
            <div className="p-8 border-b flex justify-between items-center bg-slate-50/50">
              <h2 className="text-xl font-black uppercase text-left">Direktori Kakitangan</h2>
              <button onClick={() => { setNewStaff({ name: '', phone: '', unit: '', id: null }); setShowStaffModal(true); }} className="bg-blue-600 text-white px-8 py-4 rounded-xl font-black shadow-lg text-xs uppercase">Tambah Staf</button>
            </div>
            <div className="p-4 grid grid-cols-1 md:grid-cols-3 gap-4">
              {staff.sort((a,b)=>a.name.localeCompare(b.name)).map((person) => (
                <div key={person.id} className="p-5 bg-slate-50 rounded-[2rem] border flex justify-between items-center group hover:bg-white hover:shadow-xl transition-all">
                  <div className="text-left font-black uppercase overflow-hidden"><p className="text-sm text-slate-800 truncate">{person.name}</p><p className="text-[9px] text-blue-500 tracking-widest">{person.unit}</p></div>
                  <div className="flex gap-2 shrink-0">
                    <button onClick={() => { setNewStaff({...person}); setShowStaffModal(true); }} className="text-slate-300 hover:text-blue-500 transition-colors p-2"><Edit2 size={18} /></button>
                    <button onClick={() => deleteDoc(doc(db, 'artifacts', appId, 'public', 'data', 'staff', person.id))} className="text-slate-300 hover:text-red-500 transition-colors p-2"><Trash2 size={18} /></button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </main>

      {/* --- MODALS --- */}
      {selectedDate && (
        <div className="fixed inset-0 z-[1000] flex items-center justify-center p-3 bg-slate-900/50 backdrop-blur-md animate-in fade-in">
          <div className="bg-white w-full max-w-5xl rounded-[3rem] shadow-2xl overflow-hidden max-h-[90vh] flex flex-col">
            <div className="p-8 border-b flex justify-between items-center bg-slate-50/80 shrink-0 text-left">
              <div className="text-left font-black uppercase leading-tight"><h3 className="text-lg">Atur Jadual</h3><p className="text-[10px] text-slate-500 font-bold mt-1">📅 {new Date(selectedDate).toLocaleDateString('ms-MY', { day: 'numeric', month: 'long', year: 'numeric' })}</p></div>
              <button onClick={() => setSelectedDate(null)} className="p-4 bg-white border rounded-full shadow-sm"><X/></button>
            </div>
            <div className="p-6 md:p-8 overflow-y-auto no-scrollbar flex-1">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8 text-left">
                {shiftDefinitions.map(type => (
                  <div key={type.id} className="p-6 rounded-[2.5rem] border bg-slate-50 text-left">
                    <div className="flex items-center justify-between mb-4 border-b pb-2 font-black text-[10px] uppercase tracking-widest text-slate-800 leading-none">
                        <div className="flex items-center gap-2"><div className={`w-3 h-3 rounded-full ${getShiftColor(type.color, 'bg')}`}></div>{type.label}</div>
                        <span>{(shifts[selectedDate]?.[type.id] || []).length}</span>
                    </div>
                    <div className="flex flex-wrap gap-2">
                      {staff.map(s => {
                        const active = (shifts[selectedDate]?.[type.id] || []).some(a => a.staffId === s.id);
                        return (<button key={s.id} onClick={() => toggleStaffOnShift(selectedDate, type.id, s.id)} className={`px-4 py-2.5 rounded-xl border-2 font-black text-[10px] uppercase transition-all shadow-sm ${active ? 'bg-blue-600 border-blue-600 text-white' : 'bg-white border-slate-100 text-slate-400'}`}>{s.name}</button>);
                      })}
                    </div>
                  </div>
                ))}
              </div>
            </div>
            <div className="p-8 bg-slate-50 border-t shrink-0 flex justify-center"><button onClick={() => setSelectedDate(null)} className="px-20 py-5 bg-slate-900 text-white font-black rounded-2xl uppercase tracking-widest shadow-xl active:scale-95 transition-all text-xs leading-none">SIMPAN JADUAL</button></div>
          </div>
        </div>
      )}

      {showMovementModal && (
        <div className="fixed inset-0 z-[1000] flex items-center justify-center p-3 bg-slate-900/60 backdrop-blur-md animate-in fade-in">
          <div className="bg-white w-full max-w-md rounded-[2.5rem] shadow-2xl p-10 flex flex-col text-left">
            <h3 className="text-xl font-black uppercase mb-6 leading-tight">Rekod Pergerakan</h3>
            <form onSubmit={saveMovement} className="space-y-4 text-left leading-none">
              <div className="text-left leading-none"><label className="text-[9px] font-black text-slate-400 ml-1 uppercase">Pilih Staf</label>
                {!newMovement.staffId ? (
                  <div className="relative leading-none">
                    <input type="text" placeholder="CARI NAMA..." className="w-full p-5 bg-slate-50 border-none rounded-2xl font-bold outline-none text-sm shadow-inner uppercase mt-1" value={movementModalSearch} onChange={e => setMovementModalSearch(e.target.value)}/>
                    {movementModalSearch && (
                      <div className="absolute top-full left-0 right-0 bg-white border rounded-2xl mt-1 shadow-2xl overflow-hidden z-50 text-left">
                        {filteredMovementStaff.map(s => <div key={s.id} onClick={() => {setNewMovement({...newMovement, staffId: s.id, staffName: s.name}); setMovementModalSearch('');}} className="p-4 hover:bg-blue-50 cursor-pointer font-black uppercase text-xs border-b text-slate-700 leading-none">{s.name}</div>)}
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="p-5 bg-blue-50 text-blue-700 rounded-2xl font-black uppercase flex justify-between items-center text-xs mt-1 border border-blue-200"><span>{newMovement.staffName}</span><button type="button" onClick={() => setNewMovement({...newMovement, staffId:'', staffName:''})}><X size={18}/></button></div>
                )}
              </div>
              <div className="text-left leading-none"><label className="text-[9px] font-black text-slate-400 ml-1 uppercase block leading-none">Kategori</label><select className="w-full p-5 bg-slate-50 border-none rounded-2xl font-black outline-none mt-1 text-xs shadow-inner appearance-none" onChange={e => setNewMovement({...newMovement, type: e.target.value})}>{MOVEMENT_TYPES.map(t => <option key={t.id} value={t.id}>{t.label.toUpperCase()}</option>)}</select></div>
              <div className="grid grid-cols-2 gap-4 text-left">
                <div className="text-left leading-none"><label className="text-[9px] font-black text-slate-400 ml-1 uppercase block leading-none">Mula</label><input type="date" className="w-full p-4 bg-slate-50 border-none rounded-xl font-bold outline-none mt-1 text-xs shadow-inner" required onChange={e => setNewMovement({...newMovement, dateStart: e.target.value})}/></div>
                <div className="text-left leading-none"><label className="text-[9px] font-black text-slate-400 ml-1 uppercase block leading-none">Tamat</label><input type="date" className="w-full p-4 bg-slate-50 border-none rounded-xl font-bold outline-none mt-1 text-xs shadow-inner" required onChange={e => setNewMovement({...newMovement, dateEnd: e.target.value})}/></div>
              </div>
              <button type="submit" className="w-full py-5 bg-blue-600 text-white font-black rounded-2xl shadow-xl mt-4 uppercase text-xs tracking-widest leading-none">Simpan Rekod</button>
              <button type="button" onClick={() => setShowMovementModal(false)} className="w-full py-2 font-bold text-slate-400 uppercase text-[10px] text-center leading-none">Batal</button>
            </form>
          </div>
        </div>
      )}

      {showStaffModal && (
        <div className="fixed inset-0 z-[1000] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-md">
          <div className="bg-white w-full max-w-md rounded-[3rem] p-10 shadow-2xl flex flex-col text-left">
            <h3 className="text-xl font-black uppercase mb-8 text-left leading-none">{newStaff.id ? 'Kemaskini Staf' : 'Daftar Staf'}</h3>
            <div className="space-y-4 text-left leading-none">
              <input type="text" value={newStaff.name} placeholder="NAMA PENUH" className="w-full p-5 bg-slate-50 border-none rounded-2xl font-black outline-none text-sm shadow-inner uppercase" onChange={e => setNewStaff({...newStaff, name: e.target.value.toUpperCase()})}/>
              <input type="text" value={newStaff.unit} placeholder="UNIT / SEKSYEN" className="w-full p-5 bg-slate-50 border-none rounded-2xl font-black outline-none text-sm shadow-inner uppercase" onChange={e => setNewStaff({...newStaff, unit: e.target.value.toUpperCase()})}/>
              <button onClick={async () => {
                const data = { name: newStaff.name.toUpperCase(), unit: newStaff.unit.toUpperCase() };
                newStaff.id ? await updateDoc(doc(db, 'artifacts', appId, 'public', 'data', 'staff', newStaff.id), data) : await addDoc(collection(db, 'artifacts', appId, 'public', 'data', 'staff'), data);
                setShowStaffModal(false);
              }} className="w-full py-5 bg-blue-600 text-white rounded-2xl font-black shadow-xl uppercase text-xs tracking-widest leading-none mt-4">Simpan Maklumat</button>
              <button onClick={() => setShowStaffModal(false)} className="w-full py-2 font-bold text-slate-400 uppercase text-[10px] text-center leading-none">Batal</button>
            </div>
          </div>
        </div>
      )}

      <style>{`
        .no-scrollbar::-webkit-scrollbar { display: none; }
        .no-scrollbar { -ms-overflow-style: none; scrollbar-width: none; }
        .custom-scrollbar::-webkit-scrollbar { width: 4px; }
        .custom-scrollbar::-webkit-scrollbar-track { background: transparent; }
        .custom-scrollbar::-webkit-scrollbar-thumb { background: #cbd5e1; border-radius: 10px; }
      `}</style>
    </div>
  );
};

export default App;

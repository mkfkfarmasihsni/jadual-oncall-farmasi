import React, { useState, useEffect, useMemo } from 'react';
import { initializeApp, getApps, getApp } from 'firebase/app';
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

// --- PEMBETULAN: Pengendalian Konfigurasi yang Lebih Selamat ---
const getFirebaseConfig = () => {
  const defaultValues = {
    apiKey: "AIzaSyDw1t_UrMRvEHCyKFQIzMmlP7w6feSIos0",
    authDomain: "jadual-oncall.firebaseapp.com",
    projectId: "jadual-oncall",
    storageBucket: "jadual-oncall.firebasestorage.app",
    messagingSenderId: "152318949416",
    appId: "1:152318949416:web:1f141e58315f769b66dd1d"
  };

  try {
    // Cuba baca dari Environment Variables Vercel dahulu
    if (typeof process !== 'undefined' && process.env && process.env.REACT_APP_FIREBASE_CONFIG) {
      return { ...defaultValues, ...JSON.parse(process.env.REACT_APP_FIREBASE_CONFIG) };
    }
  } catch (e) {
    console.warn("Gagal parse environment variable, menggunakan fallback.");
  }
  return defaultValues;
};

const firebaseConfig = getFirebaseConfig();
const appId = "pharmacy-oncall-2026";

// PEMBETULAN: Elakkan inisialisasi berganda yang menyebabkan ralat build
const firebaseApp = getApps().length > 0 ? getApp() : initializeApp(firebaseConfig);
const auth = getAuth(firebaseApp);
const db = getFirestore(firebaseApp);

// --- SEMUA DATA & PILIHAN WARNA ASAL (TIDAK DIUBAH) ---
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
  const [statusMsg, setStatusMsg] = useState(null);

  const headerVisible = !isPrintMode;

  useEffect(() => {
    signInAnonymously(auth).catch(err => console.error("Ralat Auth:", err));
    const unsubscribeAuth = onAuthStateChanged(auth, (u) => setUser(u));
    return () => unsubscribeAuth();
  }, []);

  useEffect(() => {
    if (!user) return; 

    const unsubStaff = onSnapshot(collection(db, 'artifacts', appId, 'public', 'data', 'staff'), (snapshot) => {
      setStaff(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
    });

    const unsubShifts = onSnapshot(collection(db, 'artifacts', appId, 'public', 'data', 'shifts'), (snapshot) => {
      const shiftMap = {};
      snapshot.docs.forEach(doc => { shiftMap[doc.id] = doc.data(); });
      setShifts(shiftMap);
    });

    const unsubShiftDef = onSnapshot(collection(db, 'artifacts', appId, 'public', 'data', 'shiftDefinitions'), (snapshot) => {
      let defs = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      const sorted = defs.sort((a,b) => (a.order || 0) - (b.order || 0));
      setShiftDefinitions(sorted);
      if (selectedPrintShifts.length === 0) setSelectedPrintShifts(sorted.map(sh => sh.id));
    });

    const unsubSettings = onSnapshot(doc(db, 'artifacts', appId, 'public', 'data', 'appSettings', 'global'), (docSnap) => {
      if (docSnap.exists()) setAppSettings(docSnap.data());
    });

    const unsubHolidays = onSnapshot(collection(db, 'artifacts', appId, 'public', 'data', 'holidays'), (snapshot) => {
      const holidayMap = {};
      snapshot.docs.forEach(doc => { 
        const data = doc.data();
        if (data.date) holidayMap[data.date] = { id: doc.id, ...data }; 
      });
      setHolidays(holidayMap);
    });

    const unsubMovements = onSnapshot(collection(db, 'artifacts', appId, 'public', 'data', 'movements'), (snapshot) => {
      setMovements(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
    });

    return () => {
      unsubStaff(); unsubShifts(); unsubShiftDef(); unsubSettings(); unsubHolidays(); unsubMovements();
    };
  }, [user]);

  // --- Handlers & Memos ---
  const saveMovement = async (e) => {
    e.preventDefault();
    if (!user || !newMovement.staffId || !newMovement.dateStart || !newMovement.dateEnd) return;
    const staffMember = staff.find(s => s.id === newMovement.staffId);
    await addDoc(collection(db, 'artifacts', appId, 'public', 'data', 'movements'), {
      ...newMovement,
      staffName: staffMember?.name || 'Unknown',
      createdAt: new Date().toISOString()
    });
    setShowMovementModal(false);
    setNewMovement({ staffId: '', staffName: '', type: 'Bercuti', dateStart: '', dateEnd: '', timeInfo: '' });
  };

  const toggleStaffOnShift = async (dateStr, typeId, staffId) => {
    if (!user) return;
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
    const year = currentMonth.getFullYear(), month = currentMonth.getMonth();
    const days = [], totalDays = new Date(year, month + 1, 0).getDate();
    const startDay = (new Date(year, month, 1).getDay() + 6) % 7; 
    for (let i = 0; i < startDay; i++) days.push(null);
    for (let i = 1; i <= totalDays; i++) days.push(formatLocalDate(year, month, i));
    return days;
  }, [currentMonth]);

  const filteredStaffDirectory = useMemo(() => {
    return staff.filter(p => p.name.toUpperCase().includes(staffSearchTerm.toUpperCase())).sort((a,b) => a.name.localeCompare(b.name));
  }, [staff, staffSearchTerm]);

  const filteredMovementStaff = staff.filter(p => p.name.toUpperCase().includes(movementModalSearch.toUpperCase())).slice(0, 10);

  if (!user) return <div className="flex h-screen items-center justify-center bg-slate-50 font-black text-blue-600 animate-pulse uppercase tracking-widest text-[10px]">Menyambung ke Database...</div>;

  // --- REKA BENTUK ASAL (TIDAK BERUBAH) ---
  if (isPrintMode) {
    const filteredShiftDefs = shiftDefinitions.filter(def => selectedPrintShifts.includes(def.id));
    return (
      <div className="min-h-screen bg-white p-8 font-sans text-black text-left">
        <div className="flex justify-between items-start mb-8 no-print">
          <button onClick={() => setIsPrintMode(false)} className="px-4 py-2 bg-slate-100 rounded-xl font-bold border">Kembali</button>
          <button onClick={() => window.print()} className="px-6 py-2 bg-blue-600 text-white rounded-xl font-bold shadow-lg">Cetak Sekarang</button>
        </div>
        <div className="text-center mb-6 border-b-2 border-black pb-4 uppercase">
          <h1 className="text-2xl font-black">{String(appSettings.title)}</h1>
          <p className="text-lg font-bold">{String(appSettings.subtitle)}</p>
          <p className="text-md font-bold mt-1 uppercase">{printFormat === 'ot' ? 'Penyata OT' : 'Jadual Bertugas'} • {currentMonth.toLocaleString('ms-MY', { month: 'long', year: 'numeric' })}</p>
        </div>
        <div className="grid grid-cols-7 border border-black bg-black gap-px">
          {['Isnin', 'Selasa', 'Rabu', 'Khamis', 'Jumaat', 'Sabtu', 'Ahad'].map(day => (<div key={day} className="bg-slate-100 py-2 text-center font-black uppercase text-[10px]">{day}</div>))}
          {calendarDays.map((dateStr, idx) => (
            <div key={idx} className="bg-white min-h-[120px] p-2 text-left">
              {dateStr && <><span className="font-black text-sm">{new Date(dateStr).getDate()}</span>
              <div className="space-y-1 mt-1">
                {filteredShiftDefs.map(type => (shifts[dateStr]?.[type.id] || []).map(st => (
                  <div key={st.staffId} className="text-[8px] border-b pb-0.5 uppercase font-bold">{type.label}: {st.staffName}</div>
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
      <header className="bg-white border-b sticky top-0 z-20 px-4 py-3 shadow-sm">
        <div className="max-w-[1600px] mx-auto flex flex-col lg:flex-row lg:items-center justify-between gap-3 text-slate-800">
          <div className="flex items-center gap-3 shrink-0">
            <div className="bg-blue-600 p-2 rounded-xl text-white shadow-lg shrink-0"><ClipboardList size={20} /></div>
            <div className="text-left"><h1 className="text-lg md:text-xl font-black leading-none uppercase">{String(appSettings.title)}</h1><p className="text-[8px] md:text-[10px] text-slate-400 font-bold uppercase mt-1 tracking-widest">{String(appSettings.subtitle)}</p></div>
          </div>
          <nav className="flex bg-slate-100 p-1 rounded-2xl gap-1 overflow-x-auto no-scrollbar shrink-0">
            {['calendar', 'movement', 'staff', 'settings'].map(t => (
              <button key={t} onClick={() => setActiveTab(t)} className={`px-3 md:px-5 py-2 rounded-xl text-xs md:text-sm font-bold uppercase shrink-0 ${activeTab === t ? 'bg-white text-blue-600 shadow-sm' : 'text-slate-500'}`}>{t === 'calendar' ? 'On-Call' : t}</button>
            ))}
          </nav>
          <div className="flex items-center bg-slate-100 p-1 rounded-2xl gap-1">
            <button onClick={() => changeMonth(-1)} className="p-2 md:p-2.5 hover:bg-white rounded-xl text-slate-500"><ChevronLeft size={18} /></button>
            <div className="px-2 md:px-4 min-w-[120px] text-center text-xs md:text-sm font-black uppercase">{currentMonth.toLocaleString('ms-MY', { month: 'short', year: 'numeric' })}</div>
            <button onClick={() => changeMonth(1)} className="p-2 md:p-2.5 hover:bg-white rounded-xl text-slate-500"><ChevronRight size={18} /></button>
          </div>
        </div>
      </header>

      <main className="max-w-[1600px] mx-auto p-3 md:p-6 w-full flex-1">
        {activeTab === 'calendar' && (
          <div className="space-y-4 animate-in fade-in">
            <div className="bg-white rounded-[1.5rem] md:rounded-[2.5rem] shadow-xl border border-slate-200 overflow-hidden text-slate-800">
              <div className="grid grid-cols-7 border-b border-slate-100 bg-slate-50/50 text-slate-400 py-3 md:py-4 font-black uppercase text-[10px]">
                {['Isnin', 'Selasa', 'Rabu', 'Khamis', 'Jumaat', 'Sabtu', 'Ahad'].map(day => (<div key={day} className="text-center">{day}</div>))}
              </div>
              <div className="grid grid-cols-7 gap-px bg-slate-100">
                {calendarDays.map((dateStr, idx) => (
                  <div key={idx} onClick={() => dateStr && setSelectedDate(dateStr)} className={`min-h-[80px] md:min-h-[220px] p-1 md:p-2 bg-white transition-colors text-left ${dateStr ? 'cursor-pointer hover:bg-blue-50/30' : 'bg-slate-50/20'}`}>
                    {dateStr && <><div className="flex justify-between items-start mb-1"><span className={`inline-flex items-center justify-center w-5 h-5 md:w-8 md:h-8 text-[10px] md:text-sm font-black rounded-full ${dateStr === new Date().toISOString().split('T')[0] ? 'bg-blue-600 text-white' : 'text-slate-700'}`}>{new Date(dateStr).getDate()}</span></div>
                    <div className="space-y-0.5 md:space-y-1.5 overflow-hidden">
                      {shiftDefinitions.map(type => (shifts[dateStr]?.[type.id] || []).map(st => (
                        <div key={st.staffId} className={`px-1 md:px-2 py-0.5 md:py-1.5 rounded-md md:rounded-xl text-[7px] md:text-[10px] font-black truncate border border-current/10 shadow-sm ${getShiftColor(type.color, 'light')}`}>{st.staffName}</div>
                      )))}
                    </div></>}
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {activeTab === 'movement' && (
          <div className="space-y-4 animate-in fade-in">
             <div className="flex justify-between items-center bg-white p-6 rounded-3xl border shadow-sm">
              <div className="text-left leading-none uppercase font-black"><h2 className="text-xl md:text-2xl">Pergerakan Staf</h2></div>
              <button onClick={() => setShowMovementModal(true)} className="px-8 py-4 bg-blue-600 text-white font-black rounded-2xl shadow-xl active:scale-95 transition-all text-xs uppercase tracking-widest"><Plus size={20} /><span>Kemaskini</span></button>
            </div>
            <div className="bg-white rounded-[1.5rem] md:rounded-[2.5rem] shadow-xl border overflow-hidden">
              <div className="grid grid-cols-7 gap-px bg-slate-100">
                {calendarDays.map((dateStr, idx) => (
                  <div key={idx} className="min-h-[100px] md:min-h-[160px] p-1 md:p-2 bg-white text-left">
                    {dateStr && <><span className="text-[10px] md:text-sm font-black text-slate-700">{new Date(dateStr).getDate()}</span>
                    <div className="space-y-0.5 md:space-y-1.5 mt-1 overflow-hidden">
                      {movements.filter(m => dateStr >= m.dateStart && dateStr <= m.dateEnd).map(m => (
                        <div key={m.id} className={`p-1 md:p-2 rounded-md md:rounded-xl text-[7px] md:text-[9px] font-black text-white ${MOVEMENT_TYPES.find(t=>t.id===m.type)?.color} flex items-center justify-between group uppercase shadow-sm truncate`}><span className="truncate">{m.staffName}</span><button onClick={() => deleteMovement(m.id)} className="opacity-0 group-hover:opacity-100 transition-all text-white shrink-0 ml-1"><X size={8}/></button></div>
                      ))}
                    </div></>}
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {activeTab === 'staff' && (
          <div className="bg-white rounded-2xl md:rounded-3xl border shadow-xl overflow-hidden animate-in fade-in">
            <div className="p-4 md:p-8 border-b flex flex-col md:flex-row md:items-center justify-between gap-4 bg-slate-50/50">
              <h2 className="text-xl md:text-2xl uppercase font-black">Direktori</h2>
              <button onClick={() => setShowStaffModal(true)} className="bg-blue-600 text-white px-6 py-3 rounded-xl flex items-center justify-center gap-2 font-black shadow-lg uppercase text-xs">Tambah Staf</button>
            </div>
            <div className="overflow-x-auto"><table className="w-full text-left">
              <tbody className="divide-y text-slate-800">
                {filteredStaffDirectory.map((person) => (
                  <tr key={person.id} className="hover:bg-slate-50/80 transition-colors">
                    <td className="px-4 md:px-6 py-4 text-left uppercase font-bold text-xs md:text-sm">{person.name}</td>
                    <td className="px-4 md:px-6 py-4 text-right"><div className="flex justify-end gap-1"><button onClick={() => editStaff(person)} className="text-slate-300 hover:text-blue-500 p-2"><Edit2 size={18} /></button><button onClick={() => deleteDoc(doc(db, 'artifacts', appId, 'public', 'data', 'staff', person.id))} className="text-slate-300 hover:text-red-500 p-2"><Trash2 size={18} /></button></div></td>
                  </tr>
                ))}
              </tbody></table></div>
          </div>
        )}
      </main>

      {/* --- MODALS (ASAL) --- */}
      {selectedDate && (
        <div className="fixed inset-0 z-[1000] flex items-center justify-center p-3 bg-slate-900/50 backdrop-blur-md animate-in fade-in">
          <div className="bg-white w-full max-w-xl rounded-[2rem] shadow-2xl overflow-hidden max-h-[90vh] flex flex-col">
            <div className="p-6 border-b flex justify-between items-center bg-slate-50/80 shrink-0 text-left">
              <div className="text-left font-black uppercase"><h3 className="text-lg">Atur Jadual</h3><p className="text-[9px] text-slate-500 font-bold mt-1">📅 {new Date(selectedDate).toLocaleDateString('ms-MY', { day: 'numeric', month: 'long', year: 'numeric' })}</p></div>
              <button onClick={() => setSelectedDate(null)} className="p-2 hover:bg-slate-100 rounded-full shrink-0"><X/></button>
            </div>
            <div className="p-4 md:p-6 overflow-y-auto no-scrollbar flex-1">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {shiftDefinitions.map(type => (
                  <div key={type.id} className="p-4 rounded-2xl border bg-slate-50 text-left">
                    <div className="flex items-center justify-between mb-3 border-b pb-2 font-black text-[10px] uppercase tracking-widest"><div className="flex items-center gap-2"><div className={`w-2.5 h-2.5 rounded-full ${getShiftColor(type.color, 'bg')}`}></div>{type.label}</div><span>{(shifts[selectedDate]?.[type.id] || []).length}</span></div>
                    <div className="space-y-1.5">
                      {staff.map(s => {
                        const active = (shifts[selectedDate]?.[type.id] || []).some(a => a.staffId === s.id);
                        return (<button key={s.id} onClick={() => toggleStaffOnShift(selectedDate, type.id, s.id)} className={`w-full p-2.5 rounded-xl border-2 font-black text-[10px] uppercase transition-all ${active ? 'bg-blue-600 border-blue-600 text-white shadow-lg' : 'bg-white border-slate-100 text-slate-400'}`}>{s.name}</button>);
                      })}
                    </div>
                  </div>
                ))}
              </div>
            </div>
            <div className="p-6 bg-slate-50 border-t shrink-0"><button onClick={() => setSelectedDate(null)} className="w-full py-4 bg-slate-900 text-white font-black rounded-xl uppercase text-xs tracking-widest shadow-xl active:scale-95 transition-all">Simpan & Tutup</button></div>
          </div>
        </div>
      )}

      {showMovementModal && (
        <div className="fixed inset-0 z-[1000] flex items-center justify-center p-3 bg-slate-900/60 backdrop-blur-md animate-in fade-in">
          <div className="bg-white w-full max-w-md rounded-[2rem] shadow-2xl p-6">
            <h3 className="text-lg font-black uppercase mb-6 text-left">Rekod Pergerakan</h3>
            <form onSubmit={saveMovement} className="space-y-4 text-left">
              <div className="text-left">
                <label className="text-[9px] font-black text-slate-400 ml-1 uppercase">Pilih Staf</label>
                {!newMovement.staffId ? (
                  <div className="relative">
                    <input type="text" placeholder="CARI NAMA..." className="w-full p-4 bg-slate-50 border rounded-xl font-bold outline-none text-sm" value={movementModalSearch} onChange={e => setMovementModalSearch(e.target.value)}/>
                    {movementModalSearch && (
                      <div className="absolute top-full left-0 right-0 bg-white border rounded-xl mt-1 shadow-xl overflow-hidden z-50">
                        {filteredMovementStaff.map(s => <div key={s.id} onClick={() => {setNewMovement({...newMovement, staffId: s.id, staffName: s.name}); setMovementModalSearch('');}} className="p-3 hover:bg-blue-50 cursor-pointer font-bold uppercase text-xs border-b">{s.name}</div>)}
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="p-4 bg-blue-50 text-blue-700 rounded-xl font-black uppercase flex justify-between items-center text-xs">{newMovement.staffName} <button type="button" onClick={() => setNewMovement({...newMovement, staffId:'', staffName:''})}><X size={16}/></button></div>
                )}
              </div>
              <div className="text-left leading-none uppercase"><label className="text-[9px] font-black text-slate-400 ml-1">Kategori</label><select className="w-full p-4 bg-slate-50 border rounded-xl font-black outline-none mt-1 text-xs" onChange={e => setNewMovement({...newMovement, type: e.target.value})}>{MOVEMENT_TYPES.map(t => <option key={t.id} value={t.id}>{t.label}</option>)}</select></div>
              <div className="grid grid-cols-2 gap-3 text-left">
                <div className="text-left"><label className="text-[9px] font-black text-slate-400 ml-1 uppercase">Mula</label><input type="date" className="w-full p-3 bg-slate-50 border rounded-xl font-bold outline-none text-xs" onChange={e => setNewMovement({...newMovement, dateStart: e.target.value})}/></div>
                <div className="text-left"><label className="text-[9px] font-black text-slate-400 ml-1 uppercase">Tamat</label><input type="date" className="w-full p-3 bg-slate-50 border rounded-xl font-bold outline-none text-xs" onChange={e => setNewMovement({...newMovement, dateEnd: e.target.value})}/></div>
              </div>
              <button type="submit" className="w-full py-4 bg-blue-600 text-white font-black rounded-xl shadow-xl mt-2 uppercase text-xs">Simpan Data</button>
              <button type="button" onClick={() => setShowMovementModal(false)} className="w-full py-2 font-black text-slate-400 uppercase text-[10px] text-center">Batal</button>
            </form>
          </div>
        </div>
      )}

      {showStaffModal && (
        <div className="fixed inset-0 z-[1000] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-md">
          <div className="bg-white w-full max-w-sm rounded-[2rem] p-6 shadow-2xl">
            <h3 className="text-lg font-black uppercase mb-6 text-left">{newStaff.id ? 'Edit' : 'Tambah'} Staf</h3>
            <div className="space-y-4 text-left">
              <input type="text" value={newStaff.name} placeholder="NAMA PENUH" className="w-full p-4 bg-slate-50 border rounded-xl font-black outline-none text-sm uppercase" onChange={e => setNewStaff({...newStaff, name: e.target.value.toUpperCase()})}/>
              <input type="text" value={newStaff.unit} placeholder="UNIT (EG: LOGISTIK)" className="w-full p-4 bg-slate-50 border rounded-xl font-black outline-none text-sm uppercase" onChange={e => setNewStaff({...newStaff, unit: e.target.value.toUpperCase()})}/>
              <button onClick={async () => {
                const data = { name: newStaff.name, unit: newStaff.unit };
                newStaff.id ? await updateDoc(doc(db, 'artifacts', appId, 'public', 'data', 'staff', newStaff.id), data) : await addDoc(collection(db, 'artifacts', appId, 'public', 'data', 'staff'), data);
                setShowStaffModal(false);
              }} className="w-full py-4 bg-blue-600 text-white font-black rounded-xl shadow-xl uppercase text-xs">Simpan</button>
              <button onClick={() => setShowStaffModal(false)} className="w-full py-2 font-bold text-slate-400 uppercase text-[10px] text-center">Batal</button>
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

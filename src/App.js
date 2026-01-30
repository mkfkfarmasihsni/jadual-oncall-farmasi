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

// --- Konfigurasi Firebase (Terus & Stabil) ---
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

// --- KONFIGURASI WARNA & JENIS PERGERAKAN ---
const COLOR_OPTIONS = [
  { id: 'indigo', bg: 'bg-indigo-600', border: 'border-indigo-600', light: 'bg-indigo-50 text-indigo-700' },
  { id: 'orange', bg: 'bg-orange-500', border: 'border-orange-500', light: 'bg-orange-50 text-orange-700' },
  { id: 'emerald', bg: 'bg-emerald-500', border: 'border-emerald-500', light: 'bg-emerald-700 text-white' },
  { id: 'blue', bg: 'bg-blue-500', border: 'border-blue-500', light: 'bg-blue-700 text-blue-700' },
  { id: 'pink', bg: 'bg-pink-500', border: 'border-pink-500', light: 'bg-pink-50 text-pink-700' },
  { id: 'red', bg: 'bg-red-500', border: 'border-red-500', light: 'bg-red-50 text-red-700' },
  { id: 'purple', bg: 'bg-purple-600', border: 'border-purple-600', light: 'bg-purple-50 text-purple-700' },
  { id: 'teal', bg: 'bg-teal-500', border: 'border-teal-500', light: 'bg-teal-700 text-white' },
];

const MOVEMENT_TYPES = [
  { id: 'Bercuti', label: 'Bercuti', color: 'bg-rose-500', light: 'bg-rose-50 text-rose-700', icon: <Plane size={14} /> },
  { id: 'MC', label: 'MC', color: 'bg-amber-600', light: 'bg-amber-50 text-amber-700', icon: <Stethoscope size={14} /> },
  { id: 'Kursus', label: 'Kursus', color: 'bg-indigo-500', light: 'bg-indigo-50 text-indigo-700', icon: <BookOpen size={14} /> },
  { id: 'Off', label: 'Off', color: 'bg-slate-500', light: 'bg-slate-100 text-slate-700', icon: <Coffee size={14} /> },
];

// --- Helpers ---
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

  // --- Auth ---
  useEffect(() => {
    signInAnonymously(auth).catch(err => console.error("Auth Error:", err));
    const unsubAuth = onAuthStateChanged(auth, (u) => setUser(u));
    return () => unsubAuth();
  }, []);

  // --- Firestore Listeners ---
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
      const map = {}; s.docs.forEach(d => map[d.data().date] = { id: d.id, ...d.data() }); setHolidays(map);
    });

    const unsubMov = onSnapshot(collection(db, 'artifacts', appId, 'public', 'data', 'movements'), (s) => 
      setMovements(s.docs.map(d => ({ id: d.id, ...d.data() }))));

    return () => { unsubStaff(); unsubShifts(); unsubDef(); unsubSettings(); unsubHolidays(); unsubMov(); };
  }, [user]);

  // --- Handlers & Memos ---
  const calendarDays = useMemo(() => {
    const y = currentMonth.getFullYear(), m = currentMonth.getMonth();
    const days = [];
    const total = new Date(y, m + 1, 0).getDate();
    const start = (new Date(y, m, 1).getDay() + 6) % 7;
    for (let i = 0; i < start; i++) days.push(null);
    for (let i = 1; i <= total; i++) days.push(formatLocalDate(y, m, i));
    return days;
  }, [currentMonth]);

  const toggleStaffOnShift = async (date, shiftId, staffId) => {
    const ref = doc(db, 'artifacts', appId, 'public', 'data', 'shifts', date);
    const data = { ...(shifts[date] || {}) };
    let list = Array.isArray(data[shiftId]) ? [...data[shiftId]] : [];
    const exists = list.find(s => s.staffId === staffId);
    if (exists) list = list.filter(s => s.staffId !== staffId);
    else {
      const s = staff.find(st => st.id === staffId);
      list.push({ staffId, staffName: s.name, unit: s.unit || '' });
    }
    if (list.length === 0) delete data[shiftId]; else data[shiftId] = list;
    if (Object.keys(data).length === 0) await deleteDoc(ref); else await setDoc(ref, data);
  };

  if (!user) return <div className="h-screen flex items-center justify-center bg-slate-50 font-bold">Menyambung ke Farmasi Server...</div>;

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 pb-10">
      <header className="bg-white border-b p-4 sticky top-0 z-20 shadow-sm flex justify-between items-center">
        <div className="flex items-center gap-3">
          <div className="bg-blue-600 p-2 rounded-lg text-white"><ClipboardList size={20}/></div>
          <div className="text-left"><h1 className="font-black text-lg leading-tight">{appSettings.title}</h1><p className="text-[10px] uppercase font-bold text-slate-400">{appSettings.subtitle}</p></div>
        </div>
        <nav className="flex bg-slate-100 p-1 rounded-xl gap-1">
          {['calendar', 'movement', 'staff', 'settings'].map(t => (
            <button key={t} onClick={() => setActiveTab(t)} className={`px-4 py-2 rounded-lg text-xs font-bold capitalize ${activeTab === t ? 'bg-white shadow text-blue-600' : 'text-slate-500'}`}>{t}</button>
          ))}
        </nav>
      </header>

      <main className="max-w-7xl mx-auto p-4">
        {activeTab === 'calendar' && (
          <div className="bg-white rounded-3xl shadow-xl border border-slate-200 overflow-hidden">
            <div className="p-4 border-b flex justify-between items-center">
               <button onClick={() => setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() - 1, 1))} className="p-2 hover:bg-slate-100 rounded-full"><ChevronLeft/></button>
               <h2 className="font-black uppercase">{currentMonth.toLocaleString('ms-MY', { month: 'long', year: 'numeric' })}</h2>
               <button onClick={() => setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1, 1))} className="p-2 hover:bg-slate-100 rounded-full"><ChevronRight/></button>
            </div>
            <div className="grid grid-cols-7 bg-slate-50 border-b text-[10px] font-black uppercase text-center py-2">
              {['Isnin','Selasa','Rabu','Khamis','Jumaat','Sabtu','Ahad'].map(d => <div key={d}>{d}</div>)}
            </div>
            <div className="grid grid-cols-7 gap-px bg-slate-200">
              {calendarDays.map((dStr, i) => (
                <div key={i} onClick={() => dStr && setSelectedDate(dStr)} className={`min-h-[120px] p-2 bg-white ${dStr ? 'cursor-pointer hover:bg-blue-50' : ''} ${holidays[dStr] ? 'bg-red-50' : ''}`}>
                  {dStr && (
                    <>
                      <span className="text-sm font-black">{parseInt(dStr.split('-')[2])}</span>
                      <div className="mt-1 space-y-1">
                        {shiftDefinitions.map(def => shifts[dStr]?.[def.id]?.map(s => (
                          <div key={s.staffId} className={`text-[9px] p-1 rounded font-bold uppercase truncate ${getShiftColor(def.color, 'light')}`}>
                            {s.staffName}
                          </div>
                        )))}
                      </div>
                    </>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        {activeTab === 'staff' && (
          <div className="bg-white rounded-3xl shadow-lg p-6">
            <div className="flex justify-between items-center mb-6">
              <h2 className="font-black uppercase text-xl">Direktori Staf</h2>
              <button onClick={() => setShowStaffModal(true)} className="bg-blue-600 text-white px-4 py-2 rounded-xl font-bold flex items-center gap-2"><UserPlus size={18}/> Tambah</button>
            </div>
            <div className="grid gap-4">
              {staff.sort((a,b) => a.name.localeCompare(b.name)).map(s => (
                <div key={s.id} className="flex justify-between items-center p-4 bg-slate-50 rounded-2xl border border-slate-100">
                  <div className="text-left"><p className="font-black uppercase text-sm">{s.name}</p><p className="text-[10px] font-bold text-blue-500 uppercase">{s.unit || 'Umum'}</p></div>
                  <div className="flex gap-2">
                    <button onClick={() => deleteDoc(doc(db, 'artifacts', appId, 'public', 'data', 'staff', s.id))} className="p-2 text-slate-300 hover:text-red-500"><Trash2 size={18}/></button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </nav>

      {/* --- Simple Modal Setup Data --- */}
      {selectedDate && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white w-full max-w-2xl rounded-3xl p-6 shadow-2xl">
            <div className="flex justify-between items-center mb-6">
              <h3 className="font-black uppercase">Set Jadual: {selectedDate}</h3>
              <button onClick={() => setSelectedDate(null)}><X/></button>
            </div>
            <div className="space-y-6 max-h-[60vh] overflow-y-auto">
              {shiftDefinitions.map(def => (
                <div key={def.id} className="p-4 bg-slate-50 rounded-2xl">
                  <p className="font-black text-xs uppercase mb-3 border-b pb-1">{def.label}</p>
                  <div className="flex flex-wrap gap-2">
                    {staff.map(s => {
                      const isAssigned = shifts[selectedDate]?.[def.id]?.some(a => a.staffId === s.id);
                      return (
                        <button key={s.id} onClick={() => toggleStaffOnShift(selectedDate, def.id, s.id)} className={`px-3 py-1.5 rounded-lg text-[10px] font-bold uppercase border transition-all ${isAssigned ? 'bg-blue-600 text-white border-blue-600' : 'bg-white border-slate-200 text-slate-500'}`}>
                          {s.name}
                        </button>
                      );
                    })}
                  </div>
                </div>
              ))}
            </div>
            <button onClick={() => setSelectedDate(null)} className="w-full mt-6 bg-slate-900 text-white py-3 rounded-2xl font-black uppercase">Tutup</button>
          </div>
        </div>
      )}

      {showStaffModal && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white w-full max-w-md rounded-3xl p-8 shadow-2xl">
            <h3 className="font-black uppercase mb-6">Tambah Staf Baru</h3>
            <input type="text" onChange={(e) => setNewStaff({...newStaff, name: e.target.value})} className="w-full p-4 bg-slate-50 rounded-2xl mb-4 font-bold outline-none border border-slate-100" placeholder="Nama Penuh"/>
            <input type="text" onChange={(e) => setNewStaff({...newStaff, unit: e.target.value})} className="w-full p-4 bg-slate-50 rounded-2xl mb-6 font-bold outline-none border border-slate-100" placeholder="Unit/Seksyen"/>
            <div className="flex gap-3">
              <button onClick={() => setShowStaffModal(false)} className="flex-1 py-4 font-bold text-slate-400">Batal</button>
              <button onClick={async () => {
                await addDoc(collection(db, 'artifacts', appId, 'public', 'data', 'staff'), { name: newStaff.name.toUpperCase(), unit: newStaff.unit.toUpperCase() });
                setShowStaffModal(false);
              }} className="flex-1 py-4 bg-blue-600 text-white rounded-2xl font-black">Simpan</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default App;

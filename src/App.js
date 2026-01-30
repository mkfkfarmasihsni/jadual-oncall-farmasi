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
  signInWithCustomToken, 
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

// --- Pengendalian Konfigurasi Firebase yang Selamat ---
const getFirebaseConfig = () => {
  try {
    // Utamakan pembolehubah process.env (Vercel/CRA)
    if (typeof process !== 'undefined' && process.env && process.env.REACT_APP_FIREBASE_CONFIG) {
      return JSON.parse(process.env.REACT_APP_FIREBASE_CONFIG);
    }
    // Fallback ke pembolehubah global jika wujud
    if (typeof __firebase_config !== 'undefined' && __firebase_config) {
      return JSON.parse(__firebase_config);
    }
  } catch (e) {
    console.error("Firebase config parsing error:", e);
  }
  // Hardcoded fallback (Gantikan maklumat ini jika perlu)
  return {
    apiKey: "AIzaSyDw1t_UrMRvEHCyKFQIzMmlP7w6feSIos0",
    authDomain: "jadual-oncall.firebaseapp.com",
    projectId: "jadual-oncall",
    storageBucket: "jadual-oncall.firebasestorage.app",
    messagingSenderId: "152318949416",
    appId: "1:152318949416:web:1f141e58315f769b66dd1d"
  };
};

const getAppId = () => {
  if (typeof process !== 'undefined' && process.env && process.env.REACT_APP_ID) {
    return process.env.REACT_APP_ID;
  }
  return typeof __app_id !== 'undefined' ? __app_id : 'pharmacy-oncall-2026';
};

const firebaseConfig = getFirebaseConfig();
const appId = getAppId();

// Inisialisasi Firebase
const firebaseApp = initializeApp(firebaseConfig);
const auth = getAuth(firebaseApp);
const db = getFirestore(firebaseApp);

// --- KONFIGURASI WARNA & KATEGORI ---
const COLOR_OPTIONS = [
  { id: 'indigo', bg: 'bg-indigo-600', border: 'border-indigo-600', light: 'bg-indigo-50 text-indigo-700' },
  { id: 'orange', bg: 'bg-orange-500', border: 'border-orange-500', light: 'bg-orange-50 text-orange-700' },
  { id: 'emerald', bg: 'bg-emerald-500', border: 'border-emerald-500', light: 'bg-emerald-700 text-white' },
  { id: 'blue', bg: 'bg-blue-500', border: 'border-blue-500', light: 'bg-blue-50 text-blue-700' },
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
  { id: 'Temujanji', label: 'Temujanji', color: 'bg-teal-500', light: 'bg-teal-50 text-teal-700', icon: <CheckCircle2 size={14} /> },
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
  const [statusMsg, setStatusMsg] = useState(null);

  const headerVisible = !isPrintMode;

  // --- Auth Setup ---
  useEffect(() => {
    const initAuth = async () => {
      try {
        await signInAnonymously(auth);
      } catch (error) {
        console.error("Firebase Authentication error:", error);
      }
    };
    initAuth();
    const unsubscribeAuth = onAuthStateChanged(auth, (u) => {
      setUser(u);
    });
    return () => unsubscribeAuth();
  }, []);

  // --- Data Fetching Setup ---
  useEffect(() => {
    if (!user) return; 

    const unsubStaff = onSnapshot(collection(db, 'artifacts', appId, 'public', 'data', 'staff'), (snapshot) => {
      setStaff(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
    }, (err) => console.error("Firestore staff error:", err));

    const unsubShifts = onSnapshot(collection(db, 'artifacts', appId, 'public', 'data', 'shifts'), (snapshot) => {
      const shiftMap = {};
      snapshot.docs.forEach(doc => { shiftMap[doc.id] = doc.data(); });
      setShifts(shiftMap);
    }, (err) => console.error("Firestore shifts error:", err));

    const unsubShiftDef = onSnapshot(collection(db, 'artifacts', appId, 'public', 'data', 'shiftDefinitions'), (snapshot) => {
      let defs = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      if (defs.length === 0) setupDefaultShifts();
      const sorted = defs.sort((a,b) => (a.order || 0) - (b.order || 0));
      setShiftDefinitions(sorted);
      if (selectedPrintShifts.length === 0) setSelectedPrintShifts(sorted.map(sh => sh.id));
    }, (err) => console.error("Firestore shiftDef error:", err));

    const unsubSettings = onSnapshot(doc(db, 'artifacts', appId, 'public', 'data', 'appSettings', 'global'), (docSnap) => {
      if (docSnap.exists()) setAppSettings(docSnap.data());
    }, (err) => console.error("Firestore settings error:", err));

    const unsubHolidays = onSnapshot(collection(db, 'artifacts', appId, 'public', 'data', 'holidays'), (snapshot) => {
      const holidayMap = {};
      snapshot.docs.forEach(doc => { 
        const data = doc.data();
        if (data.date) holidayMap[data.date] = { id: doc.id, ...data }; 
      });
      setHolidays(holidayMap);
    }, (err) => console.error("Firestore holidays error:", err));

    const unsubMovements = onSnapshot(collection(db, 'artifacts', appId, 'public', 'data', 'movements'), (snapshot) => {
      setMovements(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
    }, (err) => console.error("Firestore movements error:", err));

    return () => {
      unsubStaff(); unsubShifts(); unsubShiftDef(); unsubSettings(); unsubHolidays(); unsubMovements();
    };
  }, [user]);

  const setupDefaultShifts = async () => {
    if (!user) return;
    const defaults = [
      { label: 'Night Shift FK', time: '11PM-8AM', color: 'indigo', order: 1 },
      { label: 'Evening Shift', time: '2PM-11PM', color: 'orange', order: 2 },
      { label: 'Lunch Call PF/PRP', time: '1PM-2PM', color: 'emerald', order: 3 },
    ];
    for (const d of defaults) await addDoc(collection(db, 'artifacts', appId, 'public', 'data', 'shiftDefinitions'), d);
  };

  // --- Handlers ---
  const addHoliday = async (e) => {
    e.preventDefault();
    if (!user || !newHoliday.date || !newHoliday.name.trim()) return;
    try {
      await addDoc(collection(db, 'artifacts', appId, 'public', 'data', 'holidays'), {
        date: newHoliday.date,
        name: String(newHoliday.name).toUpperCase()
      });
      setNewHoliday({ date: '', name: '' });
      showStatus("Tarikh cuti ditambah!", "success");
    } catch (err) { showStatus("Gagal menambah cuti", "error"); }
  };

  const deleteHoliday = async (id) => {
    if (!user) return;
    try {
      await deleteDoc(doc(db, 'artifacts', appId, 'public', 'data', 'holidays', id));
      showStatus("Cuti dipadam", "info");
    } catch (err) { showStatus("Gagal memadam", "error"); }
  };

  const updateAppSettings = async (title, subtitle) => {
    if (!user) return;
    try {
      await setDoc(doc(db, 'artifacts', appId, 'public', 'data', 'appSettings', 'global'), { title: String(title), subtitle: String(subtitle) }, { merge: true });
      showStatus("Tetapan disimpan!", "success");
    } catch (err) { showStatus("Gagal menyimpan tetapan", "error"); }
  };

  const saveMovement = async (e) => {
    e.preventDefault();
    if (!user || !newMovement.staffId || !newMovement.dateStart || !newMovement.dateEnd) return;
    try {
      const staffMember = staff.find(s => s.id === newMovement.staffId);
      await addDoc(collection(db, 'artifacts', appId, 'public', 'data', 'movements'), {
        ...newMovement,
        staffName: String(staffMember?.name || 'Unknown'),
        createdAt: new Date().toISOString()
      });
      setShowMovementModal(false);
      setNewMovement({ staffId: '', staffName: '', type: 'Bercuti', dateStart: '', dateEnd: '', timeInfo: '' });
      setMovementModalSearch('');
      showStatus("Pergerakan staf direkodkan!", "success");
    } catch (err) { showStatus("Gagal merekod pergerakan", "error"); }
  };

  const deleteMovement = async (id) => {
    if (!user) return;
    try { await deleteDoc(doc(db, 'artifacts', appId, 'public', 'data', 'movements', id)); showStatus("Pergerakan dipadam", "info"); } catch (err) { showStatus("Gagal memadam", "error"); }
  };

  const saveStaff = async (e) => {
    e.preventDefault();
    if (!user || !newStaff.name.trim()) return;
    const data = { name: String(newStaff.name).toUpperCase(), phone: String(newStaff.phone || ''), unit: String(newStaff.unit || ''), updatedAt: new Date().toISOString() };
    if (newStaff.id) await updateDoc(doc(db, 'artifacts', appId, 'public', 'data', 'staff', newStaff.id), data);
    else await addDoc(collection(db, 'artifacts', appId, 'public', 'data', 'staff'), { ...data, createdAt: new Date().toISOString() });
    setNewStaff({ name: '', phone: '', unit: '', id: null }); setShowStaffModal(false); showStatus("Data staf disimpan!", "success");
  };

  const saveShiftDef = async (e) => {
    e.preventDefault();
    if (!user) return;
    if (editingShiftDef.id) await updateDoc(doc(db, 'artifacts', appId, 'public', 'data', 'shiftDefinitions', editingShiftDef.id), editingShiftDef);
    else await addDoc(collection(db, 'artifacts', appId, 'public', 'data', 'shiftDefinitions'), { ...editingShiftDef, order: shiftDefinitions.length + 1 });
    setShowShiftDefModal(false); setEditingShiftDef(null); showStatus("Syif disimpan!", "success");
  };

  const toggleStaffOnShift = async (dateStr, typeId, staffId) => {
    if (!user) return;
    try {
      const shiftRef = doc(db, 'artifacts', appId, 'public', 'data', 'shifts', dateStr);
      const dayData = { ...(shifts[dateStr] || {}) };
      let list = Array.isArray(dayData[typeId]) ? [...dayData[typeId]] : [];
      const exists = list.find(s => s.staffId === staffId);
      if (exists) list = list.filter(s => s.staffId !== staffId);
      else {
        const m = staff.find(s => s.id === staffId);
        list.push({ staffId, staffName: String(m?.name || ''), staffPhone: String(m?.phone || ""), unit: String(m?.unit || "") });
      }
      if (list.length === 0) delete dayData[typeId]; else dayData[typeId] = list;
      if (Object.keys(dayData).length === 0) await deleteDoc(shiftRef); else await setDoc(shiftRef, dayData);
    } catch (err) { showStatus("Gagal mengemaskini syif", "error"); }
  };

  // --- Derived Memos ---
  const activeShiftInfo = useMemo(() => {
    if (activeShiftType === 'all') return null;
    return shiftDefinitions.find(d => d.id === activeShiftType);
  }, [activeShiftType, shiftDefinitions]);

  const calendarDays = useMemo(() => {
    const year = currentMonth.getFullYear(), month = currentMonth.getMonth();
    const days = [], totalDays = new Date(year, month + 1, 0).getDate();
    let rawFirstDay = new Date(year, month, 1).getDay(); 
    let startDay = (rawFirstDay + 6) % 7; 
    for (let i = 0; i < startDay; i++) days.push(null);
    for (let i = 1; i <= totalDays; i++) days.push(formatLocalDate(year, month, i));
    return days;
  }, [currentMonth]);

  const filteredStaffDirectory = useMemo(() => {
    return staff
      .filter(p => (String(p.name || '').toUpperCase().includes(staffSearchTerm.toUpperCase())) || (String(p.unit || '').toUpperCase().includes(staffSearchTerm.toUpperCase())))
      .sort((a,b) => String(a.name || '').localeCompare(String(b.name || '')));
  }, [staff, staffSearchTerm]);

  const filteredMovementStaff = useMemo(() => {
    if (!movementModalSearch.trim()) return [];
    return staff.filter(p => String(p.name || '').toUpperCase().includes(movementModalSearch.toUpperCase())).slice(0, 10);
  }, [staff, movementModalSearch]);

  const showStatus = (msg, type = 'info') => {
    setStatusMsg({ text: msg, type });
    setTimeout(() => setStatusMsg(null), 3000);
  };

  const openPrintOptions = (format) => { setPrintFormat(format); setShowPrintOptions(true); };

  const handlePrintAction = () => {
    setShowPrintOptions(false); setIsPrintMode(true);
    setTimeout(() => { window.focus(); window.print(); }, 500);
  };

  const togglePrintShift = (id) => {
    setSelectedPrintShifts(prev => prev.includes(id) ? prev.filter(s => s !== id) : [...prev, id]);
  };

  const changeMonth = (offset) => setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() + offset, 1));

  const getWhatsAppLink = (phone) => {
    if (!phone) return null;
    let cleaned = String(phone).replace(/\D/g, '');
    if (cleaned.startsWith('0')) cleaned = '6' + cleaned;
    else if (!cleaned.startsWith('60')) cleaned = '60' + cleaned;
    return `https://wa.me/${cleaned}`;
  };

  const editStaff = (p) => { setNewStaff({ id: p.id, name: p.name, phone: p.phone || '', unit: p.unit || '' }); setShowStaffModal(true); };

  if (!user) return <div className="flex h-screen items-center justify-center bg-slate-50"><div className="flex flex-col items-center gap-4"><div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div><p className="text-slate-500 font-bold animate-pulse uppercase tracking-widest text-[10px]">Menyambung...</p></div></div>;

  // --- PRINT MODE VIEW ---
  if (isPrintMode) {
    const filteredShiftDefs = shiftDefinitions.filter(def => selectedPrintShifts.includes(def.id));
    return (
      <div className="min-h-screen bg-white p-8 font-sans text-black text-left">
        <div className="flex justify-between items-start mb-8 no-print">
          <button onClick={() => setIsPrintMode(false)} className="flex items-center gap-2 px-4 py-2 bg-slate-100 rounded-xl font-bold hover:bg-slate-200 transition-all text-black border border-slate-200 shadow-sm"><ArrowLeft size={18} /><span>Kembali</span></button>
          <button onClick={() => window.print()} className="flex items-center gap-2 px-6 py-2 bg-blue-600 text-white rounded-xl font-bold shadow-lg"><Printer size={18} /><span>Cetak Sekarang</span></button>
        </div>
        <div className="text-center mb-6 border-b-2 border-black pb-4 text-black uppercase">
          <h1 className="text-2xl font-black tracking-tight">{String(appSettings.title)}</h1>
          <p className="text-lg font-bold">{String(appSettings.subtitle)}</p>
          <p className="text-md font-bold mt-1">
            {printFormat === 'ot' ? 'Penyata Tuntutan Kerja Lebih Masa (OT)' : 'Jadual Bertugas'} • {currentMonth.toLocaleString('ms-MY', { month: 'long', year: 'numeric' })}
          </p>
        </div>

        <div className="mb-6 p-4 border border-black bg-slate-50 text-left">
          <h3 className="text-xs font-black uppercase mb-3 border-b border-black pb-1 text-black">Rujukan Waktu Bertugas</h3>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-y-2 gap-x-6 text-black text-left">
            {filteredShiftDefs.map(def => (
              <div key={def.id} className="flex gap-2 text-[9px]">
                <span className="font-black whitespace-nowrap min-w-[100px]">{String(def.label)}:</span>
                <span className="whitespace-pre-line leading-tight">{String(def.time || 'Waktu tidak set')}</span>
              </div>
            ))}
          </div>
        </div>

        {printFormat === 'ot' && searchTerm.trim() && filteredStats ? (
          <div className="space-y-6">
            <div className="p-4 bg-slate-50 border border-slate-300 rounded-lg text-left uppercase text-black">
              <h2 className="text-lg font-black underline mb-4 text-center">Penyata Rekod Tugasan Individu</h2>
              <table className="w-full text-sm text-left">
                <tbody>
                  <tr><td className="w-40 py-1 font-bold uppercase leading-tight">Nama Kakitangan:</td><td className="py-1 uppercase font-black">{String(filteredStats.name)}</td></tr>
                  <tr><td className="py-1 font-bold uppercase leading-tight">Unit / Seksyen:</td><td className="py-1 uppercase text-left">{String(filteredStats.unit || 'TIADA UNIT')}</td></tr>
                  <tr><td className="py-1 font-bold uppercase leading-tight">Jumlah Hari:</td><td className="py-1 text-left">{individualDutyList.length} Hari</td></tr>
                </tbody>
              </table>
            </div>
            <table className="w-full border-collapse border border-black text-sm">
              <thead><tr className="bg-slate-100 text-black uppercase font-black"><th className="border border-black p-2 text-center w-10 uppercase">No</th><th className="border border-black p-2 text-center uppercase">Tarikh</th><th className="border border-black p-2 text-center uppercase">Hari</th><th className="border border-black p-2 text-center uppercase">Syif</th><th className="border border-black p-2 text-center uppercase">Waktu Bertugas</th><th className="border border-black p-2 text-center w-24 uppercase">Catatan</th></tr></thead>
              <tbody>
                {individualDutyList.map((item, idx) => {
                   const d = new Date(item.date);
                   return (
                    <tr key={idx} className={d.getDay() === 0 || holidays[item.date] ? 'bg-yellow-50 text-black' : 'text-black'}>
                      <td className="border border-black p-2 text-center text-xs">{idx + 1}</td>
                      <td className="border border-black p-2 text-center text-xs">{d.toLocaleDateString('ms-MY')}</td>
                      <td className="border border-black p-2 text-center uppercase font-bold text-xs">{d.toLocaleString('ms-MY', { weekday: 'long' })}</td>
                      <td className="border border-black p-2 text-center uppercase font-black text-xs">{String(item.shiftName)}</td>
                      <td className="border border-black p-2 text-center whitespace-pre-line text-[10px]">{String(item.shiftTime)}</td>
                      <td className="border border-black p-2 text-center"></td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="border border-black text-black">
            <div className="grid grid-cols-7 bg-slate-100 border-b border-black text-black font-black uppercase text-[10px]">
              {['Isnin', 'Selasa', 'Rabu', 'Khamis', 'Jumaat', 'Sabtu', 'Ahad'].map(day => (<div key={day} className="py-2 text-center">{day}</div>))}
            </div>
            <div className="grid grid-cols-7 bg-black gap-px">
              {calendarDays.map((dateStr, idx) => {
                if (!dateStr) return <div key={`empty-${idx}`} className="bg-white h-32 text-black"></div>;
                const d = new Date(dateStr);
                const h = holidays[dateStr], s = shifts[dateStr] || {};
                return (
                  <div key={dateStr} className={`p-2 min-h-[120px] flex flex-col ${h ? 'bg-yellow-50' : 'bg-white'} text-left text-black`}>
                    <span className="font-black text-sm mb-1">{d.getDate()}</span>
                    <div className="space-y-1">
                      {filteredShiftDefs.map(type => {
                        let list = s[type.id] || [];
                        if (searchTerm.trim()) list = list.filter(st => String(st.staffName || '').toUpperCase().includes(searchTerm.toUpperCase()));
                        if (list.length === 0) return null;
                        return (
                          <div key={type.id} className="text-[8px] leading-tight text-left">
                            <p className="font-black border-b border-slate-200 mb-0.5 uppercase text-black">{String(type.label)}</p>
                            {list.map(st => (<p key={st.staffId} className="font-medium text-black truncate">• {String(st.staffName)}</p>))}
                          </div>
                        );
                      })}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}
        <div className="mt-20 grid grid-cols-2 gap-20 text-center text-black">
          <div className="space-y-12">
            <p className="text-xs font-bold uppercase underline leading-tight">Disediakan Oleh:</p>
            <div><div className="border-b border-black w-64 mx-auto mb-1 text-black"></div><p className="text-[10px] font-black uppercase">(TANDATANGAN & COP RASMI)</p></div>
          </div>
          <div className="space-y-12">
            <p className="text-xs font-bold uppercase underline leading-tight">Diluluskan Oleh:</p>
            <div><div className="border-b border-black w-64 mx-auto mb-1 text-black"></div><p className="text-[10px] font-black uppercase">(TANDATANGAN & COP RASMI)</p></div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 font-sans pb-20 no-print flex flex-col">
      
      {headerVisible && (
        <header className="bg-white border-b sticky top-0 z-20 px-4 py-3 shadow-sm flex-none">
          <div className="max-w-[1600px] mx-auto flex flex-col lg:flex-row lg:items-center justify-between gap-3 text-slate-800">
            
            <div className="flex items-center gap-3 shrink-0">
              <div className="bg-blue-600 p-2 rounded-xl text-white shadow-lg shrink-0"><ClipboardList size={20} /></div>
              <div className="overflow-hidden text-left">
                <h1 className="text-lg md:text-xl font-black leading-none uppercase truncate">{String(appSettings.title)}</h1>
                <p className="text-[8px] md:text-[10px] text-slate-400 font-bold uppercase mt-1 tracking-widest truncate">{String(appSettings.subtitle)}</p>
              </div>
            </div>

            <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-end flex-1 gap-2 md:gap-3">
              <div className="flex bg-slate-100 p-1 rounded-2xl gap-1 overflow-x-auto no-scrollbar shrink-0">
                <button onClick={() => setActiveTab('calendar')} className={`flex items-center gap-1.5 px-3 md:px-5 py-2 rounded-xl text-xs md:text-sm font-bold transition-all shrink-0 ${activeTab === 'calendar' ? 'bg-white text-blue-600 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}><CalendarIcon size={16} /><span className="hidden xs:inline uppercase">On-Call</span></button>
                <button onClick={() => setActiveTab('movement')} className={`flex items-center gap-1.5 px-3 md:px-5 py-2 rounded-xl text-xs md:text-sm font-bold transition-all shrink-0 ${activeTab === 'movement' ? 'bg-white text-blue-600 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}><MapPin size={16} /><span className="hidden xs:inline uppercase">Pergerakan</span></button>
                <button onClick={() => setActiveTab('staff')} className={`flex items-center gap-1.5 px-3 md:px-5 py-2 rounded-xl text-xs md:text-sm font-bold transition-all shrink-0 ${activeTab === 'staff' ? 'bg-white text-blue-600 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}><Users size={16} /><span className="hidden xs:inline uppercase">Direktori</span></button>
                <button onClick={() => setActiveTab('settings')} className={`flex items-center gap-1.5 px-3 md:px-5 py-2 rounded-xl text-xs md:text-sm font-bold transition-all shrink-0 ${activeTab === 'settings' ? 'bg-white text-blue-600 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}><Settings size={16} /><span className="hidden xs:inline uppercase">Tetapan</span></button>
              </div>
              <div className="flex items-center bg-slate-100 p-1 rounded-2xl gap-1 justify-between sm:justify-center">
                <button onClick={() => changeMonth(-1)} className="p-2 md:p-2.5 hover:bg-white rounded-xl text-slate-500 transition-all"><ChevronLeft size={18} /></button>
                <div className="px-2 md:px-4 min-w-[120px] md:min-w-[150px] text-center text-xs md:text-sm font-black capitalize truncate uppercase">{currentMonth.toLocaleString('ms-MY', { month: 'short', year: 'numeric' })}</div>
                <button onClick={() => changeMonth(1)} className="p-2 md:p-2.5 hover:bg-white rounded-xl text-slate-500 transition-all"><ChevronRight size={18} /></button>
              </div>
              <div className="flex bg-slate-100 p-1 rounded-2xl gap-1 shrink-0">
                <button onClick={() => openPrintOptions('calendar')} className="flex items-center gap-1 px-3 md:px-4 py-2 rounded-xl text-[10px] md:text-xs font-black text-slate-600 hover:bg-white hover:text-blue-600 transition-all border border-transparent"><Printer size={14} /><span className="hidden sm:inline uppercase">Cetak</span></button>
                <button onClick={() => openPrintOptions('ot')} className="flex items-center gap-1 px-3 md:px-4 py-2 rounded-xl text-[10px] md:text-xs font-black text-white bg-emerald-600 hover:bg-emerald-700 active:scale-95 transition-all"><FileText size={14} /><span className="uppercase">OT</span></button>
              </div>
            </div>
          </div>
        </header>
      )}

      <main className="max-w-[1600px] mx-auto p-3 md:p-6 w-full flex-1">
        {activeTab === 'calendar' ? (
           <div className="space-y-4 md:space-y-6 animate-in fade-in">
             <div className="flex flex-col gap-4 text-slate-800 text-left">
                <div className="relative w-full max-w-md">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
                  <input type="text" value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} placeholder="Cari nama staf..." className="w-full pl-10 pr-10 py-3 bg-white border border-slate-200 rounded-2xl font-bold text-xs md:text-sm outline-none shadow-sm focus:ring-2 focus:ring-blue-500 text-slate-700 shadow-inner" />
                  {searchTerm && <button onClick={() => setSearchTerm('')} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400"><X size={16} /></button>}
                </div>
                <div className="flex flex-wrap items-center gap-2 bg-white/50 p-3 md:p-4 rounded-[1.5rem] md:rounded-[2rem] border border-slate-100 shadow-sm overflow-x-auto no-scrollbar">
                  <button onClick={() => setActiveShiftType('all')} className={`px-3 md:px-4 py-2 rounded-xl text-[10px] md:text-xs font-bold border shrink-0 ${activeShiftType === 'all' ? 'bg-slate-800 text-white shadow-md' : 'bg-white text-slate-600'}`}>Semua Syif</button>
                  {shiftDefinitions.map(type => (<button key={type.id} onClick={() => setActiveShiftType(type.id)} className={`px-3 md:px-4 py-2 rounded-xl text-[10px] md:text-xs font-bold border shrink-0 ${activeShiftType === type.id ? `${getShiftColor(type.color, 'bg')} text-white shadow-md` : 'bg-white text-slate-600'}`}>{String(type.label)}</button>))}
                </div>
              </div>

              {activeShiftInfo && (
                <div className={`p-4 md:p-5 rounded-[1.5rem] md:rounded-[2rem] flex items-center gap-3 md:gap-4 border animate-in slide-in-from-top-2 ${getShiftColor(activeShiftInfo.color, 'light')} text-slate-800`}>
                  <div className={`p-2.5 md:p-3 rounded-2xl bg-white shadow-md ${getShiftColor(activeShiftInfo.color, 'light').split(' ')[1]}`}><Clock size={20} /></div>
                  <div className="text-left overflow-hidden"><h3 className="font-black text-xs md:text-sm uppercase leading-none mb-1 truncate">{String(activeShiftInfo.label)}</h3><p className="text-[10px] md:text-xs font-bold opacity-80 uppercase tracking-widest whitespace-pre-line truncate">{String(activeShiftInfo.time)}</p></div>
                  <button onClick={() => setActiveShiftType('all')} className="ml-auto p-1 hover:bg-black/5 rounded-full"><X size={16} /></button>
                </div>
              )}

              <div className="bg-white rounded-[1.5rem] md:rounded-[2.5rem] shadow-xl border border-slate-200 overflow-hidden w-full text-slate-800">
                <div className="grid grid-cols-7 border-b border-slate-100 bg-slate-50/50 text-slate-400">
                  {['Is', 'Sl', 'Rb', 'Kh', 'Jm', 'Sb', 'Ah'].map(day => (<div key={day} className="py-3 md:py-4 text-center text-[10px] font-black uppercase tracking-widest">{day}</div>))}
                </div>
                <div className="grid grid-cols-7 gap-px bg-slate-100 text-slate-800">
                  {calendarDays.map((dateStr, idx) => {
                    if (!dateStr) return <div key={`empty-${idx}`} className="bg-slate-50/20 h-20 md:h-48 text-slate-800"></div>;
                    const d = new Date(dateStr), h = holidays[dateStr], s = shifts[dateStr] || {}, today = dateStr === new Date().toISOString().split('T')[0];
                    return (
                      <div key={dateStr} onClick={() => setSelectedDate(dateStr)} className={`min-h-[80px] md:min-h-[220px] p-1 md:p-2 flex flex-col group cursor-pointer hover:bg-blue-50/30 transition-colors ${h ? 'bg-yellow-50' : 'bg-white'} ${today ? 'ring-2 ring-inset ring-blue-500 z-10' : ''}`}>
                        <div className="flex justify-between items-start mb-1 md:mb-2 text-left"><span className={`inline-flex items-center justify-center w-5 h-5 md:w-8 md:h-8 text-[10px] md:text-sm font-black rounded-full ${today ? 'bg-blue-600 text-white' : 'text-slate-700'}`}>{parseInt(dateStr.split('-')[2])}</span>{h && <div className="text-right leading-none text-red-500 font-black text-[6px] md:text-[7px] uppercase">PH</div>}</div>
                        <div className="space-y-0.5 md:space-y-1.5 overflow-hidden text-left text-slate-800">
                          {shiftDefinitions.map(type => {
                            const staffList = s[type.id] || [];
                            if (activeShiftType !== 'all' && activeShiftType !== type.id) return null;
                            if (searchTerm.trim() && !staffList.some(st => String(st.staffName).toUpperCase().includes(searchTerm.toUpperCase()))) return null;
                            if (staffList.length === 0) return null;
                            return (
                              <div 
                                key={type.id} 
                                onClick={(e) => { e.stopPropagation(); setActiveShiftType(type.id); }} 
                                title={`${String(type.label)}: ${String(type.time)}`}
                                className={`px-1 md:px-2 py-0.5 md:py-1.5 rounded-md md:rounded-xl text-[7px] md:text-[10px] font-black truncate border shadow-sm flex items-center gap-1 ${getShiftColor(type.color, 'light')} border-current/10 hover:brightness-95 transition-all text-slate-800`}
                              >
                                <div className={`w-1 md:w-1.5 h-1 md:h-1.5 rounded-full ${getShiftColor(type.color, 'bg')} shrink-0`}></div>
                                <span className="truncate uppercase">{staffList.length === 1 ? String(staffList[0].staffName).split(' ')[0] : `${staffList.length} STAF`}</span>
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
           </div>
        ) : activeTab === 'movement' ? (
          <div className="space-y-4 md:space-y-6 animate-in fade-in text-slate-800">
             <div className="flex flex-col md:flex-row justify-between items-start md:items-center bg-white p-4 md:p-6 rounded-2xl md:rounded-3xl border border-slate-200 shadow-sm gap-4 text-slate-800 text-left">
              <div className="text-left text-slate-800 uppercase leading-none">
                <h2 className="text-xl md:text-2xl font-black leading-tight uppercase text-left">Pergerakan Staf</h2>
                <p className="text-slate-500 font-medium text-[10px] tracking-widest mt-1 uppercase text-left">Rekod harian kakitangan farmasi</p>
              </div>
              <button onClick={() => setShowMovementModal(true)} className="w-full md:w-auto flex items-center justify-center gap-2 px-8 py-4 bg-blue-600 text-white font-black rounded-2xl shadow-xl active:scale-95 transition-all uppercase text-xs tracking-widest"><Plus size={20} /><span>Kemaskini</span></button>
            </div>
            <div className="bg-white p-3 md:p-4 rounded-xl border border-slate-200 shadow-sm flex flex-wrap gap-2 md:gap-4 items-center overflow-x-auto no-scrollbar text-left text-slate-800">
              <span className="text-[8px] md:text-[10px] font-black uppercase text-slate-400 tracking-widest mr-1">Petunjuk Warna:</span>
              {MOVEMENT_TYPES.map(t => (<div key={t.id} className="flex items-center gap-1.5 shrink-0 text-slate-800"><div className={`w-2.5 h-2.5 md:w-3 md:h-3 rounded-full ${t.color}`}></div><span className="text-[9px] md:text-[11px] font-bold uppercase">{t.label}</span></div>))}
            </div>
            <div className="bg-white rounded-[1.5rem] md:rounded-[2.5rem] shadow-xl border border-slate-200 overflow-hidden text-slate-800">
              <div className="grid grid-cols-7 border-b border-slate-100 bg-slate-50/50 text-slate-400">
                {['Is', 'Sl', 'Rb', 'Kh', 'Jm', 'Sb', 'Ah'].map(day => (<div key={day} className="py-3 md:py-4 text-center text-[10px] font-black uppercase tracking-widest">{day}</div>))}
              </div>
              <div className="grid grid-cols-7 gap-px bg-slate-100 text-slate-800">
                {calendarDays.map((dateStr, idx) => {
                  if (!dateStr) return <div key={`empty-${idx}`} className="bg-slate-50/20 h-24 md:h-40"></div>;
                  const startOfThisDay = new Date(dateStr); startOfThisDay.setHours(0,0,0,0);
                  const dayMovements = movements.filter(m => {
                    const s = new Date(m.dateStart); s.setHours(0,0,0,0);
                    const e = new Date(m.dateEnd); e.setHours(23,59,59,999);
                    return startOfThisDay >= s && startOfThisDay <= e;
                  });
                  return (
                    <div key={dateStr} onClick={() => setViewingDayMovements(dateStr)} className="min-h-[100px] md:min-h-[160px] p-1 md:p-2 bg-white flex flex-col group transition-colors hover:bg-slate-50/50 text-slate-800 cursor-pointer overflow-hidden text-left">
                      <span className="text-[10px] md:text-sm font-black text-slate-700 mb-1 md:mb-2">{parseInt(dateStr.split('-')[2])}</span>
                      <div className="space-y-0.5 md:space-y-1.5 overflow-hidden text-slate-800 text-left">
                        {dayMovements.map(m => {
                          const typeCfg = MOVEMENT_TYPES.find(t => t.id === m.type) || MOVEMENT_TYPES[0];
                          return (<div key={m.id} title={`${String(m.type)}: ${String(m.staffName)} ${m.type === 'Off' && m.timeInfo ? `(Waktu: ${m.timeInfo})` : ''}`} className={`p-1 md:p-2 rounded-md md:rounded-xl text-[7px] md:text-[9px] font-black text-white ${typeCfg.color} flex items-center justify-between shadow-sm transition-all text-left uppercase`}><span className="truncate uppercase leading-none">{String(m.staffName).split(' ')[0]}</span><button onClick={(e) => { e.stopPropagation(); deleteMovement(m.id); }} className="opacity-0 group-hover:opacity-100 p-0.5 hover:bg-black/10 rounded transition-all text-white shrink-0 ml-1"><X size={8} /></button></div>);
                        })}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        ) : activeTab === 'staff' ? (
          <div className="bg-white rounded-2xl md:rounded-3xl border border-slate-200 shadow-xl overflow-hidden animate-in fade-in text-slate-800 w-full">
            <div className="p-4 md:p-8 border-b flex flex-col md:flex-row md:items-center justify-between gap-4 bg-slate-50/50">
              <div className="text-left uppercase font-black tracking-tight"><h2 className="text-xl md:text-2xl uppercase">Direktori</h2></div>
              <div className="flex flex-col md:flex-row gap-3 w-full md:w-auto">
                <div className="relative w-full md:w-80 text-slate-800"><Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={16} /><input type="text" value={staffSearchTerm} onChange={(e) => setStaffSearchTerm(e.target.value)} placeholder="Cari nama kakitangan..." className="w-full pl-10 pr-10 py-3 bg-white border border-slate-200 rounded-xl font-bold text-sm outline-none text-slate-800 shadow-inner" /></div>
                <button onClick={() => { setNewStaff({ name: '', phone: '', unit: '', id: null }); setShowStaffModal(true); }} className="bg-blue-600 text-white px-6 py-3 rounded-xl flex items-center justify-center gap-2 font-bold shadow-lg active:scale-95 transition-all uppercase text-xs tracking-widest"><UserPlus size={18} /><span>Tambah Staf</span></button>
              </div>
            </div>
            <div className="overflow-x-auto"><table className="w-full text-left text-slate-800">
              <tbody className="divide-y divide-slate-50 text-slate-800">
                {filteredStaffDirectory.map((person) => (
                  <tr key={person.id} className="hover:bg-slate-50/80 transition-colors">
                    <td className="px-4 md:px-6 py-4 text-left"><div className="flex items-center gap-3"><div className="w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center text-slate-600 font-black text-[10px] uppercase shrink-0">{person.name ? String(person.name).substring(0, 2) : '??'}</div><div><span className="font-bold text-xs md:text-sm block leading-tight uppercase truncate">{String(person.name)}</span><span className="text-[9px] font-black uppercase text-blue-500 tracking-wider block">{String(person.unit || 'Tiada Unit')}</span></div></div></td>
                    <td className="px-4 md:px-6 py-4 text-center"><div className="flex justify-center gap-2">{person.phone && (<><a href={getWhatsAppLink(person.phone)} target="_blank" rel="noreferrer" className="p-2 bg-emerald-50 text-emerald-600 rounded-lg shadow-sm hover:bg-emerald-100"><MessageCircle size={16} /></a><a href={`tel:${person.phone}`} className="p-2 bg-blue-50 text-blue-600 rounded-lg shadow-sm hover:bg-blue-100"><Phone size={16} /></a></>)}</div></td>
                    <td className="px-4 md:px-6 py-4 text-right"><div className="flex justify-end gap-1"><button onClick={() => editStaff(person)} className="text-slate-300 hover:text-blue-500 p-2"><Edit2 size={18} /></button><button onClick={() => deleteDoc(doc(db, 'artifacts', appId, 'public', 'data', 'staff', person.id))} className="text-slate-300 hover:text-red-500 p-2"><Trash2 size={18} /></button></div></td>
                  </tr>
                ))}
              </tbody></table></div>
          </div>
        ) : (
          <div className="space-y-6 animate-in fade-in text-slate-800 max-w-4xl mx-auto">
             <div className="bg-white rounded-3xl border border-slate-200 shadow-xl p-6 md:p-8 text-slate-800 text-left">
              <h2 className="text-xl md:text-2xl font-black mb-8 uppercase text-left leading-tight">Maklumat Jadual</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 text-slate-800 text-left">
                <div className="space-y-1 text-left"><label className="text-[10px] font-black uppercase text-slate-400 ml-1 block text-left">Tajuk Utama</label><input type="text" value={appSettings.title} onChange={(e) => setAppSettings({...appSettings, title: e.target.value})} className="w-full px-4 py-3.5 bg-slate-50 border border-slate-100 rounded-xl font-bold outline-none text-slate-800 shadow-inner" /></div>
                <div className="space-y-1 text-left"><label className="text-[10px] font-black uppercase text-slate-400 ml-1 block text-left">Sub-Tajuk</label><input type="text" value={appSettings.subtitle} onChange={(e) => setAppSettings({...appSettings, subtitle: e.target.value})} className="w-full px-4 py-3.5 bg-slate-50 border border-slate-100 rounded-xl font-bold outline-none text-slate-800 shadow-inner" /></div>
                <div className="md:col-span-2 flex justify-end mt-2"><button onClick={() => updateAppSettings(appSettings.title, appSettings.subtitle)} className="px-10 py-3.5 bg-slate-900 text-white font-black rounded-xl shadow-lg active:scale-95 transition-all text-xs uppercase tracking-widest leading-none">Simpan Maklumat</button></div>
              </div>
            </div>

            <div className="bg-white rounded-3xl border border-slate-200 shadow-xl p-6 md:p-8 text-slate-800 text-left">
              <h2 className="text-xl md:text-2xl font-black mb-6 uppercase underline text-left">Cuti Umum</h2>
              <form onSubmit={addHoliday} className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8 text-slate-800">
                <input type="date" value={newHoliday.date} onChange={(e) => setNewHoliday({...newHoliday, date: e.target.value})} className="px-4 py-3.5 bg-slate-50 border border-slate-100 rounded-xl font-bold text-slate-700 outline-none shadow-inner" required />
                <input type="text" value={newHoliday.name} onChange={(e) => setNewHoliday({...newHoliday, name: e.target.value})} placeholder="Nama Cuti Umum..." className="px-4 py-3.5 bg-slate-50 border border-slate-100 rounded-xl font-bold text-slate-700 outline-none shadow-inner" required />
                <button type="submit" className="bg-blue-600 text-white font-black rounded-xl shadow-lg active:scale-95 transition-all text-xs uppercase tracking-widest"><Plus size={18} className="inline mr-1" />Tambah</button>
              </form>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3 text-left">
                {Object.values(holidays).sort((a,b) => String(a.date).localeCompare(String(b.date))).map(h => (<div key={h.id} className="flex items-center justify-between p-4 bg-yellow-50 border border-yellow-100 rounded-xl shadow-sm text-left"><div><p className="text-xs font-black text-yellow-700 leading-tight">{new Date(h.date).toLocaleDateString('ms-MY')}</p><p className="text-[10px] font-bold text-yellow-600 uppercase mt-0.5 leading-tight">{String(h.name)}</p></div><button onClick={() => deleteHoliday(h.id)} className="text-yellow-200 hover:text-red-500 transition-colors p-2 shrink-0"><Trash2 size={18} /></button></div>))}
              </div>
            </div>

            <div className="bg-white rounded-3xl border border-slate-200 shadow-xl p-6 md:p-8 text-slate-800 text-left">
              <div className="flex justify-between items-center mb-6"><div><h2 className="text-xl md:text-2xl font-black uppercase text-left leading-tight">Kategori Syif</h2></div><button onClick={() => { setEditingShiftDef({ label: '', time: '', color: 'blue' }); setShowShiftDefModal(true); }} className="bg-blue-600 text-white px-6 py-3 rounded-xl flex items-center gap-2 font-bold shadow-lg active:scale-95 text-xs uppercase tracking-widest"><Plus size={18} /><span>Tambah</span></button></div>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 text-slate-800 text-left">
                {shiftDefinitions.map(def => (
                  <div key={def.id} className="p-6 rounded-[2rem] border border-slate-100 bg-slate-50 group transition-all hover:bg-white hover:shadow-xl text-left">
                    <div className={`w-10 h-10 rounded-2xl ${getShiftColor(def.color, 'bg')} mb-4 flex items-center justify-center text-white shadow-md`}><Clock size={20} /></div>
                    <h3 className="font-black text-slate-800 text-xs md:text-sm uppercase leading-tight font-black uppercase">{String(def.label)}</h3><p className="text-[10px] font-bold text-slate-400 mt-1 uppercase whitespace-pre-line leading-tight text-left">{String(def.time || "Masa belum diset")}</p>
                    <div className="flex gap-2 mt-4 opacity-100 md:opacity-0 group-hover:opacity-100 transition-all text-left"><button onClick={() => { setEditingShiftDef(def); setShowShiftDefModal(true); }} className="p-2 bg-white rounded-xl text-slate-600 hover:text-blue-600 border border-slate-100 shadow-sm"><Edit2 size={16} /></button><button onClick={() => deleteDoc(doc(db, 'artifacts', appId, 'public', 'data', 'shiftDefinitions', def.id))} className="p-2 bg-white rounded-xl text-slate-600 hover:text-red-600 border border-slate-100 shadow-sm"><Trash2 size={16} /></button></div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
      </main>

      {/* --- MODALS - Optimized for Mobile --- */}

      {/* Modal Detail Pergerakan Harian */}
      {viewingDayMovements && (
        <div className="fixed inset-0 z-[2000] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-md animate-in fade-in">
          <div className="bg-white w-full max-w-md rounded-[2.5rem] shadow-2xl overflow-hidden text-slate-800 flex flex-col">
            <div className="p-8 border-b bg-slate-50/80 flex justify-between items-center text-slate-800 shrink-0">
              <div className="text-left leading-tight"><h3 className="text-xl font-black uppercase text-slate-800 leading-none">Detail Harian</h3><p className="text-[10px] font-bold text-slate-500 mt-2 uppercase tracking-widest">📅 {new Date(viewingDayMovements).toLocaleDateString('ms-MY', { day: 'numeric', month: 'long', year: 'numeric' })}</p></div>
              <button onClick={() => setViewingDayMovements(null)} className="p-2 hover:bg-white rounded-full border border-slate-100 bg-white shadow-sm shrink-0"><X size={24} /></button>
            </div>
            <div className="p-6 max-h-[60vh] overflow-y-auto no-scrollbar text-slate-800 flex-1">
              <div className="space-y-3 text-slate-800 text-left">
                {movements.filter(m => {
                  const s = new Date(m.dateStart); s.setHours(0,0,0,0);
                  const e = new Date(m.dateEnd); e.setHours(23,59,59,999);
                  const curr = new Date(viewingDayMovements);
                  return curr >= s && curr <= e;
                }).map(m => {
                  const typeCfg = MOVEMENT_TYPES.find(t => t.id === m.type) || MOVEMENT_TYPES[0];
                  return (
                    <div key={m.id} className={`p-4 rounded-2xl border border-transparent shadow-sm flex items-center justify-between ${typeCfg.light} animate-in zoom-in-95`}>
                      <div className="flex flex-col text-left overflow-hidden">
                        <span className="font-black uppercase text-xs truncate">{String(m.staffName)}</span>
                        <div className="flex items-center gap-1.5 mt-1 opacity-75">{typeCfg.icon}<span className="font-bold text-[10px] uppercase tracking-wider">{m.type} {m.type === 'Off' && m.timeInfo ? `(${m.timeInfo})` : ''}</span></div>
                      </div>
                      <div className="text-[9px] font-bold uppercase opacity-50 text-right shrink-0 ml-4 uppercase">Aktif</div>
                    </div>
                  );
                })}
                {movements.filter(m => {
                  const s = new Date(m.dateStart); s.setHours(0,0,0,0);
                  const e = new Date(m.dateEnd); e.setHours(23,59,59,999);
                  const curr = new Date(viewingDayMovements);
                  return curr >= s && curr <= e;
                }).length === 0 && <div className="py-12 text-center text-slate-400 italic">Tiada rekod pada hari ini.</div>}
              </div>
            </div>
            <div className="p-6 bg-slate-50 border-t shrink-0"><button onClick={() => setViewingDayMovements(null)} className="w-full py-4 bg-slate-900 text-white font-black rounded-xl uppercase text-xs tracking-widest shadow-xl active:scale-95 transition-all">Tutup</button></div>
          </div>
        </div>
      )}

      {showMovementModal && (
        <div className="fixed inset-0 z-[1000] flex items-center justify-center p-3 bg-slate-900/60 backdrop-blur-md animate-in fade-in">
          <div className="bg-white w-full max-w-md rounded-[2rem] shadow-2xl overflow-hidden text-slate-800 max-h-[95vh] flex flex-col">
            <div className="p-6 border-b bg-slate-50/80 flex justify-between items-center text-slate-800 shrink-0">
              <div className="text-left leading-tight"><h3 className="text-lg font-black uppercase text-slate-800 leading-none">Kemaskini</h3><p className="text-[10px] font-bold text-slate-400 mt-1 uppercase tracking-wider text-left tracking-widest leading-none">Hospital Sultanah Nora Ismail</p></div>
              <button onClick={() => { setShowMovementModal(false); setMovementModalSearch(''); }} className="p-2 hover:bg-white rounded-full border border-slate-100 bg-white shadow-sm"><X size={20} /></button>
            </div>
            <form onSubmit={saveMovement} className="p-6 space-y-5 overflow-y-auto no-scrollbar flex-1 text-slate-800 text-left">
              <div className="space-y-2 text-slate-800 text-left">
                <label className="text-[9px] font-black uppercase text-slate-400 ml-1 block uppercase text-left">Staf</label>
                {!newMovement.staffId ? (
                  <div className="relative text-slate-800 text-left">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
                    <input type="text" value={movementModalSearch} onChange={(e) => setMovementModalSearch(e.target.value)} placeholder="Taip nama (eg: AFIF)..." className="w-full pl-10 pr-4 py-3.5 bg-slate-50 border border-slate-100 rounded-xl font-bold text-sm text-slate-700 shadow-inner outline-none focus:ring-2 focus:ring-blue-500" />
                    {movementModalSearch && (
                      <div className="absolute top-full left-0 right-0 mt-2 bg-white border border-slate-100 rounded-xl shadow-2xl z-[140] overflow-hidden max-h-48 overflow-y-auto text-left">
                        {filteredMovementStaff.map(s => (
                          <div key={s.id} onClick={() => { setNewMovement({...newMovement, staffId: s.id, staffName: String(s.name)}); setMovementModalSearch(''); }} className="p-3.5 hover:bg-blue-50 cursor-pointer border-b border-slate-50 transition-colors flex items-center gap-3 text-left uppercase text-slate-800"><div className="w-7 h-7 rounded-full bg-blue-100 flex items-center justify-center text-blue-600 font-bold text-[10px] uppercase shrink-0">{String(s.name).substring(0, 2)}</div><span className="font-bold text-xs text-slate-700 uppercase leading-none truncate">{String(s.name)}</span></div>
                        ))}
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="p-3.5 bg-blue-50 border border-blue-100 rounded-xl flex items-center justify-between text-slate-800 animate-in zoom-in-95 shadow-sm text-left">
                    <div className="flex items-center gap-3 overflow-hidden text-left"><div className="w-8 h-8 rounded-full bg-blue-600 text-white flex items-center justify-center shadow-lg font-black text-xs shrink-0"><UserCheck size={16} /></div><span className="font-black text-blue-700 uppercase text-xs truncate leading-none text-left">{String(newMovement.staffName)}</span></div>
                    <button type="button" onClick={() => setNewMovement({...newMovement, staffId: '', staffName: ''})} className="p-1.5 text-blue-400 hover:text-red-500 transition-colors"><X size={16} /></button>
                  </div>
                )}
              </div>
              <div className="space-y-1.5 text-left text-slate-800">
                <label className="text-[9px] font-black uppercase text-slate-400 ml-1 block text-left">Jenis</label>
                <div className="grid grid-cols-2 gap-2 text-slate-800 text-left">
                  {MOVEMENT_TYPES.map(type => (<button key={type.id} type="button" onClick={() => setNewMovement({...newMovement, type: type.id})} className={`p-2.5 rounded-xl text-[9px] font-black border-2 transition-all flex items-center gap-2 ${newMovement.type === type.id ? 'border-blue-600 bg-blue-50 text-blue-700 shadow-sm' : 'border-slate-100 bg-white text-slate-400'}`}><div className={`w-2 h-2 rounded-full shrink-0 ${type.color}`}></div>{type.label}</button>))}
                </div>
              </div>
              {newMovement.type === 'Off' && (
                <div className="space-y-1.5 animate-in slide-in-from-top-2 text-slate-800 text-left"><label className="text-[9px] font-black uppercase text-slate-400 ml-1 block uppercase text-left">Masa Off (eg: 8am-12pm)</label><div className="relative text-left"><Clock className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={16} /><input type="text" value={newMovement.timeInfo} onChange={(e) => setNewMovement({...newMovement, timeInfo: e.target.value})} placeholder="Masukkan waktu..." className="w-full pl-10 pr-4 py-3 bg-slate-50 border border-slate-100 rounded-xl font-bold text-xs text-slate-700 shadow-inner outline-none" /></div></div>
              )}
              <div className="grid grid-cols-2 gap-3 text-slate-800 text-left">
                <div className="space-y-1 text-slate-800 text-left text-left"><label className="text-[9px] font-black uppercase text-slate-400 ml-1 block uppercase text-left leading-none">Mula</label><input type="date" value={newMovement.dateStart} onChange={(e) => setNewMovement({...newMovement, dateStart: e.target.value})} className="w-full px-3 py-3 bg-slate-50 border border-slate-100 rounded-xl font-bold text-xs text-slate-700 outline-none shadow-inner" required /></div>
                <div className="space-y-1 text-slate-800 text-left text-left"><label className="text-[9px] font-black uppercase text-slate-400 ml-1 block uppercase text-left leading-none">Tamat</label><input type="date" value={newMovement.dateEnd} onChange={(e) => setNewMovement({...newMovement, dateEnd: e.target.value})} className="w-full px-3 py-3 bg-slate-50 border border-slate-100 rounded-xl font-bold text-xs text-slate-700 outline-none shadow-inner" required /></div>
              </div>
              <button type="submit" className="w-full py-4 bg-slate-900 text-white font-black rounded-xl shadow-xl active:scale-95 transition-all disabled:opacity-50 mt-2 text-xs uppercase tracking-widest shadow-blue-900/10" disabled={!newMovement.staffId}>Simpan Pergerakan</button>
            </form>
          </div>
        </div>
      )}

      {showPrintOptions && (
        <div className="fixed inset-0 z-[1000] flex items-center justify-center p-3 bg-slate-900/60 backdrop-blur-md animate-in fade-in">
          <div className="bg-white w-full max-w-sm rounded-[2rem] shadow-2xl overflow-hidden text-slate-800">
             <div className="p-6 border-b flex justify-between items-center bg-slate-50/80 text-slate-800 text-left shrink-0">
              <div className="text-left uppercase font-black tracking-tight leading-tight"><h3 className="text-lg leading-none">Cetak Laporan</h3></div>
              <button onClick={() => setShowPrintOptions(false)} className="p-2 bg-white rounded-full border shadow-sm shrink-0"><X size={20} /></button>
            </div>
            <div className="p-6 max-h-[60vh] overflow-y-auto no-scrollbar text-slate-800 text-left">
               {shiftDefinitions.map(def => (
                <div key={def.id} onClick={() => togglePrintShift(def.id)} className={`flex items-center gap-3 p-3 rounded-xl cursor-pointer border-2 transition-all mb-2 ${selectedPrintShifts.includes(def.id) ? 'border-blue-600 bg-blue-50' : 'border-slate-100 bg-white'}`}>
                  <div className={`w-5 h-5 rounded-md flex items-center justify-center border-2 shrink-0 ${selectedPrintShifts.includes(def.id) ? 'bg-blue-600 border-blue-600 text-white' : 'border-slate-200'}`}>{selectedPrintShifts.includes(def.id) && <Check size={12} strokeWidth={4} />}</div>
                  <div className="text-xs font-black uppercase text-slate-800 text-left truncate">{String(def.label)}</div>
                </div>
               ))}
            </div>
            <div className="p-6 bg-slate-50 border-t"><button onClick={handlePrintAction} disabled={selectedPrintShifts.length === 0} className="w-full py-4 bg-blue-600 text-white font-black rounded-xl uppercase text-xs tracking-widest shadow-xl active:scale-95 transition-all leading-none">Proses Cetakan</button></div>
          </div>
        </div>
      )}

      {selectedDate && (
        <div className="fixed inset-0 z-[1000] flex items-center justify-center p-3 bg-slate-900/50 backdrop-blur-md animate-in fade-in no-print text-slate-800">
          <div className="bg-white w-full max-w-xl rounded-[2rem] shadow-2xl overflow-hidden animate-in zoom-in-95 max-h-[90vh] flex flex-col text-slate-800">
            <div className="p-6 border-b flex justify-between items-center bg-slate-50/80 gap-4 text-slate-800 shrink-0 text-left">
              <div className="text-left text-slate-800 uppercase font-black leading-tight text-left"><h3 className="text-lg leading-none text-left">Atur Jadual</h3><p className={`font-bold text-[9px] ${holidays[selectedDate] ? 'text-red-500' : 'text-slate-500'} mt-1 tracking-widest text-left`}>📅 {new Date(selectedDate).toLocaleDateString('ms-MY', { day: 'numeric', month: 'long', year: 'numeric' })}</p></div>
              <button onClick={() => setSelectedDate(null)} className="p-2 bg-white hover:bg-slate-100 rounded-full shadow-sm border shrink-0"><X size={20} /></button>
            </div>
            <div className="p-4 md:p-6 overflow-y-auto no-scrollbar flex-1 text-slate-800 text-left">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-slate-800 text-left">
                {shiftDefinitions.map(type => (
                  <div key={type.id} className="p-4 rounded-2xl border bg-slate-50 shadow-sm text-slate-800 text-left">
                    <div className="flex items-center justify-between mb-3 pb-2 border-b text-slate-800 font-black"><div className="flex items-center gap-2 text-[10px]"><div className={`w-2.5 h-2.5 rounded-full ${getShiftColor(type.color, 'bg')}`}></div>{String(type.label)}</div><span className="text-[10px] bg-white px-2 py-0.5 rounded-full border">{(shifts[selectedDate]?.[type.id] || []).length}</span></div>
                    <div className="relative mb-3"><Search className="absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-300" size={12} /><input type="text" value={modalSearchTerms[type.id] || ""} onChange={(e) => setModalSearchTerms({...modalSearchTerms, [type.id]: e.target.value})} placeholder="Cari..." className="w-full pl-8 pr-3 py-2 bg-white border border-slate-200 rounded-lg font-bold text-[10px] outline-none text-slate-800 shadow-inner" /></div>
                    <div className="space-y-1.5 text-left text-slate-800">
                      {(shifts[selectedDate]?.[type.id] || []).map(st => (<div key={st.staffId} onClick={() => toggleStaffOnShift(selectedDate, type.id, st.staffId)} className={`p-2 rounded-xl bg-white border shadow-sm flex items-center justify-between transition-all cursor-pointer hover:bg-red-50 hover:border-red-200 text-slate-800 text-left uppercase`}><span className="text-[10px] font-black uppercase truncate">{String(st.staffName)}</span><CheckCircle2 size={14} className="text-emerald-500" /></div>))}
                      {staff.filter(s => String(s.name || '').toUpperCase().includes((modalSearchTerms[type.id] || '').toUpperCase()) && !(shifts[selectedDate]?.[type.id] || []).some(a => a.staffId === s.id)).slice(0, 5).map(s => (<div key={s.id} onClick={() => toggleStaffOnShift(selectedDate, type.id, s.id)} className="p-2 rounded-xl border border-dashed border-slate-200 flex items-center justify-between cursor-pointer opacity-60 hover:opacity-100 hover:bg-blue-50 text-slate-800 text-left uppercase"><span className="text-[10px] uppercase font-bold">{String(s.name)}</span><Plus size={14} className="text-slate-300" /></div>))}
                    </div>
                  </div>
                ))}
              </div>
            </div>
            <div className="p-6 bg-slate-50 border-t shrink-0"><button onClick={() => setSelectedDate(null)} className="w-full py-4 bg-slate-900 text-white font-black rounded-xl uppercase text-xs tracking-widest shadow-xl active:scale-95 transition-all">Simpan & Tutup</button></div>
          </div>
        </div>
      )}

      {/* Modal Shift Def */}
      {showShiftDefModal && editingShiftDef && (
        <div className="fixed inset-0 z-[2000] flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-md animate-in fade-in">
          <div className="bg-white w-full max-w-sm rounded-[2rem] shadow-2xl overflow-hidden p-6 animate-in zoom-in-95 text-slate-800 flex flex-col">
            <div className="flex justify-between items-center mb-5 text-slate-800 font-black uppercase text-lg text-left leading-none"><h3 className="text-left">Tetapan Syif</h3><button onClick={() => setShowShiftDefModal(false)} className="p-1"><X size={20} /></button></div>
            <form onSubmit={saveShiftDef} className="space-y-4 text-slate-800 text-left">
              <input type="text" value={editingShiftDef.label} onChange={(e) => setEditingShiftDef({...editingShiftDef, label: e.target.value})} className="w-full px-4 py-3.5 bg-slate-50 border border-slate-100 rounded-xl font-bold outline-none text-slate-700 text-sm shadow-inner" placeholder="Nama Syif..." required />
              <textarea rows={3} value={editingShiftDef.time} onChange={(e) => setEditingShiftDef({...editingShiftDef, time: e.target.value})} className="w-full px-4 py-3.5 bg-slate-50 border border-slate-100 rounded-xl font-bold outline-none resize-none text-slate-700 text-sm shadow-inner" placeholder="Waktu Bertugas..." />
              <div className="flex flex-wrap gap-2 pt-1 text-slate-800 text-left">{COLOR_OPTIONS.map(c => (<button key={c.id} type="button" onClick={() => setEditingShiftDef({...editingShiftDef, color: c.id})} className={`w-8 h-8 rounded-lg border-4 ${c.bg} ${editingShiftDef.color === c.id ? 'border-slate-800 scale-110 shadow-md' : 'border-transparent'}`} />))}</div>
              <button type="submit" className="w-full py-4 bg-slate-900 text-white font-black rounded-xl shadow-lg active:scale-95 transition-all text-xs uppercase tracking-widest mt-2 leading-none">Simpan Syif</button>
            </form>
          </div>
        </div>
      )}

      {/* Modal Staf */}
      {showStaffModal && (
        <div className="fixed inset-0 z-[2000] flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-md animate-in fade-in">
          <div className="bg-white w-full max-w-sm rounded-[2rem] shadow-2xl overflow-hidden p-6 animate-in slide-in-from-bottom-8">
            <div className="flex justify-between items-center mb-5 text-slate-800 font-black uppercase text-lg text-left leading-none"><h3 className="text-left">{newStaff.id ? 'Edit Staf' : 'Tambah Staf'}</h3><button onClick={() => setShowStaffModal(false)} className="p-1"><X size={20} /></button></div>
            <form onSubmit={saveStaff} className="space-y-4 text-slate-800 text-left">
              <input autoFocus type="text" value={newStaff.name} onChange={(e) => setNewStaff({...newStaff, name: e.target.value})} className="w-full px-4 py-3.5 bg-slate-50 border border-slate-100 rounded-xl font-bold focus:ring-2 focus:ring-blue-500 outline-none text-slate-700 shadow-inner text-sm uppercase" placeholder="Nama Penuh..." required />
              <input type="tel" value={newStaff.phone} onChange={(e) => setNewStaff({...newStaff, phone: e.target.value})} className="w-full px-4 py-3.5 bg-slate-50 border border-slate-100 rounded-xl font-bold focus:ring-2 focus:ring-blue-500 outline-none text-slate-700 shadow-inner text-sm uppercase" placeholder="WhatsApp..." />
              <input type="text" value={newStaff.unit} onChange={(e) => setNewStaff({...newStaff, unit: e.target.value})} className="w-full px-4 py-3.5 bg-slate-50 border border-slate-100 rounded-xl font-bold focus:ring-2 focus:ring-blue-500 outline-none text-slate-700 shadow-inner text-sm uppercase" placeholder="Unit..." />
              <button type="submit" className="w-full py-4 bg-blue-600 text-white font-black rounded-xl shadow-lg active:scale-95 transition-all text-xs uppercase tracking-widest mt-2 leading-none">Simpan Staf</button>
            </form>
          </div>
        </div>
      )}

      <div className="h-4 flex-none"></div>

      <style>{`
        .no-scrollbar::-webkit-scrollbar { display: none; }
        .no-scrollbar { -ms-overflow-style: none; scrollbar-width: none; }
        .custom-scrollbar::-webkit-scrollbar { width: 4px; }
        .custom-scrollbar::-webkit-scrollbar-track { background: transparent; }
        .custom-scrollbar::-webkit-scrollbar-thumb { background: #cbd5e1; border-radius: 10px; }
        @media (max-width: 480px) { .xs\\:inline { display: inline; } }
      `}</style>
    </div>
  );
};

export default App;

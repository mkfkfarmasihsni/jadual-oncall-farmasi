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

// --- Konfigurasi Firebase (Vercel/Environment Variables Safe) ---
const firebaseConfig = (() => {
  try {
    if (typeof process !== 'undefined' && process.env && process.env.REACT_APP_FIREBASE_CONFIG) {
      return JSON.parse(process.env.REACT_APP_FIREBASE_CONFIG);
    }
    if (typeof __firebase_config !== 'undefined' && __firebase_config) {
      return JSON.parse(__firebase_config);
    }
  } catch (e) {
    console.error("Firebase Config Error:", e);
  }
  return {};
})();

const appId = (() => {
  if (typeof process !== 'undefined' && process.env && process.env.REACT_APP_ID) {
    return process.env.REACT_APP_ID;
  }
  return typeof __app_id !== 'undefined' ? __app_id : 'pharmacy-oncall-2026';
})();

// Inisialisasi Firebase di luar komponen untuk mengelakkan pengulangan
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

  // --- Auth Setup (Rule 3) ---
  useEffect(() => {
    const initAuth = async () => {
      try {
        if (typeof __initial_auth_token !== 'undefined' && __initial_auth_token) {
          await signInWithCustomToken(auth, __initial_auth_token);
        } else {
          await signInAnonymously(auth);
        }
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

  // --- Data Fetching Setup (Rule 1 & Auth Guard) ---
  useEffect(() => {
    if (!user) return; // Guard: Tunggu sehingga log masuk berjaya

    const unsubStaff = onSnapshot(
      collection(db, 'artifacts', appId, 'public', 'data', 'staff'), 
      (snapshot) => setStaff(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }))),
      (err) => console.error("Firestore staff listener error:", err)
    );

    const unsubShifts = onSnapshot(
      collection(db, 'artifacts', appId, 'public', 'data', 'shifts'), 
      (snapshot) => {
        const shiftMap = {};
        snapshot.docs.forEach(doc => { shiftMap[doc.id] = doc.data(); });
        setShifts(shiftMap);
      },
      (err) => console.error("Firestore shifts listener error:", err)
    );

    const unsubShiftDef = onSnapshot(
      collection(db, 'artifacts', appId, 'public', 'data', 'shiftDefinitions'), 
      (snapshot) => {
        let defs = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        if (defs.length === 0) setupDefaultShifts();
        const sorted = defs.sort((a,b) => (a.order || 0) - (b.order || 0));
        setShiftDefinitions(sorted);
        if (selectedPrintShifts.length === 0) setSelectedPrintShifts(sorted.map(sh => sh.id));
      },
      (err) => console.error("Firestore shiftDef listener error:", err)
    );

    const unsubSettings = onSnapshot(
      doc(db, 'artifacts', appId, 'public', 'data', 'appSettings', 'global'), 
      (docSnap) => docSnap.exists() && setAppSettings(docSnap.data()),
      (err) => console.error("Firestore settings listener error:", err)
    );

    const unsubHolidays = onSnapshot(
      collection(db, 'artifacts', appId, 'public', 'data', 'holidays'), 
      (snapshot) => {
        const holidayMap = {};
        snapshot.docs.forEach(doc => { 
          const data = doc.data();
          if (data.date) holidayMap[data.date] = { id: doc.id, ...data }; 
        });
        setHolidays(holidayMap);
      },
      (err) => console.error("Firestore holidays listener error:", err)
    );

    const unsubMovements = onSnapshot(
      collection(db, 'artifacts', appId, 'public', 'data', 'movements'), 
      (snapshot) => setMovements(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }))),
      (err) => console.error("Firestore movements listener error:", err)
    );

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
    for (const d of defaults) {
      await addDoc(collection(db, 'artifacts', appId, 'public', 'data', 'shiftDefinitions'), d);
    }
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
    try {
      await deleteDoc(doc(db, 'artifacts', appId, 'public', 'data', 'movements', id));
      showStatus("Pergerakan dipadam", "info");
    } catch (err) { showStatus("Gagal memadam", "error"); }
  };

  const saveStaff = async (e) => {
    e.preventDefault();
    if (!user || !newStaff.name.trim()) return;
    try {
      const data = { name: String(newStaff.name).toUpperCase(), phone: String(newStaff.phone || ''), unit: String(newStaff.unit || ''), updatedAt: new Date().toISOString() };
      if (newStaff.id) await updateDoc(doc(db, 'artifacts', appId, 'public', 'data', 'staff', newStaff.id), data);
      else await addDoc(collection(db, 'artifacts', appId, 'public', 'data', 'staff'), { ...data, createdAt: new Date().toISOString() });
      setNewStaff({ name: '', phone: '', unit: '', id: null }); setShowStaffModal(false); showStatus("Data staf disimpan!", "success");
    } catch (err) { showStatus("Ralat semasa simpan staf", "error"); }
  };

  const saveShiftDef = async (e) => {
    e.preventDefault();
    if (!user) return;
    try {
      if (editingShiftDef.id) await updateDoc(doc(db, 'artifacts', appId, 'public', 'data', 'shiftDefinitions', editingShiftDef.id), editingShiftDef);
      else await addDoc(collection(db, 'artifacts', appId, 'public', 'data', 'shiftDefinitions'), { ...editingShiftDef, order: shiftDefinitions.length + 1 });
      setShowShiftDefModal(false); setEditingShiftDef(null); showStatus("Syif disimpan!", "success");
    } catch (err) { showStatus("Ralat semasa simpan syif", "error"); }
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

  // --- Memos ---
  const activeShiftInfo = useMemo(() => {
    if (activeShiftType === 'all') return null;
    return shiftDefinitions.find(d => d.id === activeShiftType);
  }, [activeShiftType, shiftDefinitions]);

  const calendarDays = useMemo(() => {
    const year = currentMonth.getFullYear();
    const month = currentMonth.getMonth();
    const days = [];
    const totalDays = new Date(year, month + 1, 0).getDate();
    let rawFirstDay = new Date(year, month, 1).getDay(); 
    let startDay = (rawFirstDay + 6) % 7; 
    for (let i = 0; i < startDay; i++) days.push(null);
    for (let i = 1; i <= totalDays; i++) days.push(formatLocalDate(year, month, i));
    return days;
  }, [currentMonth]);

  const filteredStats = useMemo(() => {
    if (!searchTerm.trim()) return null;
    let count = 0;
    const query = searchTerm.toUpperCase();
    const matchedStaff = staff.find(s => String(s.name || '').toUpperCase().includes(query));
    if (!matchedStaff) return null;
    const prefix = formatLocalDate(currentMonth.getFullYear(), currentMonth.getMonth(), 1).substring(0, 7);
    Object.keys(shifts).forEach(date => {
      if (date.startsWith(prefix)) {
        Object.values(shifts[date]).forEach(staffList => {
          if (Array.isArray(staffList) && staffList.some(s => String(s.staffName || '').toUpperCase().includes(query))) count++;
        });
      }
    });
    return { name: matchedStaff.name, unit: matchedStaff.unit, count, id: matchedStaff.id };
  }, [shifts, searchTerm, currentMonth, staff]);

  const individualDutyList = useMemo(() => {
    if (!filteredStats) return [];
    const list = [];
    const yearMonth = formatLocalDate(currentMonth.getFullYear(), currentMonth.getMonth(), 1).substring(0, 7);
    Object.keys(shifts).sort().forEach(dateStr => {
      if (dateStr.startsWith(yearMonth)) {
        Object.keys(shifts[dateStr]).forEach(shiftId => {
          if (selectedPrintShifts.includes(shiftId)) {
            const listStaff = shifts[dateStr][shiftId];
            if (Array.isArray(listStaff) && listStaff.some(s => s.staffId === filteredStats.id)) {
              const def = shiftDefinitions.find(d => d.id === shiftId);
              list.push({ date: dateStr, shiftName: def?.label || shiftId, shiftTime: def?.time || '' });
            }
          }
        });
      }
    });
    return list;
  }, [shifts, filteredStats, currentMonth, shiftDefinitions, selectedPrintShifts]);

  const filteredStaffDirectory = useMemo(() => {
    return staff
      .filter(p => (String(p.name || '').toUpperCase().includes(staffSearchTerm.toUpperCase())) || (String(p.unit || '').toUpperCase().includes(staffSearchTerm.toUpperCase())))
      .sort((a,b) => String(a.name || '').localeCompare(String(b.name || '')));
  }, [staff, staffSearchTerm]);

  const filteredMovementStaff = useMemo(() => {
    if (!movementModalSearch.trim()) return [];
    return staff
      .filter(p => String(p.name || '').toUpperCase().includes(movementModalSearch.toUpperCase()))
      .slice(0, 10);
  }, [staff, movementModalSearch]);

  const showStatus = (msg, type = 'info') => {
    setStatusMsg({ text: msg, type });
    setTimeout(() => setStatusMsg(null), 3000);
  };

  const openPrintOptions = (format) => {
    setPrintFormat(format);
    setShowPrintOptions(true);
  };

  const handlePrintAction = () => {
    setShowPrintOptions(false);
    setIsPrintMode(true);
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

  if (!user) return <div className="flex h-screen items-center justify-center bg-slate-50"><div className="flex flex-col items-center gap-4"><div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div><p className="text-slate-500 font-bold animate-pulse">Menyambung ke pelayan...</p></div></div>;

  // --- PRINT VIEW ---
  if (isPrintMode) {
    const filteredShiftDefs = shiftDefinitions.filter(def => selectedPrintShifts.includes(def.id));
    return (
      <div className="min-h-screen bg-white p-8 font-sans text-black">
        <div className="flex justify-between items-start mb-8 no-print">
          <button onClick={() => setIsPrintMode(false)} className="flex items-center gap-2 px-4 py-2 bg-slate-100 rounded-xl font-bold hover:bg-slate-200 transition-all"><ArrowLeft size={18} /><span>Kembali</span></button>
          <button onClick={() => window.print()} className="flex items-center gap-2 px-6 py-2 bg-blue-600 text-white rounded-xl font-bold shadow-lg"><Printer size={18} /><span>Cetak</span></button>
        </div>
        <div className="text-center mb-6 border-b-2 border-black pb-4 text-black">
          <h1 className="text-2xl font-black uppercase tracking-tight">{String(appSettings.title)}</h1>
          <p className="text-lg font-bold">{String(appSettings.subtitle)}</p>
          <p className="text-md font-bold mt-1 uppercase text-black">
            {printFormat === 'ot' ? 'Penyata Tuntutan Kerja Lebih Masa (OT)' : 'Jadual Bertugas'} • {currentMonth.toLocaleString('ms-MY', { month: 'long', year: 'numeric' })}
          </p>
        </div>

        <div className="mb-6 p-4 border border-black bg-slate-50">
          <h3 className="text-xs font-black uppercase mb-3 border-b border-black pb-1 text-black text-left">Rujukan Waktu Bertugas</h3>
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
            <div className="p-4 bg-slate-50 border border-slate-300 rounded-lg">
              <h2 className="text-lg font-black underline mb-4 text-center text-black uppercase">Penyata Rekod Tugasan Individu</h2>
              <table className="w-full text-sm text-left text-black">
                <tbody>
                  <tr><td className="w-40 py-1 font-bold text-black">NAMA KAKITANGAN:</td><td className="py-1 uppercase font-black text-black text-left">{String(filteredStats.name)}</td></tr>
                  <tr><td className="py-1 font-bold text-black">UNIT / SEKSYEN:</td><td className="py-1 uppercase text-left text-black">{String(filteredStats.unit || 'TIADA UNIT')}</td></tr>
                  <tr><td className="py-1 font-bold text-black">JUMLAH HARI:</td><td className="py-1 text-left text-black">{individualDutyList.length} HARI</td></tr>
                </tbody>
              </table>
            </div>
            <table className="w-full border-collapse border border-black text-sm text-black">
              <thead><tr className="bg-slate-100 text-black"><th className="border border-black p-2 text-center w-10">NO</th><th className="border border-black p-2 text-center">TARIKH</th><th className="border border-black p-2 text-center">HARI</th><th className="border border-black p-2 text-center">SYIF</th><th className="border border-black p-2 text-center">WAKTU BERTUGAS</th><th className="border border-black p-2 text-center w-24">CATATAN</th></tr></thead>
              <tbody>
                {individualDutyList.map((item, idx) => {
                   const d = new Date(item.date);
                   return (
                    <tr key={idx} className={d.getDay() === 0 || holidays[item.date] ? 'bg-yellow-50' : ''}>
                      <td className="border border-black p-2 text-center text-xs text-black">{idx + 1}</td>
                      <td className="border border-black p-2 text-center text-xs text-black">{new Date(item.date).toLocaleDateString('ms-MY')}</td>
                      <td className="border border-black p-2 text-center uppercase font-bold text-xs text-black">{new Date(item.date).toLocaleString('ms-MY', { weekday: 'long' })}</td>
                      <td className="border border-black p-2 text-center uppercase font-black text-xs text-black">{String(item.shiftName)}</td>
                      <td className="border border-black p-2 text-center whitespace-pre-line text-[10px] text-black">{String(item.shiftTime)}</td>
                      <td className="border border-black p-2 text-center"></td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="border border-black text-black">
            <div className="grid grid-cols-7 bg-slate-100 border-b border-black">
              {['Isnin', 'Selasa', 'Rabu', 'Khamis', 'Jumaat', 'Sabtu', 'Ahad'].map(day => (<div key={day} className="py-2 text-center text-[10px] font-black uppercase text-black">{day}</div>))}
            </div>
            <div className="grid grid-cols-7 bg-black gap-px">
              {calendarDays.map((dateStr, idx) => {
                if (!dateStr) return <div key={`empty-${idx}`} className="bg-white h-32 text-black"></div>;
                const d = new Date(dateStr);
                const h = holidays[dateStr], s = shifts[dateStr] || {};
                return (
                  <div key={dateStr} className={`p-2 min-h-[120px] flex flex-col ${h ? 'bg-yellow-50' : 'bg-white'}`}>
                    <span className="font-black text-sm mb-1 text-black text-left">{d.getDate()}</span>
                    <div className="space-y-1">
                      {filteredShiftDefs.map(type => {
                        let list = s[type.id] || [];
                        if (searchTerm.trim()) list = list.filter(st => String(st.staffName || '').toUpperCase().includes(searchTerm.toUpperCase()));
                        if (list.length === 0) return null;
                        return (
                          <div key={type.id} className="text-[8px] leading-tight text-left">
                            <p className="font-black border-b border-slate-200 mb-0.5 uppercase text-black">{String(type.label)}</p>
                            {list.map(st => (<p key={st.staffId} className="font-medium text-black">• {String(st.staffName)}</p>))}
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
            <p className="text-xs font-bold uppercase underline">Disediakan Oleh:</p>
            <div>
              <div className="border-b border-black w-64 mx-auto mb-1"></div>
              <p className="text-[10px] font-black uppercase text-black">(TANDATANGAN & COP RASMI)</p>
            </div>
          </div>
          <div className="space-y-12">
            <p className="text-xs font-bold uppercase underline">Diluluskan Oleh:</p>
            <div>
              <div className="border-b border-black w-64 mx-auto mb-1 text-black"></div>
              <p className="text-[10px] font-black uppercase text-black">(TANDATANGAN & COP RASMI)</p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 font-sans pb-20 no-print">
      
      {headerVisible && (
        <header className="bg-white border-b sticky top-0 z-20 px-4 py-4 shadow-sm">
          <div className="max-w-[1600px] mx-auto flex flex-col lg:flex-row lg:items-center justify-between gap-4">
            <div className="flex items-center gap-3 shrink-0">
              <div className="bg-blue-600 p-2.5 rounded-xl text-white shadow-lg"><ClipboardList size={22} /></div>
              <div><h1 className="text-xl font-black text-slate-800 leading-none text-left">{String(appSettings.title)}</h1><p className="text-[10px] text-slate-400 font-bold uppercase mt-1 text-left">{String(appSettings.subtitle)}</p></div>
            </div>

            <div className="flex flex-wrap items-center justify-end flex-1 gap-3">
              <div className="flex bg-slate-100 p-1 rounded-2xl gap-1">
                <button onClick={() => setActiveTab('calendar')} className={`flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-bold transition-all ${activeTab === 'calendar' ? 'bg-white text-blue-600 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}><CalendarIcon size={18} /><span>On-Call</span></button>
                <button onClick={() => setActiveTab('movement')} className={`flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-bold transition-all ${activeTab === 'movement' ? 'bg-white text-blue-600 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}><MapPin size={18} /><span>Pergerakan</span></button>
                <button onClick={() => setActiveTab('staff')} className={`flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-bold transition-all ${activeTab === 'staff' ? 'bg-white text-blue-600 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}><Users size={18} /><span>Direktori</span></button>
                <button onClick={() => setActiveTab('settings')} className={`flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-bold transition-all ${activeTab === 'settings' ? 'bg-white text-blue-600 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}><Settings size={18} /><span>Tetapan</span></button>
              </div>

              <div className="flex items-center bg-slate-100 p-1 rounded-2xl gap-1 text-slate-800">
                <button onClick={() => changeMonth(-1)} className="p-2.5 hover:bg-white rounded-xl text-slate-500 transition-all"><ChevronLeft size={20} /></button>
                <div className="px-6 min-w-[160px] text-center text-sm font-black capitalize">{currentMonth.toLocaleString('ms-MY', { month: 'long', year: 'numeric' })}</div>
                <button onClick={() => changeMonth(1)} className="p-2.5 hover:bg-white rounded-xl text-slate-500 transition-all"><ChevronRight size={20} /></button>
              </div>

              <div className="flex bg-slate-100 p-1 rounded-2xl gap-1">
                <button onClick={() => openPrintOptions('calendar')} className="flex items-center gap-2 px-5 py-2.5 rounded-xl text-xs font-black text-slate-600 hover:bg-white hover:text-blue-600 transition-all border border-transparent hover:border-blue-100"><CalendarIcon size={16} /><span>Kalendar</span></button>
                <button onClick={() => openPrintOptions('ot')} className="flex items-center gap-2 px-5 py-2.5 rounded-xl text-xs font-black text-white bg-emerald-600 hover:bg-emerald-700 shadow-lg active:scale-95 transition-all"><FileText size={16} /><span>OT</span></button>
              </div>
            </div>
          </div>
        </header>
      )}

      <main className="max-w-[1600px] mx-auto p-4 md:p-6">
        {activeTab === 'calendar' ? (
          <div className="space-y-6 animate-in fade-in">
            <div className="flex flex-col gap-6 text-slate-800">
              <div className="relative w-full lg:w-96 text-slate-800">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                <input type="text" value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} placeholder="Cari nama staf dalam jadual..." className="w-full pl-12 pr-10 py-4 bg-white border border-slate-200 rounded-2xl font-bold text-sm outline-none shadow-sm" />
                {searchTerm && <button onClick={() => setSearchTerm('')} className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400"><X size={18} /></button>}
              </div>
              <div className="flex flex-wrap items-center gap-2 bg-white/50 p-4 rounded-[2rem] border border-slate-100 shadow-sm text-slate-800">
                <button onClick={() => setActiveShiftType('all')} className={`px-4 py-2.5 rounded-xl text-xs font-bold transition-all border ${activeShiftType === 'all' ? 'bg-slate-800 text-white border-slate-800 shadow-md' : 'bg-white text-slate-600 border-slate-200 hover:border-slate-400'}`}>Semua Syif</button>
                {shiftDefinitions.map(type => (<button key={type.id} onClick={() => setActiveShiftType(type.id)} className={`px-4 py-2.5 rounded-xl text-xs font-bold transition-all border ${activeShiftType === type.id ? `${getShiftColor(type.color, 'bg')} text-white border-transparent shadow-md` : 'bg-white text-slate-600 border-slate-200 hover:border-slate-400'}`}>{String(type.label)}</button>))}
              </div>
            </div>

            {activeShiftInfo && (
              <div className={`p-5 rounded-[2rem] flex items-center gap-4 border animate-in slide-in-from-top-2 ${getShiftColor(activeShiftInfo.color, 'light')}`}>
                <div className={`p-3 rounded-2xl bg-white shadow-md ${getShiftColor(activeShiftInfo.color, 'light').split(' ')[1]}`}><Clock size={24} /></div>
                <div><h3 className="font-black text-sm uppercase leading-none mb-1 text-slate-800 text-left">{String(activeShiftInfo.label)}</h3><p className="text-xs font-bold opacity-80 uppercase tracking-widest whitespace-pre-line text-slate-600 text-left">{String(activeShiftInfo.time)}</p></div>
              </div>
            )}

            {filteredStats && (
              <div className="bg-blue-600 text-white p-6 rounded-[2.5rem] shadow-xl flex items-center justify-between">
                <div className="flex items-center gap-4 text-left"><div className="bg-white/20 p-4 rounded-2xl backdrop-blur-md"><UserCheck size={32} /></div><div><h3 className="font-black text-2xl uppercase mb-1 text-left">{String(filteredStats.name)}</h3><p className="text-blue-100 text-xs font-bold uppercase tracking-widest text-left">{String(filteredStats.unit || 'Tiada Unit')}</p></div></div>
                <div className="flex items-center gap-4 text-right pr-6">
                  <div><p className="text-5xl font-black">{filteredStats.count}</p><p className="text-[10px] font-bold uppercase opacity-80">Hari Bertugas</p></div>
                  <div className="flex gap-2">
                    <button onClick={() => openPrintOptions('calendar')} className="p-4 bg-white text-blue-600 rounded-2xl shadow-xl hover:scale-105 transition-all"><Printer size={24} /></button>
                    <button onClick={() => openPrintOptions('ot')} className="p-4 bg-emerald-500 text-white rounded-2xl shadow-xl hover:scale-105 transition-all"><FileText size={24} /></button>
                  </div>
                </div>
              </div>
            )}

            <div className="bg-white rounded-[2.5rem] shadow-xl border border-slate-200 overflow-hidden">
              <div className="grid grid-cols-7 border-b border-slate-100 bg-slate-50/50 text-slate-400">
                {['Isnin', 'Selasa', 'Rabu', 'Khamis', 'Jumaat', 'Sabtu', 'Ahad'].map(day => (<div key={day} className="py-4 text-center text-[10px] font-black uppercase tracking-widest">{day}</div>))}
              </div>
              <div className="grid grid-cols-7 gap-px bg-slate-100 text-slate-800">
                {calendarDays.map((dateStr, idx) => {
                  if (!dateStr) return <div key={`empty-${idx}`} className="bg-slate-50/20 h-32 md:h-48 text-slate-800"></div>;
                  const d = new Date(dateStr), h = holidays[dateStr], s = shifts[dateStr] || {}, today = dateStr === new Date().toISOString().split('T')[0];
                  return (
                    <div key={dateStr} onClick={() => setSelectedDate(dateStr)} className={`min-h-[140px] md:min-h-[220px] p-2 flex flex-col group cursor-pointer hover:bg-blue-50/30 transition-colors ${h ? 'bg-yellow-50' : 'bg-white'} ${today ? 'ring-2 ring-inset ring-blue-500 z-10' : ''}`}>
                      <div className="flex justify-between items-start mb-2"><span className={`inline-flex items-center justify-center w-8 h-8 text-sm font-black rounded-full ${today ? 'bg-blue-600 text-white' : 'text-slate-700'}`}>{parseInt(dateStr.split('-')[2])}</span>{h && <div className="text-right leading-none text-red-500 font-black text-[7px] uppercase">Public Holiday</div>}</div>
                      {h && <p className="text-[8px] font-black text-red-600 uppercase mb-2 truncate text-left" title={String(h.name)}>{String(h.name)}</p>}
                      <div className="space-y-1.5 overflow-y-auto custom-scrollbar text-left text-slate-800">
                        {shiftDefinitions.map(type => {
                          let list = s[type.id]; if (!list || !Array.isArray(list)) return null;
                          if (activeShiftType !== 'all' && activeShiftType !== type.id) return null;
                          if (searchTerm.trim()) list = list.filter(st => String(st.staffName || '').toUpperCase().includes(searchTerm.toUpperCase()));
                          if (list.length === 0) return null;
                          return (
                            <div key={type.id} className="space-y-1 animate-in zoom-in-95 text-slate-800 text-left">
                              <div className={`flex items-center gap-1 text-[7px] font-black uppercase tracking-tighter opacity-70 ${getShiftColor(type.color, 'light').split(' ')[1]}`}><span>{String(type.label)}</span></div>
                              {list.map(st => (<div key={st.staffId} className={`px-2 py-1.5 rounded-xl text-[10px] font-black truncate border shadow-sm flex items-center gap-1.5 ${getShiftColor(type.color, 'light')} border-current/10`}><div className={`w-1.5 h-1.5 rounded-full ${getShiftColor(type.color, 'bg')} shrink-0`}></div><span className="truncate uppercase">{String(st.staffName)}</span></div>))}
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
          <div className="space-y-6 animate-in fade-in">
             <div className="flex flex-col md:flex-row justify-between items-start md:items-center bg-white p-6 rounded-3xl border border-slate-200 shadow-sm gap-4 text-slate-800">
              <div>
                <h2 className="text-2xl font-black uppercase text-left">Pergerakan Staf</h2>
                <p className="text-slate-500 font-medium text-left">Rekod pergerakan harian kakitangan farmasi</p>
              </div>
              <button onClick={() => setShowMovementModal(true)} className="flex items-center gap-2 px-8 py-4 bg-blue-600 text-white font-black rounded-2xl shadow-xl active:scale-95 transition-all"><Plus size={20} /><span>Kemaskini Pergerakan</span></button>
            </div>

            <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm flex flex-wrap gap-4 items-center">
              <span className="text-[10px] font-black uppercase text-slate-400 tracking-widest mr-2">Petunjuk Warna:</span>
              {MOVEMENT_TYPES.map(t => (
                <div key={t.id} className="flex items-center gap-2">
                  <div className={`w-3 h-3 rounded-full ${t.color}`}></div>
                  <span className="text-[11px] font-bold text-slate-600">{t.label}</span>
                </div>
              ))}
            </div>

            <div className="bg-white rounded-[2.5rem] shadow-xl border border-slate-200 overflow-hidden">
              <div className="grid grid-cols-7 border-b border-slate-100 bg-slate-50/50 text-slate-400">
                {['Isnin', 'Selasa', 'Rabu', 'Khamis', 'Jumaat', 'Sabtu', 'Ahad'].map(day => (<div key={day} className="py-4 text-center text-[10px] font-black uppercase tracking-widest">{day}</div>))}
              </div>
              <div className="grid grid-cols-7 gap-px bg-slate-100 text-slate-800">
                {calendarDays.map((dateStr, idx) => {
                  if (!dateStr) return <div key={`empty-${idx}`} className="bg-slate-50/20 h-40 text-slate-800"></div>;
                  const dayMovements = movements.filter(m => {
                    const start = new Date(m.dateStart);
                    const end = new Date(m.dateEnd);
                    const curr = new Date(dateStr);
                    return curr >= start && curr <= end;
                  });
                  return (
                    <div key={dateStr} className="min-h-[160px] p-2 bg-white flex flex-col group transition-colors hover:bg-slate-50/50 text-slate-800">
                      <span className="text-sm font-black text-slate-700 mb-2 text-left">{parseInt(dateStr.split('-')[2])}</span>
                      <div className="space-y-1.5 overflow-y-auto custom-scrollbar text-left text-slate-800">
                        {dayMovements.map(m => {
                          const typeCfg = MOVEMENT_TYPES.find(t => t.id === m.type) || MOVEMENT_TYPES[0];
                          return (
                            <div 
                              key={m.id} 
                              title={`${String(m.type)}: ${String(m.staffName)} ${m.type === 'Off' && m.timeInfo ? `(${m.timeInfo})` : ''} (${m.dateStart} hingga ${m.dateEnd})`}
                              className={`p-2 rounded-xl text-[9px] font-black text-white ${typeCfg.color} flex items-center justify-between group/item shadow-sm animate-in zoom-in-95 cursor-help transition-all`}
                            >
                              <div className="flex items-center gap-1.5 truncate">
                                {typeCfg.icon}
                                <span className="truncate uppercase">{String(m.staffName)}{m.type === 'Off' && m.timeInfo ? ` (${m.timeInfo})` : ''}</span>
                              </div>
                              <button onClick={(e) => { e.stopPropagation(); deleteMovement(m.id); }} className="opacity-0 group-hover/item:opacity-100 p-1 hover:bg-black/10 rounded transition-all text-white"><X size={12} /></button>
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
        ) : activeTab === 'staff' ? (
          <div className="bg-white rounded-3xl border border-slate-200 shadow-xl overflow-hidden animate-in fade-in text-slate-800">
            <div className="p-8 border-b flex flex-col md:flex-row md:items-center justify-between gap-6 bg-slate-50/50 text-slate-800">
              <div className="flex-1"><h2 className="text-2xl font-black uppercase text-left">Direktori Staf</h2></div>
              <div className="flex flex-col md:flex-row gap-4 w-full md:w-auto text-slate-800">
                <div className="relative w-full md:w-80 text-slate-800"><Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} /><input type="text" value={staffSearchTerm} onChange={(e) => setStaffSearchTerm(e.target.value)} placeholder="Cari nama atau unit..." className="w-full pl-12 pr-10 py-3.5 bg-white border border-slate-200 rounded-2xl font-bold text-sm outline-none shadow-inner text-slate-800" /></div>
                <button onClick={() => { setNewStaff({ name: '', phone: '', unit: '', id: null }); setShowStaffModal(true); }} className="w-full md:w-auto bg-blue-600 text-white px-6 py-3.5 rounded-2xl flex items-center justify-center gap-2 font-bold shadow-lg transition-all active:scale-95"><UserPlus size={20} /><span>Tambah Staf</span></button>
              </div>
            </div>
            <div className="p-4 overflow-x-auto"><table className="w-full text-left text-slate-800">
              <thead><tr className="text-slate-400 text-[10px] font-black uppercase tracking-widest border-b border-slate-100 text-left"><th className="px-6 py-4">Staf</th><th className="px-6 py-4">Telefon</th><th className="px-6 py-4 text-center">Hubungi</th><th className="px-6 py-4 text-right">Menu</th></tr></thead>
              <tbody className="divide-y divide-slate-50">
                {filteredStaffDirectory.map((person) => (
                  <tr key={person.id} className="hover:bg-slate-50/80 transition-colors">
                    <td className="px-6 py-5 text-slate-800 text-left"><div className="flex items-center gap-4 text-left text-slate-800"><div className="w-10 h-10 rounded-2xl bg-slate-100 flex items-center justify-center text-slate-600 font-black text-xs uppercase">{person.name ? String(person.name).substring(0, 2) : '??'}</div><div><span className="font-bold text-slate-700 block leading-tight text-left uppercase">{String(person.name)}</span><span className="text-[10px] font-black uppercase text-blue-500 tracking-wider text-left">{String(person.unit || 'Tiada Unit')}</span></div></div></td>
                    <td className="px-6 py-5 text-sm font-bold text-slate-500 text-left">{String(person.phone || '-')}</td>
                    <td className="px-6 py-5 text-center"><div className="flex justify-center gap-2">{person.phone && (<><a href={getWhatsAppLink(person.phone)} target="_blank" rel="noreferrer" className="p-2.5 bg-emerald-50 text-emerald-600 rounded-xl shadow-sm hover:bg-emerald-100 transition-all"><MessageCircle size={18} /></a><a href={`tel:${person.phone}`} className="p-2.5 bg-blue-50 text-blue-600 rounded-xl shadow-sm hover:bg-blue-100 transition-all"><Phone size={18} /></a></>)}</div></td>
                    <td className="px-6 py-5 text-right"><div className="flex justify-end gap-1"><button onClick={() => editStaff(person)} className="text-slate-300 hover:text-blue-500 p-2 transition-colors"><Edit2 size={20} /></button><button onClick={() => deleteDoc(doc(db, 'artifacts', appId, 'public', 'data', 'staff', person.id))} className="text-slate-300 hover:text-red-500 p-2 transition-colors"><Trash2 size={20} /></button></div></td>
                  </tr>
                ))}
              </tbody></table></div>
          </div>
        ) : (
          <div className="space-y-6 animate-in fade-in text-slate-800">
             <div className="bg-white rounded-3xl border border-slate-200 shadow-xl p-8 text-slate-800">
              <h2 className="text-2xl font-black mb-8 uppercase text-left">Maklumat Jadual</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-end text-slate-800">
                <div className="space-y-2 text-slate-800"><label className="text-[10px] font-black uppercase text-slate-400 ml-1 text-left block">Tajuk Utama</label><input type="text" value={appSettings.title} onChange={(e) => setAppSettings({...appSettings, title: e.target.value})} className="w-full px-5 py-4 bg-slate-50 border border-slate-100 rounded-2xl font-bold outline-none text-slate-800 shadow-inner" /></div>
                <div className="space-y-2 text-slate-800"><label className="text-[10px] font-black uppercase text-slate-400 ml-1 text-left block">Sub-Tajuk</label><input type="text" value={appSettings.subtitle} onChange={(e) => setAppSettings({...appSettings, subtitle: e.target.value})} className="w-full px-5 py-4 bg-slate-50 border border-slate-100 rounded-2xl font-bold outline-none text-slate-800 shadow-inner" /></div>
                <div className="md:col-span-2 flex justify-end mt-4"><button onClick={() => updateAppSettings(appSettings.title, appSettings.subtitle)} className="px-8 py-4 bg-slate-900 text-white font-black rounded-2xl shadow-lg active:scale-95 transition-all flex items-center gap-2"><Save size={20} /><span>Simpan Tetapan</span></button></div>
              </div>
            </div>

            <div className="bg-white rounded-3xl border border-slate-200 shadow-xl p-8 text-slate-800">
              <h2 className="text-2xl font-black mb-6 underline uppercase text-left">Cuti Umum</h2>
              <form onSubmit={addHoliday} className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8 text-slate-800">
                <input type="date" value={newHoliday.date} onChange={(e) => setNewHoliday({...newHoliday, date: e.target.value})} className="px-4 py-3.5 bg-slate-50 border border-slate-100 rounded-2xl font-bold text-slate-700 shadow-inner outline-none" required />
                <input type="text" value={newHoliday.name} onChange={(e) => setNewHoliday({...newHoliday, name: e.target.value})} placeholder="Nama Cuti Umum" className="px-4 py-3.5 bg-slate-50 border border-slate-100 rounded-2xl font-bold text-slate-700 shadow-inner outline-none" required />
                <button type="submit" className="bg-blue-600 text-white font-black rounded-2xl shadow-lg active:scale-95 transition-all"><Plus size={20} /><span>Tambah</span></button>
              </form>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-slate-800">
                {Object.values(holidays).sort((a,b) => String(a.date).localeCompare(String(b.date))).map(h => (<div key={h.id} className="flex items-center justify-between p-4 bg-yellow-50 border border-yellow-100 rounded-2xl shadow-sm text-left"><div><p className="text-xs font-black text-yellow-700">{new Date(h.date).toLocaleDateString('ms-MY')}</p><p className="text-[10px] font-bold text-yellow-600 uppercase text-left">{String(h.name)}</p></div><button onClick={() => deleteHoliday(h.id)} className="text-yellow-200 hover:text-red-500 transition-colors"><Trash2 size={18} /></button></div>))}
              </div>
            </div>

            <div className="bg-white rounded-3xl border border-slate-200 shadow-xl p-8 text-slate-800">
              <div className="flex justify-between items-center mb-6"><div><h2 className="text-2xl font-black uppercase text-left">Kategori Syif</h2></div><button onClick={() => { setEditingShiftDef({ label: '', time: '', color: 'blue' }); setShowShiftDefModal(true); }} className="bg-blue-600 text-white px-6 py-3.5 rounded-2xl flex items-center gap-2 font-bold shadow-lg transition-all active:scale-95"><Plus size={20} /><span>Tambah Syif</span></button></div>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 text-slate-800">
                {shiftDefinitions.map(def => (
                  <div key={def.id} className="p-6 rounded-[2.5rem] border border-slate-100 bg-slate-50 group transition-all hover:bg-white hover:shadow-xl text-left">
                    <div className={`w-12 h-12 rounded-2xl ${getShiftColor(def.color, 'bg')} mb-4 flex items-center justify-center text-white shadow-lg`}><Clock size={24} /></div>
                    <h3 className="font-black text-slate-800 text-sm uppercase leading-tight text-left font-black">{String(def.label)}</h3><p className="text-[10px] font-bold text-slate-400 mt-1 uppercase whitespace-pre-line leading-tight text-left">{String(def.time || "Masa belum diset")}</p>
                    <div className="flex gap-2 mt-4 transition-all opacity-0 group-hover:opacity-100 text-left"><button onClick={() => { setEditingShiftDef(def); setShowShiftDefModal(true); }} className="p-2.5 bg-white rounded-xl text-slate-600 hover:text-blue-600 border border-slate-100 shadow-sm"><Edit2 size={16} /></button><button onClick={() => deleteDoc(doc(db, 'artifacts', appId, 'public', 'data', 'shiftDefinitions', def.id))} className="p-2.5 bg-white rounded-xl text-slate-600 hover:text-red-600 border border-slate-100 shadow-sm"><Trash2 size={16} /></button></div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
      </main>

      {/* --- MODALS --- */}

      {showMovementModal && (
        <div className="fixed inset-0 z-[130] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-md animate-in fade-in">
          <div className="bg-white w-full max-w-md rounded-[2.5rem] shadow-2xl overflow-hidden text-slate-800">
            <div className="p-8 border-b bg-slate-50/80 flex justify-between items-center text-slate-800">
              <div><h3 className="text-xl font-black uppercase text-slate-800">Rekod Pergerakan</h3><p className="text-xs font-bold text-slate-400">Daftar cuti atau aktiviti luar harian</p></div>
              <button onClick={() => { setShowMovementModal(false); setMovementModalSearch(''); }} className="p-2 hover:bg-white rounded-full border border-slate-100 bg-white shadow-sm"><X size={20} /></button>
            </div>
            <form onSubmit={saveMovement} className="p-8 space-y-6 text-slate-800">
              <div className="space-y-2 text-slate-800">
                <label className="text-[10px] font-black uppercase text-slate-400 ml-1 text-left block">Cari & Pilih Kakitangan</label>
                {!newMovement.staffId ? (
                  <div className="relative text-slate-800">
                    <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                    <input type="text" value={movementModalSearch} onChange={(e) => setMovementModalSearch(e.target.value)} placeholder="Taip nama staf (eg: AFIF)..." className="w-full pl-12 pr-5 py-4 bg-slate-50 border border-slate-100 rounded-2xl font-bold text-slate-700 shadow-inner outline-none focus:ring-2 focus:ring-blue-500" />
                    {movementModalSearch && (
                      <div className="absolute top-full left-0 right-0 mt-2 bg-white border border-slate-100 rounded-2xl shadow-2xl z-[140] overflow-hidden max-h-48 overflow-y-auto">
                        {filteredMovementStaff.map(s => (
                          <div key={s.id} onClick={() => { setNewMovement({...newMovement, staffId: s.id, staffName: String(s.name)}); setMovementModalSearch(''); }} className="p-4 hover:bg-blue-50 cursor-pointer border-b border-slate-50 transition-colors flex items-center gap-3 text-left">
                            <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center text-blue-600"><User size={14} /></div>
                            <span className="font-bold text-sm text-slate-800 uppercase">{String(s.name)}</span>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="p-4 bg-blue-50 border border-blue-100 rounded-2xl flex items-center justify-between text-slate-800">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full bg-blue-600 text-white flex items-center justify-center shadow-lg font-black"><UserCheck size={20} /></div>
                      <span className="font-black text-blue-700 uppercase">{String(newMovement.staffName)}</span>
                    </div>
                    <button type="button" onClick={() => setNewMovement({...newMovement, staffId: '', staffName: ''})} className="p-2 text-blue-400 hover:text-red-500 transition-colors"><X size={18} /></button>
                  </div>
                )}
              </div>

              <div className="space-y-1 text-slate-800 text-left">
                <label className="text-[10px] font-black uppercase text-slate-400 ml-1 text-left block">Jenis Pergerakan</label>
                <div className="grid grid-cols-2 gap-2 text-slate-800">
                  {MOVEMENT_TYPES.map(type => (
                    <button key={type.id} type="button" onClick={() => setNewMovement({...newMovement, type: type.id})} className={`p-3 rounded-xl text-[10px] font-black border-2 transition-all flex items-center gap-2 ${newMovement.type === type.id ? 'border-blue-600 bg-blue-50 text-blue-700 shadow-sm' : 'border-slate-100 bg-white text-slate-400'}`}>
                      <div className={`w-2 h-2 rounded-full ${type.color}`}></div>{type.label}
                    </button>
                  ))}
                </div>
              </div>

              {newMovement.type === 'Off' && (
                <div className="space-y-1 animate-in slide-in-from-top-2 text-slate-800 text-left">
                  <label className="text-[10px] font-black uppercase text-slate-400 ml-1 text-left block">Masa Off (eg: 8:00am - 12:00pm)</label>
                  <div className="relative">
                    <Clock className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                    <input type="text" value={newMovement.timeInfo} onChange={(e) => setNewMovement({...newMovement, timeInfo: e.target.value})} placeholder="Masukkan waktu..." className="w-full pl-12 pr-5 py-4 bg-slate-50 border border-slate-100 rounded-2xl font-bold text-slate-700 shadow-inner outline-none focus:ring-2 focus:ring-blue-500" />
                  </div>
                </div>
              )}

              <div className="grid grid-cols-2 gap-4 text-slate-800 text-left">
                <div className="space-y-1 text-slate-800"><label className="text-[10px] font-black uppercase text-slate-400 ml-1 text-left block">Mula</label><input type="date" value={newMovement.dateStart} onChange={(e) => setNewMovement({...newMovement, dateStart: e.target.value})} className="w-full px-4 py-3 bg-slate-50 border border-slate-100 rounded-2xl font-bold text-slate-700 shadow-inner outline-none" required /></div>
                <div className="space-y-1 text-slate-800"><label className="text-[10px] font-black uppercase text-slate-400 ml-1 text-left block">Tamat</label><input type="date" value={newMovement.dateEnd} onChange={(e) => setNewMovement({...newMovement, dateEnd: e.target.value})} className="w-full px-4 py-3 bg-slate-50 border border-slate-100 rounded-2xl font-bold text-slate-700 shadow-inner outline-none" required /></div>
              </div>
              <button type="submit" className="w-full py-4 bg-slate-900 text-white font-black rounded-2xl shadow-xl active:scale-95 mt-4 transition-all disabled:opacity-50" disabled={!newMovement.staffId}>Simpan Pergerakan</button>
            </form>
          </div>
        </div>
      )}

      {showPrintOptions && (
        <div className="fixed inset-0 z-[120] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-md animate-in fade-in">
          <div className="bg-white w-full max-w-lg rounded-[2.5rem] shadow-2xl overflow-hidden animate-in zoom-in-95 text-slate-800">
            <div className="p-8 border-b flex justify-between items-center bg-slate-50/80">
              <div><h3 className="text-xl font-black uppercase text-slate-800 text-left">Tetapan Laporan</h3><p className="text-xs font-bold text-slate-400 text-left">Pilih syif untuk dipaparkan</p></div>
              <button onClick={() => setShowPrintOptions(false)} className="p-2 hover:bg-white rounded-full border border-slate-100 bg-white shadow-sm"><X size={20} /></button>
            </div>
            <div className="p-8 max-h-[50vh] overflow-y-auto custom-scrollbar text-slate-800">
              <div className="flex justify-between items-center mb-6">
                <span className="text-[10px] font-black uppercase text-slate-400 tracking-widest text-left">Senarai Syif</span>
                <button onClick={() => setSelectedPrintShifts(selectedPrintShifts.length === shiftDefinitions.length ? [] : shiftDefinitions.map(s => s.id))} className="text-[10px] font-bold text-blue-600 hover:underline">Pilih Semua</button>
              </div>
              <div className="grid grid-cols-1 gap-3 text-slate-800">
                {shiftDefinitions.map(def => {
                  const isChecked = selectedPrintShifts.includes(def.id);
                  return (
                    <div key={def.id} onClick={() => togglePrintShift(def.id)} className={`flex items-center gap-4 p-4 rounded-2xl cursor-pointer border-2 transition-all ${isChecked ? 'border-blue-600 bg-blue-50/50' : 'border-slate-100 bg-white hover:border-slate-200'}`}>
                      <div className={`w-6 h-6 rounded-lg flex items-center justify-center border-2 transition-all ${isChecked ? 'bg-blue-600 border-blue-600 text-white' : 'border-slate-200 bg-white'}`}>{isChecked && <Check size={14} strokeWidth={4} />}</div>
                      <div className="flex-1 text-slate-800 text-left"><p className={`font-black text-sm uppercase leading-none mb-1 ${isChecked ? 'text-blue-700' : 'text-slate-700'}`}>{String(def.label)}</p><p className="text-[9px] font-bold text-slate-400 text-left">{String(def.time?.split('\n')[0])}</p></div>
                    </div>
                  );
                })}
              </div>
            </div>
            <div className="p-8 bg-slate-50 border-t"><button onClick={handlePrintAction} disabled={selectedPrintShifts.length === 0} className="w-full py-4 bg-blue-600 disabled:bg-slate-300 text-white font-black rounded-2xl shadow-xl flex items-center justify-center gap-3 active:scale-95 transition-all"><Printer size={20} /><span>Proses Cetakan</span></button></div>
          </div>
        </div>
      )}

      {selectedDate && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-md animate-in fade-in no-print text-slate-800">
          <div className="bg-white w-full max-w-6xl rounded-[3rem] shadow-2xl overflow-hidden animate-in zoom-in-95">
            <div className="p-8 border-b flex flex-col md:flex-row md:items-center justify-between bg-slate-50/80 gap-4 text-slate-800">
              <div className="text-left"><h3 className="text-2xl font-black text-slate-800 tracking-tight uppercase text-left">Atur Jadual Staf</h3><p className={`font-bold text-sm ${holidays[selectedDate] ? 'text-red-500' : 'text-slate-500'} text-left block`}>📅 {new Date(selectedDate).toLocaleDateString('ms-MY', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })} {holidays[selectedDate] && `• CUTI: ${String(holidays[selectedDate].name)}`}</p></div>
              <button onClick={() => setSelectedDate(null)} className="p-4 bg-white hover:bg-slate-100 rounded-full shadow-sm border border-slate-100 bg-white shadow-sm"><X size={24} /></button>
            </div>
            <div className="p-6 md:p-8 bg-white max-h-[70vh] overflow-y-auto custom-scrollbar text-slate-800">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 items-start text-slate-800">
                {shiftDefinitions.map(type => {
                  const assigned = shifts[selectedDate]?.[type.id] || [], query = modalSearchTerms[type.id] || "";
                  const results = query.trim().length >= 1 ? staff.filter(s => String(s.name || '').toUpperCase().includes(query.toUpperCase()) && !assigned.some(a => a.staffId === s.id)).sort((a,b) => String(a.name || '').localeCompare(String(b.name || ''))).slice(0, 10) : [];
                  return (
                    <div key={type.id} className="space-y-4 p-5 rounded-[2.5rem] border border-slate-100 bg-slate-50/50 shadow-sm text-slate-800 text-left">
                      <div className="flex items-center justify-between border-b pb-3 text-slate-800 text-left"><div className="flex flex-col text-left"><div className="flex items-center gap-2 text-left text-slate-800"><div className={`w-3.5 h-3.5 rounded-full ${getShiftColor(type.color, 'bg')}`}></div><label className="text-[12px] font-black uppercase text-left block font-black">{String(type.label)}</label></div><span className="text-[9px] text-slate-400 font-bold ml-5 uppercase text-left block">Waktu: {String(type.time?.split('\n')[0])}</span></div><span className="bg-white px-3 py-1 rounded-full text-[10px] font-black border border-slate-200 shadow-sm">{assigned.length}</span></div>
                      <div className="relative text-slate-800"><Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-300" size={14} /><input type="text" value={query} onChange={(e) => setModalSearchTerms({ ...modalSearchTerms, [type.id]: e.target.value })} placeholder="Cari & tambah staf..." className="w-full pl-9 pr-4 py-3 bg-white border border-slate-200 rounded-2xl text-[11px] font-bold outline-none focus:ring-2 focus:ring-blue-500 transition-all shadow-inner text-slate-800" /></div>
                      <div className="space-y-2 max-h-64 overflow-y-auto pr-1 custom-scrollbar text-left text-slate-800">
                        {assigned.map(s => (
                          <div key={s.staffId} onClick={() => toggleStaffOnShift(selectedDate, type.id, s.staffId)} className={`flex items-center justify-between p-3 rounded-2xl cursor-pointer border shadow-sm ${getShiftColor(type.color, 'light').split(' ')[0]} border-current/20 font-bold ring-1 ring-current/10 transition-all text-slate-800`}>
                            <div className="flex flex-col text-left"><span className="text-[11px] truncate uppercase text-left font-black">{String(s.staffName)}</span><span className="text-[8px] font-black uppercase tracking-tighter opacity-50 text-left">{String(s.unit || 'Tiada Unit')}</span></div>
                            <div className="flex items-center gap-2">{s.staffPhone && (<a href={getWhatsAppLink(s.staffPhone)} target="_blank" onClick={(e) => e.stopPropagation()} className="p-2 bg-white text-emerald-600 rounded-lg shadow-sm border border-emerald-100 hover:bg-emerald-50 transition-colors"><MessageCircle size={14} /></a>)}<CheckCircle2 size={18} className="text-current shrink-0" /></div>
                          </div>
                        ))}
                        {results.map(s => (
                          <div key={s.id} onClick={() => { toggleStaffOnShift(selectedDate, type.id, s.id); setModalSearchTerms({ ...modalSearchTerms, [type.id]: "" }); }} className="flex items-center justify-between p-3 bg-white border border-transparent hover:border-slate-300 rounded-2xl cursor-pointer text-slate-600 shadow-sm transition-all hover:bg-slate-50 text-left text-slate-800">
                            <div className="flex flex-col text-left"><span className="text-[11px] truncate uppercase text-left font-black">{String(s.name)}</span><span className="text-[8px] font-black uppercase tracking-tighter opacity-50 text-left">{String(s.unit || 'Tiada Unit')}</span></div><Plus size={14} className="text-slate-300" />
                          </div>
                        ))}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
            <div className="p-8 bg-slate-50 border-t flex justify-center"><button onClick={() => setSelectedDate(null)} className="px-16 py-4 bg-slate-900 text-white font-black rounded-2xl hover:bg-slate-800 transition-all shadow-xl uppercase tracking-widest text-sm active:scale-95">Simpan Jadual</button></div>
          </div>
        </div>
      )}

      {showStaffModal && (
        <div className="fixed inset-0 z-[130] flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-md animate-in fade-in text-slate-800">
          <div className="bg-white w-full max-w-md rounded-[2.5rem] shadow-2xl overflow-hidden p-8 animate-in slide-in-from-bottom-8">
            <div className="flex justify-between items-center mb-6 text-slate-800"><h3 className="text-xl font-black uppercase text-slate-800 text-left">Edit Maklumat Staf</h3><button onClick={() => setShowStaffModal(false)} className="bg-white"><X size={20} /></button></div>
            <form onSubmit={saveStaff} className="space-y-5 text-slate-800">
              <input autoFocus type="text" value={newStaff.name} onChange={(e) => setNewStaff({...newStaff, name: e.target.value})} className="w-full px-5 py-4 bg-slate-50 border border-slate-100 rounded-2xl font-bold focus:ring-2 focus:ring-blue-500 outline-none shadow-sm text-slate-700" placeholder="Nama Penuh Staf" required />
              <input type="tel" value={newStaff.phone} onChange={(e) => setNewStaff({...newStaff, phone: e.target.value})} className="w-full px-5 py-4 bg-slate-50 border border-slate-100 rounded-2xl font-bold focus:ring-2 focus:ring-blue-500 outline-none shadow-sm text-slate-700" placeholder="Nombor WhatsApp" />
              <input type="text" value={newStaff.unit} onChange={(e) => setNewStaff({...newStaff, unit: e.target.value})} className="w-full px-5 py-4 bg-slate-50 border border-slate-100 rounded-2xl font-bold focus:ring-2 focus:ring-blue-500 outline-none shadow-sm text-slate-700" placeholder="Unit / Seksyen" />
              <button type="submit" className="w-full py-4 bg-blue-600 text-white font-black rounded-2xl shadow-lg mt-4 active:scale-95 transition-all">Simpan</button>
            </form>
          </div>
        </div>
      )}

      {showShiftDefModal && editingShiftDef && (
        <div className="fixed inset-0 z-[130] flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-md animate-in fade-in text-slate-800">
          <div className="bg-white w-full max-w-md rounded-[2.5rem] shadow-2xl overflow-hidden p-8 animate-in zoom-in-95 text-slate-800">
            <div className="flex justify-between items-center mb-6 text-slate-800"><h3 className="text-xl font-black uppercase text-slate-800 text-left">Tetapan Syif</h3><button onClick={() => setShowShiftDefModal(false)} className="bg-white shadow-sm rounded-full p-1"><X size={20} /></button></div>
            <form onSubmit={saveShiftDef} className="space-y-6 text-slate-800 text-left">
              <input type="text" value={editingShiftDef.label} onChange={(e) => setEditingShiftDef({...editingShiftDef, label: e.target.value})} className="w-full px-5 py-4 bg-slate-50 border-none rounded-2xl font-bold outline-none text-slate-700 shadow-inner" placeholder="Nama Syif" required />
              <textarea rows={3} value={editingShiftDef.time} onChange={(e) => setEditingShiftDef({...editingShiftDef, time: e.target.value})} className="w-full px-5 py-4 bg-slate-50 border-none rounded-2xl font-bold outline-none resize-none text-slate-700 shadow-inner" placeholder="Waktu Bertugas" />
              <div className="flex flex-wrap gap-2.5 pt-1 text-slate-800 text-left">{COLOR_OPTIONS.map(c => (<button key={c.id} type="button" onClick={() => setEditingShiftDef({...editingShiftDef, color: c.id})} className={`w-10 h-10 rounded-xl border-4 ${c.bg} ${editingShiftDef.color === c.id ? 'border-slate-800 scale-110 shadow-md' : 'border-transparent'}`} />))}</div>
              <button type="submit" className="w-full py-4 bg-slate-900 text-white font-black rounded-2xl shadow-lg active:scale-95 transition-all text-slate-800">Simpan Tetapan</button>
            </form>
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

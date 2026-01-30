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
  Printer,
  FileText,
  MapPin,
  Coffee,
  BookOpen,
  Stethoscope,
  Plane,
  User
} from 'lucide-react';

// --- Konfigurasi Firebase (Go Live Safe) ---
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

// --- KONFIGURASI WARNA PERGERAKAN ---
const COLOR_OPTIONS = [
  { id: 'indigo', bg: 'bg-indigo-600', border: 'border-indigo-600', light: 'bg-indigo-50 text-indigo-700' },
  { id: 'orange', bg: 'bg-orange-500', border: 'border-orange-500', light: 'bg-orange-50 text-orange-700' },
  { id: 'emerald', bg: 'bg-emerald-500', border: 'border-emerald-500', light: 'bg-emerald-700 text-white' },
  { id: 'blue', bg: 'bg-blue-500', border: 'border-blue-500', light: 'bg-blue-700 text-blue-700' },
  { id: 'pink', bg: 'bg-pink-500', border: 'border-pink-500', light: 'bg-pink-50 text-pink-700' },
  { id: 'red', bg: 'bg-red-500', border: 'border-red-500', light: 'bg-red-50 text-red-700' },
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

const formatLocalDate = (year, month, day) => {
  return `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
};

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
  const [showMovementModal, setShowMovementModal] = useState(false);
  const [movementSearch, setMovementSearch] = useState('');
  const [newStaff, setNewStaff] = useState({ name: '', unit: '' });
  const [newMovement, setNewMovement] = useState({ staffId: '', staffName: '', type: 'Bercuti', dateStart: '', dateEnd: '' });

  // --- Auth & Sync ---
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
      let defs = s.docs.map(d => ({ id: d.id, ...d.data() })).sort((a,b) => (a.order || 0) - (b.order || 0));
      setShiftDefinitions(defs);
    });
    const unsubMov = onSnapshot(collection(db, 'artifacts', appId, 'public', 'data', 'movements'), (s) => 
      setMovements(s.docs.map(d => ({ id: d.id, ...d.data() }))));
    return () => { unsubStaff(); unsubShifts(); unsubDef(); unsubMov(); };
  }, [user]);

  // --- Handlers ---
  const saveMovement = async (e) => {
    e.preventDefault();
    if (!newMovement.staffId || !newMovement.dateStart || !newMovement.dateEnd) return;
    await addDoc(collection(db, 'artifacts', appId, 'public', 'data', 'movements'), newMovement);
    setShowMovementModal(false);
    setNewMovement({ staffId: '', staffName: '', type: 'Bercuti', dateStart: '', dateEnd: '' });
    setMovementSearch('');
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

  const filteredMovementStaff = staff.filter(s => s.name.toUpperCase().includes(movementSearch.toUpperCase())).slice(0, 5);

  if (!user) return <div className="h-screen flex items-center justify-center font-black text-blue-600 animate-pulse">MEMULAKAN SISTEM...</div>;

  return (
    <div className="min-h-screen bg-slate-50 font-sans pb-20">
      <header className="bg-white border-b sticky top-0 z-20 px-6 py-4 shadow-sm flex justify-between items-center">
        <div className="flex items-center gap-3">
          <div className="bg-blue-600 p-2 rounded-xl text-white shadow-lg"><ClipboardList size={22} /></div>
          <div className="text-left"><h1 className="text-xl font-black text-slate-800 leading-none">E-ONCALL FARMASI</h1><p className="text-[10px] text-slate-400 font-bold uppercase mt-1">HOSPITAL SULTANAH NORA ISMAIL</p></div>
        </div>
        <nav className="flex bg-slate-100 p-1 rounded-2xl gap-1">
          <button onClick={() => setActiveTab('calendar')} className={`px-6 py-2.5 rounded-xl text-xs font-black transition-all ${activeTab === 'calendar' ? 'bg-white text-blue-600 shadow-sm' : 'text-slate-500'}`}>ON-CALL</button>
          <button onClick={() => setActiveTab('movement')} className={`px-6 py-2.5 rounded-xl text-xs font-black transition-all ${activeTab === 'movement' ? 'bg-white text-blue-600 shadow-sm' : 'text-slate-500'}`}>PERGERAKAN</button>
          <button onClick={() => setActiveTab('staff')} className={`px-6 py-2.5 rounded-xl text-xs font-black transition-all ${activeTab === 'staff' ? 'bg-white text-blue-600 shadow-sm' : 'text-slate-500'}`}>DIREKTORI</button>
        </nav>
      </header>

      <main className="max-w-[1600px] mx-auto p-6">
        {activeTab === 'movement' && (
          <div className="space-y-6 animate-in fade-in">
            <div className="bg-white p-8 rounded-[2.5rem] border border-slate-200 shadow-sm flex justify-between items-center">
              <div className="text-left"><h2 className="text-2xl font-black uppercase">Pergerakan Staf</h2><p className="text-slate-500 font-bold">Rekod cuti harian kakitangan farmasi</p></div>
              <button onClick={() => setShowMovementModal(true)} className="flex items-center gap-2 px-8 py-4 bg-blue-600 text-white font-black rounded-2xl shadow-xl active:scale-95 transition-all"><Plus size={20} /><span>Kemaskini Pergerakan</span></button>
            </div>

            <div className="bg-white p-4 rounded-2xl border flex flex-wrap gap-4 items-center">
              <span className="text-[10px] font-black uppercase text-slate-400 mr-2">Petunjuk:</span>
              {MOVEMENT_TYPES.map(t => (
                <div key={t.id} className="flex items-center gap-2">
                  <div className={`w-3 h-3 rounded-full ${t.color}`}></div><span className="text-[11px] font-bold text-slate-600">{t.label}</span>
                </div>
              ))}
            </div>

            <div className="bg-white rounded-[2.5rem] shadow-xl border overflow-hidden">
              <div className="grid grid-cols-7 border-b bg-slate-50/50 text-[10px] font-black uppercase text-center py-4 text-slate-400">
                {['Isnin', 'Selasa', 'Rabu', 'Khamis', 'Jumaat', 'Sabtu', 'Ahad'].map(d => <div key={d}>{d}</div>)}
              </div>
              <div className="grid grid-cols-7 gap-px bg-slate-100">
                {calendarDays.map((dStr, idx) => {
                  if (!dStr) return <div key={idx} className="bg-slate-50/20 h-40"></div>;
                  const dayMovs = movements.filter(m => dStr >= m.dateStart && dStr <= m.dateEnd);
                  return (
                    <div key={dStr} className="min-h-[160px] p-2 bg-white text-left">
                      <span className="text-sm font-black text-slate-700">{parseInt(dStr.split('-')[2])}</span>
                      <div className="mt-2 space-y-1">
                        {dayMovs.map(m => {
                          const type = MOVEMENT_TYPES.find(t => t.id === m.type);
                          return (
                            <div key={m.id} className={`p-1.5 rounded-lg text-[9px] font-black text-white ${type?.color} flex justify-between items-center group`}>
                              <span className="truncate uppercase">{m.staffName}</span>
                              <button onClick={() => deleteDoc(doc(db, 'artifacts', appId, 'public', 'data', 'movements', m.id))} className="opacity-0 group-hover:opacity-100"><X size={10}/></button>
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
        )}

        {/* Tab Direktori & Kalendar tetap berfungsi seperti biasa */}
        {activeTab === 'staff' && (
          <div className="bg-white p-8 rounded-[2.5rem] border shadow-xl animate-in fade-in">
             <div className="flex justify-between items-center mb-8">
               <h2 className="text-2xl font-black uppercase">Direktori Staf</h2>
               <button onClick={() => setShowStaffModal(true)} className="bg-blue-600 text-white px-8 py-4 rounded-2xl font-black">TAMBAH STAF</button>
             </div>
             <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {staff.map(s => (
                  <div key={s.id} className="p-5 bg-slate-50 rounded-3xl border flex justify-between items-center">
                    <div className="text-left"><p className="font-black uppercase text-slate-800">{s.name}</p><p className="text-[10px] font-bold text-blue-500 uppercase tracking-widest">{s.unit}</p></div>
                    <button onClick={() => deleteDoc(doc(db, 'artifacts', appId, 'public', 'data', 'staff', s.id))} className="text-slate-300 hover:text-red-500"><Trash2 size={20}/></button>
                  </div>
                ))}
             </div>
          </div>
        )}
      </main>

      {/* --- MODAL PERGERAKAN --- */}
      {showMovementModal && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-md z-[100] flex items-center justify-center p-4">
          <div className="bg-white w-full max-w-md rounded-[3rem] p-10 shadow-2xl animate-in zoom-in-95">
            <h3 className="text-2xl font-black uppercase mb-6 text-left">Kemaskini Pergerakan</h3>
            <form onSubmit={saveMovement} className="space-y-4">
              <div className="text-left">
                <label className="text-[10px] font-black uppercase text-slate-400 ml-2">Cari Nama Staf</label>
                {!newMovement.staffId ? (
                  <div className="relative">
                    <input type="text" placeholder="TAIP NAMA..." className="w-full p-5 bg-slate-50 rounded-2xl font-bold border outline-none" value={movementSearch} onChange={e => setMovementSearch(e.target.value)}/>
                    {movementSearch && (
                      <div className="absolute top-full left-0 right-0 bg-white border rounded-2xl mt-1 shadow-xl z-50 overflow-hidden">
                        {filteredMovementStaff.map(s => (
                          <div key={s.id} onClick={() => { setNewMovement({...newMovement, staffId: s.id, staffName: s.name}); setMovementSearch(''); }} className="p-4 hover:bg-blue-50 cursor-pointer font-bold border-b text-left uppercase text-sm">{s.name}</div>
                        ))}
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="p-5 bg-blue-50 rounded-2xl flex justify-between items-center border border-blue-200">
                    <span className="font-black text-blue-700 uppercase">{newMovement.staffName}</span>
                    <button type="button" onClick={() => setNewMovement({...newMovement, staffId: '', staffName: ''})}><X size={18} className="text-blue-400"/></button>
                  </div>
                )}
              </div>
              <div className="text-left">
                <label className="text-[10px] font-black uppercase text-slate-400 ml-2">Jenis Pergerakan</label>
                <select className="w-full p-5 bg-slate-50 rounded-2xl font-bold border outline-none" value={newMovement.type} onChange={e => setNewMovement({...newMovement, type: e.target.value})}>
                  {MOVEMENT_TYPES.map(t => <option key={t.id} value={t.id}>{t.label}</option>)}
                </select>
              </div>
              <div className="grid grid-cols-2 gap-4 text-left">
                <div><label className="text-[10px] font-black uppercase text-slate-400 ml-2">Tarikh Mula</label><input type="date" className="w-full p-5 bg-slate-50 rounded-2xl font-bold border outline-none" onChange={e => setNewMovement({...newMovement, dateStart: e.target.value})}/></div>
                <div><label className="text-[10px] font-black uppercase text-slate-400 ml-2">Tarikh Tamat</label><input type="date" className="w-full p-5 bg-slate-50 rounded-2xl font-bold border outline-none" onChange={e => setNewMovement({...newMovement, dateEnd: e.target.value})}/></div>
              </div>
              <button type="submit" className="w-full py-5 bg-blue-600 text-white rounded-2xl font-black shadow-xl mt-4 active:scale-95 transition-all">SIMPAN REKOD</button>
              <button type="button" onClick={() => setShowMovementModal(false)} className="w-full py-2 font-bold text-slate-400 uppercase text-xs">Batal</button>
            </form>
          </div>
        </div>
      )}

      {/* --- MODAL TAMBAH STAF --- */}
      {showStaffModal && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-md z-[100] flex items-center justify-center p-4">
          <div className="bg-white w-full max-w-md rounded-[3rem] p-10 shadow-2xl">
            <h3 className="text-2xl font-black uppercase mb-6 text-left">Daftar Staf</h3>
            <div className="space-y-4">
              <input type="text" placeholder="NAMA PENUH" className="w-full p-5 bg-slate-50 rounded-2xl font-bold border outline-none" onChange={e => setNewStaff({...newStaff, name: e.target.value.toUpperCase()})}/>
              <input type="text" placeholder="UNIT (EG: OPD)" className="w-full p-5 bg-slate-50 rounded-2xl font-bold border outline-none" onChange={e => setNewStaff({...newStaff, unit: e.target.value.toUpperCase()})}/>
              <button onClick={async () => { if(newStaff.name) { await addDoc(collection(db, 'artifacts', appId, 'public', 'data', 'staff'), newStaff); setShowStaffModal(false); } }} className="w-full py-5 bg-blue-600 text-white rounded-2xl font-black shadow-xl">SIMPAN</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default App;

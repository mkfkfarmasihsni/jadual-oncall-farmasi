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
  MessageCircle, Plus, Settings, Edit2, Save, Search, UserCheck, Printer, FileText
} from 'lucide-react';

// --- CONFIGURASI FIX ---
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
const app = initializeApp(firebaseConfig);
const db = getFirestore(app);
const auth = getAuth(app);

const COLOR_OPTIONS = [
  { id: 'indigo', bg: 'bg-indigo-600', light: 'bg-indigo-50 text-indigo-700' },
  { id: 'orange', bg: 'bg-orange-500', light: 'bg-orange-50 text-orange-700' },
  { id: 'emerald', bg: 'bg-emerald-500', light: 'bg-emerald-50 text-emerald-700' },
  { id: 'blue', bg: 'bg-blue-500', light: 'bg-blue-50 text-blue-700' },
];

const App = () => {
  const [user, setUser] = useState(null);
  const [activeTab, setActiveTab] = useState('calendar');
  const [staff, setStaff] = useState([]);
  const [shifts, setShifts] = useState({});
  const [shiftDefinitions, setShiftDefinitions] = useState([]);
  const [currentMonth, setCurrentMonth] = useState(new Date(2026, 0, 1));
  const [selectedDate, setSelectedDate] = useState(null);
  const [showStaffModal, setShowStaffModal] = useState(false);
  const [newStaff, setNewStaff] = useState({ name: '', unit: '' });

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
          { label: 'Evening Shift', time: '2PM-11PM', color: 'orange', order: 2 }
        ];
        defaults.forEach(d => addDoc(collection(db, 'artifacts', appId, 'public', 'data', 'shiftDefinitions'), d));
      }
      setShiftDefinitions(defs.sort((a,b) => a.order - b.order));
    });
    return () => { unsubStaff(); unsubShifts(); unsubDef(); };
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

  if (!user) return <div className="h-screen flex items-center justify-center font-bold text-blue-600">Memuatkan Sistem...</div>;

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 pb-10">
      <header className="bg-white border-b p-4 sticky top-0 z-20 shadow-sm flex justify-between items-center">
        <div className="flex items-center gap-2">
          <div className="bg-blue-600 p-2 rounded-lg text-white"><ClipboardList size={20}/></div>
          <h1 className="font-black text-lg">E-ONCALL FARMASI</h1>
        </div>
        <nav className="flex bg-slate-100 p-1 rounded-xl gap-1">
          <button onClick={() => setActiveTab('calendar')} className={`px-4 py-2 rounded-lg text-xs font-bold ${activeTab === 'calendar' ? 'bg-white shadow text-blue-600' : 'text-slate-500'}`}>Kalendar</button>
          <button onClick={() => setActiveTab('staff')} className={`px-4 py-2 rounded-lg text-xs font-bold ${activeTab === 'staff' ? 'bg-white shadow text-blue-600' : 'text-slate-500'}`}>Staf</button>
        </nav>
      </header>

      <main className="max-w-7xl mx-auto p-4">
        {activeTab === 'calendar' ? (
          <div className="bg-white rounded-3xl shadow-xl border overflow-hidden">
            <div className="p-6 border-b flex justify-between items-center">
              <button onClick={() => setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() - 1, 1))}><ChevronLeft/></button>
              <h2 className="font-black uppercase">{currentMonth.toLocaleString('ms-MY', { month: 'long', year: 'numeric' })}</h2>
              <button onClick={() => setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1, 1))}><ChevronRight/></button>
            </div>
            <div className="grid grid-cols-7 gap-px bg-slate-200">
              {['Isnin','Selasa','Rabu','Khamis','Jumaat','Sabtu','Ahad'].map(d => <div key={d} className="bg-slate-50 p-2 text-[10px] font-black text-center">{d}</div>)}
              {calendarDays.map((d, i) => (
                <div key={i} onClick={() => d && setSelectedDate(d)} className={`min-h-[120px] p-2 bg-white ${d ? 'cursor-pointer hover:bg-blue-50' : ''}`}>
                  {d && <><span className="text-xs font-bold">{parseInt(d.split('-')[2])}</span>
                  <div className="mt-1 space-y-1">
                    {shiftDefinitions.map(def => shifts[d]?.[def.id]?.map(s => (
                      <div key={s.staffId} className={`text-[8px] p-1 rounded font-bold uppercase truncate ${COLOR_OPTIONS.find(c=>c.id===def.color).light}`}>{s.staffName}</div>
                    )))}
                  </div></>}
                </div>
              ))}
            </div>
          </div>
        ) : (
          <div className="bg-white rounded-3xl p-6 shadow-lg border">
            <div className="flex justify-between mb-6"><h2 className="font-black text-xl uppercase">Direktori Staf</h2><button onClick={() => setShowStaffModal(true)} className="bg-blue-600 text-white px-4 py-2 rounded-xl font-bold flex items-center gap-2"><UserPlus size={18}/> Tambah</button></div>
            <div className="grid gap-2">
              {staff.map(s => <div key={s.id} className="p-4 bg-slate-50 rounded-2xl flex justify-between items-center border"><div className="text-left"><p className="font-black uppercase text-sm">{s.name}</p><p className="text-[10px] font-bold text-blue-500 uppercase">{s.unit}</p></div><button onClick={() => deleteDoc(doc(db, 'artifacts', appId, 'public', 'data', 'staff', s.id))} className="text-red-400"><Trash2 size={18}/></button></div>)}
            </div>
          </div>
        )}
      </main>

      {selectedDate && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white w-full max-w-2xl rounded-3xl p-6 overflow-y-auto max-h-[90vh]">
            <div className="flex justify-between mb-6"><h3 className="font-black uppercase">Kemaskini Jadual: {selectedDate}</h3><button onClick={() => setSelectedDate(null)}><X/></button></div>
            {shiftDefinitions.map(def => (
              <div key={def.id} className="mb-6 p-4 bg-slate-50 rounded-2xl">
                <p className="font-black text-xs uppercase mb-3 border-b pb-1 text-left">{def.label} ({def.time})</p>
                <div className="flex flex-wrap gap-2">
                  {staff.map(s => (
                    <button key={s.id} onClick={() => toggleShift(selectedDate, def.id, s.id, s.name)} className={`px-3 py-1.5 rounded-lg text-[10px] font-bold uppercase border ${shifts[selectedDate]?.[def.id]?.some(x=>x.staffId===s.id) ? 'bg-blue-600 text-white border-blue-600' : 'bg-white text-slate-500'}`}>{s.name}</button>
                  ))}
                </div>
              </div>
            ))}
            <button onClick={() => setSelectedDate(null)} className="w-full py-4 bg-slate-900 text-white rounded-2xl font-black uppercase">Simpan & Tutup</button>
          </div>
        </div>
      )}

      {showStaffModal && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white w-full max-w-md rounded-3xl p-8">
            <h3 className="font-black uppercase mb-6">Tambah Staf</h3>
            <input type="text" placeholder="Nama Penuh" className="w-full p-4 bg-slate-50 rounded-2xl mb-4 font-bold outline-none" onChange={e => setNewStaff({...newStaff, name: e.target.value.toUpperCase()})}/>
            <input type="text" placeholder="Unit (eg: Logistik)" className="w-full p-4 bg-slate-50 rounded-2xl mb-6 font-bold outline-none" onChange={e => setNewStaff({...newStaff, unit: e.target.value.toUpperCase()})}/>
            <button onClick={async () => { await addDoc(collection(db, 'artifacts', appId, 'public', 'data', 'staff'), newStaff); setShowStaffModal(false); }} className="w-full py-4 bg-blue-600 text-white rounded-2xl font-black">Simpan Staf</button>
          </div>
        </div>
      )}
    </div>
  );
};

export default App;

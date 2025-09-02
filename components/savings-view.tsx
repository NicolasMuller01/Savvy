import React, { useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

interface SavingsJar {
  id: string;
  name: string;
  target: number;
  annualRate: number;
  current: number;
  goalDate?: string;
}

export default function SavingsView() {
  const [jars, setJars] = useState<SavingsJar[]>([]);
  const [showModal, setShowModal] = useState(false);
  const [editingJar, setEditingJar] = useState<SavingsJar | null>(null);

  // Form state
  const [form, setForm] = useState({
    name: "",
    target: "",
    annualRate: "",
    current: "",
    goalDate: ""
  });

  // Add or edit jar
  const handleSave = () => {
    if (!form.name || !form.target) return;
    const jar: SavingsJar = {
      id: editingJar ? editingJar.id : Date.now().toString(),
      name: form.name,
      target: Number(form.target),
      annualRate: Number(form.annualRate) || 0,
      current: Number(form.current) || 0,
      goalDate: form.goalDate || ""
    };
    if (editingJar) {
      setJars(jars.map(j => j.id === jar.id ? jar : j));
    } else {
      setJars([...jars, jar]);
    }
    setShowModal(false);
    setEditingJar(null);
    setForm({ name: "", target: "", annualRate: "", current: "", goalDate: "" });
  };

  // Delete jar
  const handleDelete = (id: string) => {
    setJars(jars.filter(j => j.id !== id));
  };

  // Open modal for edit
  const handleEdit = (jar: SavingsJar) => {
    setEditingJar(jar);
    setForm({
      name: jar.name,
      target: jar.target.toString(),
      annualRate: jar.annualRate.toString(),
      current: jar.current.toString(),
      goalDate: jar.goalDate || ""
    });
    setShowModal(true);
  };
  // Cálculo de total estimado con interés compuesto
  function getEstimatedTotal(current: number, annualRate: number, goalDate: string) {
    if (!goalDate) return 0;
    const now = new Date();
    const end = new Date(goalDate);
    const years = Math.max(0, (end.getTime() - now.getTime()) / (1000 * 60 * 60 * 24 * 365.25));
    if (years === 0) return current;
    // Interés compuesto anual
    return current * Math.pow(1 + annualRate / 100, years);
  }

  // Estado para los inputs de suma por frasco
  const [addAmounts, setAddAmounts] = useState<{ [id: string]: number }>({});

  // Add money
  const handleAddMoney = (id: string) => {
    const amount = addAmounts[id] || 0;
    if (amount > 0) {
      setJars(jars.map(j => j.id === id ? { ...j, current: j.current + amount } : j));
      setAddAmounts({ ...addAmounts, [id]: 0 });
    }
  };

  return (
    <div className="flex flex-col items-center justify-center w-full min-h-[70vh] py-4 sm:py-10 px-2">
      <div className="flex flex-col sm:flex-row justify-between items-center mb-4 sm:mb-10 w-full max-w-4xl mx-auto gap-4">
        <h2 className="text-2xl sm:text-3xl font-bold text-white text-center sm:text-left">Ahorro</h2>
        <Button onClick={() => setShowModal(true)} className="bg-emerald-600 text-white px-4 sm:px-6 py-2 sm:py-3 rounded-xl shadow-lg text-sm sm:text-base">Crear Frasco</Button>
      </div>
      <div className="w-full flex items-center justify-center">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-10 w-full max-w-4xl h-[60vh] sm:h-[70vh] overflow-y-auto bg-slate-900/50 backdrop-blur-xl rounded-2xl border border-slate-800/50 shadow-2xl shadow-black/20 relative p-4 sm:p-0">
          {jars.length === 0 ? (
            <Card className="p-8 sm:p-16 text-center text-slate-400 flex flex-col items-center justify-center mx-auto w-full max-w-lg shadow-2xl bg-slate-900/80 border-emerald-700/30 rounded-2xl col-span-full">
              <svg width="120" height="180" viewBox="0 0 120 180" fill="none" className="mx-auto mb-8">
                {/* Frasco de vidrio realista con tapa y monedas */}
                <ellipse cx="60" cy="170" rx="40" ry="10" fill="#bfae7c" opacity="0.18" />
                <rect x="30" y="40" width="60" height="110" rx="30" fill="#f5f3e7" stroke="#bfae7c" strokeWidth="3" />
                <rect x="40" y="20" width="40" height="30" rx="10" fill="#bfae7c" stroke="#bfae7c" />
                <ellipse cx="60" cy="40" rx="30" ry="10" fill="#fffbe6" opacity="0.7" />
                {/* Monedas */}
                <circle cx="60" cy="140" r="10" fill="#ffe066" stroke="#bfae7c" strokeWidth="2" />
                <circle cx="80" cy="120" r="6" fill="#ffe066" stroke="#bfae7c" strokeWidth="2" />
                <circle cx="50" cy="110" r="5" fill="#ffe066" stroke="#bfae7c" strokeWidth="2" />
                {/* Brillo */}
                <path d="M45 60 Q60 45 75 60" stroke="#fffbe6" strokeWidth="3" fill="none" opacity="0.7" />
              </svg>
              <span className="text-lg">No tienes frascos de ahorro creados.</span>
            </Card>
          ) : (
          jars.map(jar => {
            const progress = Math.min(100, Math.round((jar.current / jar.target) * 100));
            return (
              <Card key={jar.id} className="bg-card text-card-foreground gap-3 sm:gap-6 border p-3 sm:p-6 space-y-3 sm:space-y-6 relative overflow-visible bg-gradient-to-br from-emerald-900/40 to-slate-900/60 border-emerald-700/30 shadow-2xl rounded-2xl flex flex-col items-center justify-center w-full max-w-[300px] sm:max-w-[340px] h-[240px] sm:h-[420px] mx-auto">
                <div className="absolute top-1 sm:top-2 right-1 sm:right-2 flex gap-1 sm:gap-2 z-10">
                  <Button size="sm" variant="outline" onClick={() => handleEdit(jar)} className="border-emerald-500 text-emerald-400 hover:bg-emerald-900/20 text-xs sm:text-sm px-2 sm:px-3 py-1">Editar</Button>
                  <Button size="sm" variant="destructive" onClick={() => handleDelete(jar.id)} className="bg-red-600/80 text-white text-xs sm:text-sm px-2 sm:px-3 py-1">Eliminar</Button>
                </div>
                <div className="flex flex-col items-center justify-center gap-1 sm:gap-2">
                  <div className="relative w-16 sm:w-20 h-24 sm:h-32 flex items-end justify-center mb-1">
                    <svg width="60" height="90" viewBox="0 0 120 180" fill="none" className="absolute left-0 top-0 sm:w-[70px] sm:h-[100px]">
                      <ellipse cx="60" cy="170" rx="40" ry="10" fill="#bfae7c" opacity="0.18" />
                      <rect x="30" y="40" width="60" height="110" rx="30" fill="#f5f3e7" stroke="#bfae7c" strokeWidth="3" />
                      <rect x="40" y="20" width="40" height="30" rx="10" fill="#bfae7c" stroke="#bfae7c" />
                      <ellipse cx="60" cy="40" rx="30" ry="10" fill="#fffbe6" opacity="0.7" />
                      <circle cx="60" cy={140 - (70 * (progress / 100))} r="10" fill="#ffe066" stroke="#bfae7c" strokeWidth="2" style={{ transition: 'cy 0.7s' }} />
                      <circle cx="80" cy={120 - (70 * (progress / 100))} r="6" fill="#ffe066" stroke="#bfae7c" strokeWidth="2" style={{ transition: 'cy 0.7s' }} />
                      <circle cx="50" cy={110 - (70 * (progress / 100))} r="5" fill="#ffe066" stroke="#bfae7c" strokeWidth="2" style={{ transition: 'cy 0.7s' }} />
                      <path d="M45 60 Q60 45 75 60" stroke="#fffbe6" strokeWidth="3" fill="none" opacity="0.7" />
                    </svg>
                    <span className="absolute bottom-1 sm:bottom-2 left-0 w-full text-center text-sm sm:text-base text-emerald-300 font-bold drop-shadow">{progress}%</span>
                  </div>
                  <h3 className="text-sm sm:text-base font-semibold text-white text-center">{jar.name}</h3>
                  <span className="text-xs text-gray-500">Meta: ${jar.target}</span>
                  <span className="text-xs text-gray-500">Rendimiento: {jar.annualRate}%</span>
                  <span className="text-xs text-gray-500">Fecha objetivo: {jar.goalDate ? new Date(jar.goalDate).toLocaleDateString() : '-'}</span>
                  <span className="text-xs text-emerald-600">Total estimado: ${jar.current && jar.annualRate && jar.goalDate ? getEstimatedTotal(Number(jar.current), Number(jar.annualRate), jar.goalDate).toLocaleString(undefined, {maximumFractionDigits:2}) : "-"}</span>
                  <span className="text-white font-bold text-sm sm:text-base text-center mt-1">${jar.current} / ${jar.target}</span>
                  <div className="w-full h-2 sm:h-3 bg-slate-800 rounded-full overflow-hidden mt-1">
                    <div className="h-full bg-gradient-to-r from-emerald-400 to-emerald-600 rounded-full transition-all duration-700" style={{ width: `${progress}%` }}></div>
                  </div>
                </div>
                <div className="flex gap-1 sm:gap-2 mt-2 sm:mt-3 justify-center items-center">
                  <Input type="number" min={0} max={999999999.99} placeholder="Agregar dinero"
                    value={addAmounts[jar.id] || ""}
                    onChange={e => setAddAmounts({ ...addAmounts, [jar.id]: Number(e.target.value) })}
                    className="w-16 sm:w-20 bg-slate-900/60 border-emerald-700 text-emerald-200 text-xs sm:text-sm px-1 sm:px-2 py-1 rounded-lg"
                  />
                  <Button onClick={() => handleAddMoney(jar.id)} className="bg-emerald-500 hover:bg-emerald-600 text-white font-bold shadow-lg px-2 sm:px-3 py-1 rounded-lg text-xs">Sumar</Button>
                </div>
              </Card>
            );
          })
        )}
        </div>
      </div>
      {showModal && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4">
          <Card className="p-3 sm:p-6 w-full max-w-xs sm:max-w-xl relative rounded-xl shadow-2xl flex flex-col sm:flex-row items-center justify-center" style={{ maxHeight: '90vh', overflowY: 'auto' }}>
            <div className="flex flex-col sm:flex-row w-full items-center justify-evenly gap-3 sm:gap-4">
              {/* Inputs a la izquierda */}
              <div className="flex flex-col flex-1 space-y-2 min-w-[120px] sm:min-w-[140px] max-w-[160px] sm:max-w-[180px] order-2 sm:order-1">
                <h3 className="text-base sm:text-lg font-bold text-white mb-2 text-center sm:text-left">{editingJar ? "Editar Frasco" : "Crear Frasco"}</h3>
                <div className="space-y-1">
                  <Label className="text-xs">Nombre</Label>
                  <Input value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} placeholder="Ej: Viaje, Emergencia..." className="text-sm px-2 py-1 rounded-md" />
                </div>
                <div className="space-y-1">
                  <Label className="text-xs">Fecha objetivo</Label>
                  <Input type="date" value={form.goalDate} onChange={e => setForm({ ...form, goalDate: e.target.value })} className="text-sm px-2 py-1 rounded-md" />
                </div>
                <div className="space-y-1">
                  <Label className="text-xs">Rendimiento anual (%)</Label>
                  <Input type="number" max={99} value={form.annualRate} onChange={e => setForm({ ...form, annualRate: e.target.value })} placeholder="Ej: 5" className="text-sm px-2 py-1 rounded-md" />
                </div>
                <div className="space-y-1">
                  <Label className="text-xs">Objetivo ($)</Label>
                  <Input type="number" max={99999999.99} value={form.target} onChange={e => setForm({ ...form, target: e.target.value })} placeholder="Ej: 10000" className="text-sm px-2 py-1 rounded-md" />
                </div>
                <div className="space-y-1">
                  <Label className="text-xs">Monto inicial</Label>
                  <Input type="number" max={99999999.99} value={form.current} onChange={e => setForm({ ...form, current: e.target.value })} placeholder="Ej: 0" className="text-sm px-2 py-1 rounded-md" />
                </div>
                <div className="flex gap-2 justify-center sm:justify-end mt-2">
                  <Button variant="outline" onClick={() => { setShowModal(false); setEditingJar(null); }} className="px-3 sm:px-4 py-1 rounded-md text-sm">Cancelar</Button>
                  <Button onClick={handleSave} className="bg-emerald-600 text-white px-3 sm:px-4 py-1 rounded-md text-sm">{editingJar ? "Actualizar" : "Crear"}</Button>
                </div>
              </div>
              {/* Frasco a la derecha, más grande */}
              <div className="flex flex-col items-center justify-center min-w-[120px] sm:min-w-[140px] order-1 sm:order-2">
                <svg width="90" height="135" viewBox="0 0 120 180" fill="none" className="sm:w-[110px] sm:h-[165px]">
                  <ellipse cx="60" cy="170" rx="40" ry="10" fill="#bfae7c" opacity="0.18" />
                  <rect x="30" y="40" width="60" height="110" rx="30" fill="#f5f3e7" stroke="#bfae7c" strokeWidth="3" />
                  <rect x="40" y="20" width="40" height="30" rx="10" fill="#bfae7c" stroke="#bfae7c" />
                  <ellipse cx="60" cy="40" rx="30" ry="10" fill="#fffbe6" opacity="0.7" />
                  {/* Monedas animadas */}
                  <circle cx="60" cy={140 - (70 * (form.current && form.target ? Math.min(1, Number(form.current)/Number(form.target)) : 0))} r="10" fill="#ffe066" stroke="#bfae7c" strokeWidth="2" style={{ transition: 'cy 0.7s' }} />
                  <circle cx="80" cy={120 - (70 * (form.current && form.target ? Math.min(1, Number(form.current)/Number(form.target)) : 0))} r="6" fill="#ffe066" stroke="#bfae7c" strokeWidth="2" style={{ transition: 'cy 0.7s' }} />
                  <circle cx="50" cy={110 - (70 * (form.current && form.target ? Math.min(1, Number(form.current)/Number(form.target)) : 0))} r="5" fill="#ffe066" stroke="#bfae7c" strokeWidth="2" style={{ transition: 'cy 0.7s' }} />
                  {/* Brillo */}
                  <path d="M45 60 Q60 45 75 60" stroke="#fffbe6" strokeWidth="3" fill="none" opacity="0.7" />
                </svg>
                <span className="text-sm sm:text-base text-emerald-400 font-bold mt-2">{form.current && form.target ? `${Math.round(Math.min(100, (Number(form.current)/Number(form.target))*100))}%` : '0%'}</span>
                {/* Total estimado debajo de la imagen del frasco */}
                <div className="mt-2 sm:mt-3 text-center">
                  <Label className="text-xs text-emerald-400 block">Total estimado al {form.goalDate ? new Date(form.goalDate).toLocaleDateString() : "fecha objetivo"}</Label>
                  <div className="text-sm sm:text-lg font-bold text-emerald-300">$
                    {form.current && form.annualRate && form.goalDate ? getEstimatedTotal(Number(form.current), Number(form.annualRate), form.goalDate).toLocaleString(undefined, {maximumFractionDigits:2}) : "-"}
                  </div>
                </div>
              </div>
            </div>
          </Card>
        </div>
      )}
  </div>
  );
}

import { useEffect, useState } from 'react';
import type { ProveedorDto, CrearProveedorRequestDto } from '../types';
import { api } from '../api/client';
import { useNotification } from '../context/NotificationContext';
import { formatCurrency } from '../formats';

export default function ProveedoresPage() {
  const [proveedores, setProveedores] = useState<ProveedorDto[]>([]);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);
  const { notifyError } = useNotification();

  // Modal state
  const [showModal, setShowModal] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [form, setForm] = useState<CrearProveedorRequestDto>({
    nombre: '', tipoDocumento: '', nroDocumento: '', telefono: '', domicilio: '', mail: '',
  });
  const [saving, setSaving] = useState(false);

  const load = async () => {
    setLoading(true);
    try {
      const data = await api.proveedores.listar(search || undefined);
      setProveedores(data);
    } catch (err: unknown) {
      notifyError(err instanceof Error ? err.message : 'Error al cargar proveedores');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, [search]);

  const openNew = () => {
    setEditingId(null);
    setForm({ nombre: '', tipoDocumento: '', nroDocumento: '', telefono: '', domicilio: '', mail: '' });
    setShowModal(true);
  };

  const openEdit = async (id: number) => {
    try {
      const p = await api.proveedores.obtener(id);
      setEditingId(id);
      setForm({
        nombre: p.nombre,
        tipoDocumento: p.tipoDocumento || '',
        nroDocumento: p.nroDocumento || '',
        telefono: p.telefono || '',
        domicilio: p.domicilio || '',
        mail: p.mail || '',
      });
      setShowModal(true);
    } catch (err: unknown) {
      notifyError(err instanceof Error ? err.message : 'Error al cargar proveedor');
    }
  };

  const handleSave = async () => {
    if (!form.nombre.trim()) return;
    setSaving(true);
    try {
      if (editingId) {
        await api.proveedores.actualizar(editingId, form);
      } else {
        await api.proveedores.crear(form);
      }
      setShowModal(false);
      await load();
    } catch (err: unknown) {
      notifyError(err instanceof Error ? err.message : 'Error al guardar proveedor');
    } finally {
      setSaving(false);
    }
  };

  const totalDeuda = proveedores.reduce((s, p) => s + p.deudaPendiente, 0);

  return (
    <div className="min-h-screen bg-gray-50 p-4 sm:p-6">
      <div className="max-w-6xl mx-auto">
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-2xl font-bold text-gray-900">Proveedores</h1>
          <button onClick={openNew}
            className="px-4 py-2 bg-indigo-600 text-white text-sm font-medium rounded-lg hover:bg-indigo-700 transition-colors">
            + Nuevo proveedor
          </button>
        </div>

        {/* Filters bar */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4 mb-6">
          <div className="flex flex-wrap items-center gap-4">
            <div className="flex-1 min-w-[200px]">
              <input type="text" value={search} onChange={e => setSearch(e.target.value)}
                placeholder="Buscar proveedor..."
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500" />
            </div>
            <div className="text-sm text-gray-600">
              Deuda total: <span className="font-bold text-red-600">{formatCurrency(totalDeuda)}</span>
            </div>
          </div>
        </div>

        {/* Table */}
        {loading ? (
          <div className="text-center py-12 text-gray-500">Cargando...</div>
        ) : proveedores.length === 0 ? (
          <div className="text-center py-12 bg-white rounded-xl border border-dashed border-gray-300">
            <p className="text-gray-500 text-sm">{search ? 'Sin resultados' : 'No hay proveedores'}</p>
          </div>
        ) : (
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-gray-50 text-left text-xs text-gray-500 uppercase tracking-wider">
                  <th className="px-4 py-3">Código</th>
                  <th className="px-4 py-3">Nombre</th>
                  <th className="px-4 py-3">Documento</th>
                  <th className="px-4 py-3">Teléfono</th>
                  <th className="px-4 py-3 text-right">Deuda pendiente</th>
                  <th className="px-4 py-3 text-right">Acción</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {proveedores.map(p => (
                  <tr key={p.id} className="hover:bg-gray-50">
                    <td className="px-4 py-3 font-mono text-xs text-gray-500">{p.codigo}</td>
                    <td className="px-4 py-3 font-medium text-gray-900">{p.nombre}</td>
                    <td className="px-4 py-3 text-gray-500 text-xs">
                      {p.tipoDocumento && p.nroDocumento ? `${p.tipoDocumento} ${p.nroDocumento}` : '—'}
                    </td>
                    <td className="px-4 py-3 text-gray-500">{p.telefono || '—'}</td>
                    <td className={`px-4 py-3 text-right font-mono font-medium ${p.deudaPendiente > 0 ? 'text-red-600' : 'text-gray-500'}`}>
                      {formatCurrency(p.deudaPendiente)}
                    </td>
                    <td className="px-4 py-3 text-right">
                      <button onClick={() => openEdit(p.id)}
                        className="px-3 py-1.5 bg-indigo-100 text-indigo-700 text-xs font-medium rounded-md hover:bg-indigo-200 transition-colors">
                        Editar
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Modal alta/edición */}
      {showModal && (
        <div className="fixed inset-0 bg-black/30 z-50 flex items-center justify-center p-4" onClick={() => setShowModal(false)}>
          <div className="bg-white rounded-2xl shadow-xl p-6 max-w-lg w-full" onClick={e => e.stopPropagation()}>
            <div className="flex justify-between mb-4">
              <h3 className="text-lg font-bold text-gray-900">{editingId ? 'Editar proveedor' : 'Nuevo proveedor'}</h3>
              <button onClick={() => setShowModal(false)} className="text-gray-400 hover:text-gray-600 text-xl">&times;</button>
            </div>
            <div className="grid grid-cols-2 gap-3 mb-4">
              <div className="col-span-2">
                <label className="text-xs font-semibold text-gray-700">Nombre *</label>
                <input type="text" value={form.nombre} onChange={e => setForm({ ...form, nombre: e.target.value })}
                  className="w-full px-3 py-2 border rounded-lg text-sm" autoFocus />
              </div>
              <div>
                <label className="text-xs font-semibold text-gray-700">Tipo documento</label>
                <select value={form.tipoDocumento} onChange={e => setForm({ ...form, tipoDocumento: e.target.value })}
                  className="w-full px-3 py-2 border rounded-lg text-sm">
                  <option value="">—</option>
                  <option value="CUIL">CUIL</option>
                  <option value="CUIT">CUIT</option>
                  <option value="DNI">DNI</option>
                </select>
              </div>
              <div>
                <label className="text-xs font-semibold text-gray-700">Nro. documento</label>
                <input type="text" value={form.nroDocumento} onChange={e => setForm({ ...form, nroDocumento: e.target.value })}
                  className="w-full px-3 py-2 border rounded-lg text-sm" />
              </div>
              <div>
                <label className="text-xs font-semibold text-gray-700">Teléfono</label>
                <input type="text" value={form.telefono} onChange={e => setForm({ ...form, telefono: e.target.value })}
                  className="w-full px-3 py-2 border rounded-lg text-sm" />
              </div>
              <div>
                <label className="text-xs font-semibold text-gray-700">Mail</label>
                <input type="email" value={form.mail} onChange={e => setForm({ ...form, mail: e.target.value })}
                  className="w-full px-3 py-2 border rounded-lg text-sm" />
              </div>
              <div className="col-span-2">
                <label className="text-xs font-semibold text-gray-700">Domicilio</label>
                <input type="text" value={form.domicilio} onChange={e => setForm({ ...form, domicilio: e.target.value })}
                  className="w-full px-3 py-2 border rounded-lg text-sm" />
              </div>
            </div>
            <button onClick={handleSave} disabled={saving || !form.nombre.trim()}
              className="w-full py-2.5 bg-indigo-600 text-white font-semibold rounded-xl hover:bg-indigo-700 disabled:opacity-50">
              {saving ? 'Guardando...' : editingId ? 'Guardar cambios' : 'Crear proveedor'}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

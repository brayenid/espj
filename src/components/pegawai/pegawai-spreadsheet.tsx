/* eslint-disable @typescript-eslint/no-explicit-any */
'use client'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Loader2, Save, Search, UserPlus, Trash2, Undo2 } from 'lucide-react'
import { cn } from '@/lib/utils'

export default function PegawaiSpreadsheet({ initialItems }: { initialItems: any[] }) {
  const router = useRouter()
  const [items, setItems] = useState(initialItems)
  const [isPending, startTransition] = useTransition()
  const [q, setQ] = useState('')

  // Track baris yang ditandai untuk dihapus (soft-delete di UI)
  const [idsToDelete, setIdsToDelete] = useState<string[]>([])

  const handleChange = (id: string, field: string, value: string) => {
    setItems((prev) => prev.map((item) => (item.id === id ? { ...item, [field]: value } : item)))
  }

  const handleAddRow = () => {
    const newRow = {
      id: `new-${Date.now()}`, // Temp ID untuk data baru
      nama: '',
      nip: '',
      jabatan: '',
      pangkat: '',
      golongan: '',
      isNew: true
    }
    setItems((prev) => [newRow, ...prev])
    toast.info('Baris baru ditambahkan di paling atas.')
  }

  const toggleDelete = (id: string) => {
    // Jika data baru (isNew), langsung hapus dari state
    if (id.startsWith('new-')) {
      setItems((prev) => prev.filter((item) => item.id !== id))
      return
    }
    // Jika data lama, tandai untuk dihapus di server nanti
    setIdsToDelete((prev) => (prev.includes(id) ? prev.filter((i) => i !== id) : [...prev, id]))
  }

  async function onSave() {
    startTransition(async () => {
      try {
        const res = await fetch('/api/pegawai/batch', {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            updates: items.filter((i) => !idsToDelete.includes(i.id)),
            deletes: idsToDelete
          })
        })

        if (res.ok) {
          toast.success('Sinkronisasi data berhasil.')
          setIdsToDelete([])
          router.refresh()
        } else {
          const err = await res.json()
          toast.error(err.message || 'Gagal menyimpan perubahan.')
        }
      } catch (e) {
        toast.error('Terjadi kesalahan jaringan.')
      }
    })
  }

  // Filter tampilan berdasarkan search
  const filteredItems = items.filter(
    (i) => i.nama.toLowerCase().includes(q.toLowerCase()) || (i.nip && i.nip.includes(q))
  )

  return (
    <div className="space-y-4 animate-in fade-in duration-500">
      {/* TOOLBAR */}
      <div className="flex items-center justify-between gap-4">
        <div className="relative w-full max-w-xs">
          <Search className="absolute left-2.5 top-2.5 h-3.5 w-3.5 text-muted-foreground" />
          <Input
            placeholder="Cari nama atau NIP..."
            className="pl-8 rounded-lg h-9 text-xs border-border/60 focus-visible:ring-primary/20 bg-white"
            value={q}
            onChange={(e) => setQ(e.target.value)}
          />
        </div>

        <div className="flex items-center gap-2">
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={handleAddRow}
            className="rounded-lg h-9 px-3 font-bold text-[10px] tracking-widest border-border/60 bg-white">
            <UserPlus className="w-3 h-3 mr-2" /> TAMBAH
          </Button>

          <Button
            size="sm"
            onClick={onSave}
            disabled={isPending}
            className="rounded-lg h-9 px-4 font-bold text-[10px] tracking-widest shadow-sm">
            {isPending ? <Loader2 className="w-3 h-3 animate-spin mr-2" /> : <Save className="w-3 h-3 mr-2" />}
            SIMPAN PERUBAHAN
          </Button>
        </div>
      </div>

      {/* SPREADSHEET TABLE */}
      <div className="rounded-xl border border-border/40 bg-card shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-xs border-collapse">
            <thead>
              <tr className="bg-muted/40 text-[10px] font-bold uppercase tracking-[0.15em] text-muted-foreground border-b border-border/40">
                <th className="px-4 py-2.5 text-left w-10">No</th>
                <th className="px-4 py-2.5 text-left min-w-[200px]">Nama Lengkap</th>
                <th className="px-4 py-2.5 text-left min-w-[150px]">NIP</th>
                <th className="px-4 py-2.5 text-left min-w-[180px]">Jabatan</th>
                <th className="px-4 py-2.5 text-center w-20">Gol</th>
                <th className="px-4 py-2.5 text-left min-w-[150px]">Pangkat</th>
                <th className="px-4 py-2.5 text-center w-12"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border/40 bg-white">
              {filteredItems.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-10 text-center text-muted-foreground italic">
                    Data tidak ditemukan.
                  </td>
                </tr>
              ) : (
                filteredItems.map((p, idx) => {
                  const isDeleted = idsToDelete.includes(p.id)
                  return (
                    <tr
                      key={p.id}
                      className={cn(
                        'transition-colors group',
                        isDeleted ? 'bg-destructive/[0.03] opacity-60' : 'hover:bg-primary/[0.02]'
                      )}>
                      <td className="px-4 py-2 text-[10px] font-bold text-muted-foreground/50">{idx + 1}</td>
                      {/* Input Cells */}
                      {[
                        { field: 'nama', class: 'font-semibold text-sm' },
                        { field: 'nip', class: 'text-xs' },
                        { field: 'jabatan', class: 'text-xs' },
                        { field: 'golongan', class: 'text-center font-bold text-xs uppercase' },
                        { field: 'pangkat', class: 'text-xs' }
                      ].map((col) => (
                        <td key={col.field} className="p-0 relative focus-within:z-10">
                          <input
                            disabled={isDeleted}
                            value={(p as any)[col.field] ?? ''}
                            onChange={(e) => handleChange(p.id, col.field, e.target.value)}
                            className={cn(
                              'w-full h-10 px-4 bg-transparent outline-none focus:bg-background focus:ring-1 focus:ring-primary/20 transition-all',
                              col.class,
                              isDeleted && 'line-through text-muted-foreground'
                            )}
                          />
                        </td>
                      ))}
                      {/* Delete Action */}
                      <td className="px-2 text-center">
                        <Button
                          type="button"
                          variant="ghost"
                          size="icon"
                          onClick={() => toggleDelete(p.id)}
                          className={cn(
                            'h-7 w-7 rounded-md transition-all',
                            isDeleted
                              ? 'text-primary hover:bg-primary/10'
                              : 'text-muted-foreground hover:text-destructive hover:bg-destructive/10 opacity-0 group-hover:opacity-100'
                          )}>
                          {isDeleted ? <Undo2 className="w-3.5 h-3.5" /> : <Trash2 className="w-3.5 h-3.5" />}
                        </Button>
                      </td>
                    </tr>
                  )
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      <div className="flex items-center justify-between px-1">
        <p className="text-[10px] text-muted-foreground font-medium uppercase tracking-wider">
          Total: {items.length} Personel {idsToDelete.length > 0 && `(${idsToDelete.length} akan dihapus)`}
        </p>
        <p className="text-[10px] text-muted-foreground italic">
          Gunakan <kbd className="font-sans px-1 bg-muted border rounded">Tab</kbd> untuk berpindah kolom.
        </p>
      </div>
    </div>
  )
}

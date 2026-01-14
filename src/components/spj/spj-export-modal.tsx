/* eslint-disable @typescript-eslint/no-explicit-any */
'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger
} from '@/components/ui/dialog'
import { Checkbox } from '@/components/ui/checkbox'
import { Label } from '@/components/ui/label'
import { Download, FileSpreadsheet, Loader2 } from 'lucide-react'
import { toast } from 'sonner'

const AVAILABLE_COLUMNS = [
  { id: 'tujuan', label: 'Tujuan', default: true },
  { id: 'tglBerangkat', label: 'Tanggal Berangkat', default: true },
  { id: 'tglKembali', label: 'Tanggal Kembali', default: true },
  { id: 'personel', label: 'Nama Personel', default: true },
  { id: 'sudahBerangkat', label: 'Status Berangkat', default: true },
  { id: 'totalBiaya', label: 'Total Biaya', default: false },
  { id: 'pencairan', label: 'Status Pencairan', default: false }
]

export default function SpjExportModal() {
  const [loading, setLoading] = useState(false)
  const [dateFrom, setDateFrom] = useState('')
  const [dateTo, setDateTo] = useState('')
  const [selectedCols, setSelectedCols] = useState<string[]>(
    AVAILABLE_COLUMNS.filter((c) => c.default).map((c) => c.id)
  )

  const handleExport = async () => {
    if (selectedCols.length === 0) {
      toast.error('Pilih minimal satu kolom untuk diekspor.')
      return
    }

    setLoading(true)
    try {
      const res = await fetch('/api/spj/export/excel', {
        method: 'POST',
        body: JSON.stringify({ dateFrom, dateTo, columns: selectedCols })
      })

      if (!res.ok) throw new Error()

      const blob = await res.blob()
      const url = window.URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `Ekspor_SPJ_${new Date().toISOString().split('T')[0]}.xlsx`
      document.body.appendChild(a)
      a.click()
      a.remove()
      toast.success('Excel berhasil diunduh.')
    } catch (error) {
      toast.error('Gagal mengekspor data.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm" className="h-9 gap-2 cursor-pointer shadow-none!">
          <FileSpreadsheet className="w-4 h-4 text-green-600" />
          Ekspor Excel
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-106.25 rounded-2xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Download className="w-5 h-5 text-primary" />
            Konfigurasi Ekspor
          </DialogTitle>
          <DialogDescription>Pilih rentang tanggal berangkat dan kolom yang ingin Anda sertakan.</DialogDescription>
        </DialogHeader>

        <div className="grid gap-6 py-4">
          {/* Date Range */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label className="text-[11px] font-bold uppercase opacity-60">Dari Tanggal</Label>
              <input
                type="date"
                className="w-full flex h-9 rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm transition-colors file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
                value={dateFrom}
                onChange={(e) => setDateFrom(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label className="text-[11px] font-bold uppercase opacity-60">Sampai Tanggal</Label>
              <input
                type="date"
                className="w-full flex h-9 rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm transition-colors file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
                value={dateTo}
                onChange={(e) => setDateTo(e.target.value)}
              />
            </div>
          </div>

          {/* Column Selection */}
          <div className="space-y-3">
            <Label className="text-[11px] font-bold uppercase opacity-60">Pilih Kolom Data</Label>
            <div className="grid grid-cols-2 gap-3 border rounded-xl p-4 bg-muted/20">
              {AVAILABLE_COLUMNS.map((col) => (
                <div key={col.id} className="flex items-center space-x-2">
                  <Checkbox
                    id={col.id}
                    checked={selectedCols.includes(col.id)}
                    onCheckedChange={(checked: any) => {
                      setSelectedCols((prev) => (checked ? [...prev, col.id] : prev.filter((i) => i !== col.id)))
                    }}
                  />
                  <label htmlFor={col.id} className="text-xs font-medium leading-none cursor-pointer">
                    {col.label}
                  </label>
                </div>
              ))}
            </div>
          </div>
        </div>

        <DialogFooter>
          <Button onClick={handleExport} disabled={loading} className="w-full sm:w-auto font-bold">
            {loading ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Download className="w-4 h-4 mr-2" />}
            MULAI EKSPOR
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

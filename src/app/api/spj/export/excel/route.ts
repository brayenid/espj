/* eslint-disable @typescript-eslint/no-explicit-any */
import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import ExcelJS from 'exceljs'
import { z } from 'zod'

const exportSchema = z.object({
  dateFrom: z.string().optional(),
  dateTo: z.string().optional(),
  columns: z.array(z.string())
})

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const { dateFrom, dateTo, columns } = exportSchema.parse(body)

    // Build filter
    const where: any = {}
    if (dateFrom || dateTo) {
      where.tglBerangkat = {
        ...(dateFrom && { gte: new Date(dateFrom) }),
        ...(dateTo && { lte: new Date(dateTo) })
      }
    }

    const data = await prisma.spj.findMany({
      where,
      include: {
        roster: { select: { nama: true } },
        rincian: { select: { total: true } }
      },
      orderBy: { tglBerangkat: 'desc' }
    })

    const workbook = new ExcelJS.Workbook()
    const worksheet = workbook.addWorksheet('Data SPJ')

    // Define All Possible Columns
    const allColumnsMap: Record<string, { header: string; key: string; width: number }> = {
      tujuan: { header: 'TUJUAN', key: 'tujuan', width: 30 },
      tglBerangkat: { header: 'TGL BERANGKAT', key: 'tglBerangkat', width: 15 },
      tglKembali: { header: 'TGL KEMBALI', key: 'tglKembali', width: 15 },
      personel: { header: 'PERSONEL', key: 'personel', width: 40 },
      sudahBerangkat: { header: 'STATUS JALAN', key: 'sudahBerangkat', width: 15 },
      totalBiaya: { header: 'TOTAL BIAYA', key: 'totalBiaya', width: 20 },
      pencairan: { header: 'PENCAIRAN', key: 'pencairan', width: 15 }
    }

    // Filter columns based on user selection
    worksheet.columns = columns.map((col) => allColumnsMap[col]).filter(Boolean)

    // Styling Header
    worksheet.getRow(1).font = { bold: true }
    worksheet.getRow(1).alignment = { vertical: 'middle', horizontal: 'center' }

    const now = new Date()

    data.forEach((spj) => {
      const rowData: any = {}

      if (columns.includes('tujuan')) rowData.tujuan = spj.tempatTujuan
      if (columns.includes('tglBerangkat')) rowData.tglBerangkat = spj.tglBerangkat.toLocaleDateString('id-ID')
      if (columns.includes('tglKembali')) rowData.tglKembali = spj.tglKembali.toLocaleDateString('id-ID')
      if (columns.includes('personel')) {
        rowData.personel = spj.roster
          .map((r) => {
            // 1. Bersihkan whitespace berlebih
            const namaBersih = r.nama.trim()

            // 2. Split berdasarkan spasi
            const parts = namaBersih.split(' ')

            // 3. Ambil kata pertama
            // QA Note: Jika nama hanya 1 kata, tetap aman.
            return parts[0]
          })
          .join(', ')
      }

      if (columns.includes('sudahBerangkat')) {
        rowData.sudahBerangkat = now >= new Date(spj.tglBerangkat) ? 'Selesai/Jalan' : 'Belum'
      }

      if (columns.includes('totalBiaya')) {
        const total = spj.rincian.reduce((sum, item) => sum + item.total, 0)
        rowData.totalBiaya = total
      }

      if (columns.includes('pencairan')) {
        rowData.pencairan = spj.pencairan ? 'Sudah' : 'Belum'
      }

      const row = worksheet.addRow(rowData)

      // Format currency for total biaya if exists
      if (columns.includes('totalBiaya')) {
        const cellIndex = columns.indexOf('totalBiaya') + 1
        row.getCell(cellIndex).numFmt = '#,##0'
      }
    })

    const buffer = await workbook.xlsx.writeBuffer()

    return new NextResponse(buffer, {
      status: 200,
      headers: {
        'Content-Disposition': 'attachment; filename="Ekspor_SPJ.xlsx"',
        'Content-Type': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
      }
    })
  } catch (error) {
    console.error(error)
    return NextResponse.json({ error: 'Export failed' }, { status: 500 })
  }
}

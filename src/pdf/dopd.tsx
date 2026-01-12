/* eslint-disable @typescript-eslint/no-explicit-any */
// src/pdf/dopd.tsx
import React from 'react'
import { Document, Page, StyleSheet, Text, View } from '@react-pdf/renderer'

type RosterRole = 'KEPALA_JALAN' | 'PENGIKUT'

export type DopdRosterItem = {
  id: string
  order: number
  role: RosterRole
  nama: string
  nip: string | null
  jabatan: string
  pangkat: string | null
  golongan: string | null
}

export type DopdFactor = {
  id?: string
  order: number
  label: string
  qty: number
}

export type DopdBiayaItem = {
  id: string
  rosterItemId: string
  kategori: string
  uraian: string
  hargaSatuan: number
  total: number
  factors: DopdFactor[]
}

export type DopdSpj = {
  // untuk header 1-2 di atas
  // (di screenshot, ini berasal dari field “Pejabat yang memberi perintah” / “Pegawai yang diperintah”)
  pejabatMemberiPerintahLabel: string // mis: "Asisten Pemerintahan dan Kesejahteraan Rakyat"
  tingkatPerjalananLabel: string // mis: "Perjalanan Dinas Luar Daerah"
}

export type DopdSigner = {
  nama: string
  nip: string | null
}

export default function DopdPdf({
  spj,
  roster,
  items,
  signers
}: {
  spj: DopdSpj
  roster: DopdRosterItem[]
  items: DopdBiayaItem[]
  signers: {
    kpa?: DopdSigner | null
    bpp?: DopdSigner | null
  }
}) {
  const rosterSorted = sortRoster(roster)

  const kepala = rosterSorted.find((r) => r.role === 'KEPALA_JALAN') ?? rosterSorted[0]
  const pengikut = rosterSorted.filter((r) => r.id !== kepala?.id)

  const safeItems = Array.isArray(items) ? items : []
  const itemsByRoster = groupItemsByRoster(safeItems)

  return (
    <Document>
      <Page size="A4" style={styles.page}>
        {/* Title */}
        <View style={styles.titleWrap}>
          <Text style={styles.title}>DAFTAR ONGKOS PERJALANAN DINAS</Text>
        </View>

        {/* Block 1 */}
        <Row3 leftNo="1" label="Pejabat yang memberikan perintah" value={spj.pejabatMemberiPerintahLabel} />

        {/* Block 2 */}
        <View style={styles.block}>
          <Row3 leftNo="2" label="Pegawai yang diperintah" value="" />

          <Row3 leftNo="" indent label="a. Nama Pegawai yang diperintah" value={kepala?.nama ?? '-'} boldValue />
          <Row3
            leftNo=""
            indent
            label="b. Pangkat/Golongan"
            value={formatPangkatGolongan(kepala?.pangkat ?? null, kepala?.golongan ?? null)}
          />
          <Row3 leftNo="" indent label="c. Jabatan" value={kepala?.jabatan ?? '-'} />
          <Row3 leftNo="" indent label="d. Tingkat menurut peraturan" value={spj.tingkatPerjalananLabel} />
        </View>

        {/* Block 3: Biaya */}
        <View style={styles.block}>
          <Row3 leftNo="3" label="Biaya Perjalanan Dinas" value="" />

          {/* a. Pegawai yang diperintah */}
          <View style={styles.subBlock}>
            <Row3 leftNo="" indent label="a. Pegawai yang diperintah" value="" />
            <Row3 leftNo="" indent2 label="- Nama" value={kepala?.nama ?? '-'} boldValue />
            <Row3 leftNo="" indent2 label="- Perinciannya" value="" />
            <RincianTable items={itemsByRoster.get(kepala?.id ?? '') ?? []} startNo={1} showJumlah />
          </View>

          {/* b. Pengikut */}
          {pengikut.length > 0 ? (
            <View style={styles.subBlock}>
              <Row3 leftNo="" indent label="b. Pengikut" value="" />

              {pengikut.map((p, idx) => (
                <View key={p.id} style={{ marginTop: idx === 0 ? 6 : 10 }}>
                  {/* di excel biasanya “- Nama : 0” kalau belum diisi, tapi di sistem kita pakai roster */}
                  <Row3 leftNo="" indent2 label="- Nama" value={p.nama} boldValue />
                  <Row3 leftNo="" indent2 label="- Perinciannya" value="" />
                  <RincianTable items={itemsByRoster.get(p.id) ?? []} startNo={1} showJumlah />
                </View>
              ))}
            </View>
          ) : null}

          {/* Total keseluruhan */}
          <View style={styles.totalWrap}>
            <Text style={styles.totalLabel}>Total</Text>
            <Text style={styles.totalColon}>:</Text>
            <View style={styles.totalRight}>
              <Text style={styles.rp}>Rp</Text>
              <Text style={styles.totalValueUnderline}>{rupiah(sum(items.map((x) => x.total)))}</Text>
            </View>
          </View>
        </View>

        {/* Keterangan + tanda tangan terima */}
        <View style={styles.block}>
          <Text style={styles.keterangan}>Keterangan:</Text>
          <Text style={styles.ttdTitle}>TANDA TANGAN TERIMA</Text>

          <View style={{ marginTop: 6 }}>
            <Text style={styles.ttdSub}>a. Pegawai yang diperintah</Text>

            <View style={styles.ttdRow}>
              <View style={styles.ttdLeft}>
                <Text style={styles.bold}>{kepala?.nama ?? '-'}</Text>
              </View>
              <View style={styles.ttdRight}>
                <Text style={styles.dots}>……………………………………</Text>
              </View>
            </View>

            {pengikut.length > 0 ? (
              <>
                <Text style={[styles.ttdSub, { marginTop: 6 }]}>b. Pengikut</Text>

                {pengikut.map((p, i) => (
                  <View key={p.id} style={styles.ttdRow}>
                    <View style={styles.ttdLeft}>
                      <Text>
                        {i + 1}. {p.nama}
                      </Text>
                    </View>
                    <View style={styles.ttdRight}>
                      <Text style={styles.dots}>……………………………………</Text>
                    </View>
                  </View>
                ))}
              </>
            ) : null}
          </View>
        </View>

        {/* Bottom area: Paid info + signers */}
        <View style={styles.bottomArea}>
          <View style={styles.bottomRightPaid}>
            <View style={styles.paidRow}>
              <Text style={styles.paidLabel}>Sudah dibayar</Text>
              <Text style={styles.paidColon}>:</Text>
              <Text style={styles.paidValue}>Sendawar</Text>
            </View>
            <View style={styles.paidRow}>
              <Text style={styles.paidLabel}>Pada Tanggal</Text>
              <Text style={styles.paidColon}>:</Text>
              <Text style={styles.paidValue}>{/* kosong */}</Text>
            </View>
          </View>

          <View style={styles.signers2col}>
            {/* Left signer: KPA */}
            <View style={styles.signerCol}>
              <Text style={styles.signerTitle}>Mengetahui/ Menyetujui</Text>
              <Text style={styles.signerTitle}>Kuasa Pengguna Anggaran</Text>

              <View style={styles.signerSpace} />

              <Text style={styles.signerNameUnderline}>{signers.kpa?.nama ?? ''}</Text>
              <Text style={styles.signerNip}>NIP. {signers.kpa?.nip ?? ''}</Text>
            </View>

            {/* Right signer: BPP */}
            <View style={styles.signerCol}>
              <Text style={styles.signerTitle}>Bendahara Pengeluaran Pembantu</Text>

              <View style={styles.signerSpace} />

              <Text style={styles.signerNameUnderline}>{signers.bpp?.nama ?? ''}</Text>
              <Text style={styles.signerNip}>NIP. {signers.bpp?.nip ?? ''}</Text>
            </View>
          </View>
        </View>
      </Page>
    </Document>
  )
}

/* =========================
   Helpers
========================= */

function sortRoster(list: DopdRosterItem[]) {
  return [...list].sort((a, b) => {
    if (a.role !== b.role) return a.role === 'KEPALA_JALAN' ? -1 : 1
    return a.order - b.order
  })
}

function groupItemsByRoster(items: DopdBiayaItem[]) {
  const safe = Array.isArray(items) ? items : []
  const map = new Map<string, DopdBiayaItem[]>()
  for (const it of safe) {
    const arr = map.get(it.rosterItemId) ?? []
    arr.push(it)
    map.set(it.rosterItemId, arr)
  }
  // keep stable order: by kategori then uraian (biar rapi)
  for (const [k, arr] of map.entries()) {
    map.set(
      k,
      [...arr].sort((a, b) => {
        const ak = (a.kategori ?? '').localeCompare(b.kategori ?? '')
        if (ak !== 0) return ak
        return (a.uraian ?? '').localeCompare(b.uraian ?? '')
      })
    )
  }
  return map
}

function sum(nums: number[]) {
  return nums.reduce((a, b) => a + b, 0)
}

function rupiah(n: number) {
  const s = Math.round(n || 0).toString()
  return s.replace(/\B(?=(\d{3})+(?!\d))/g, '.')
}

function formatPangkatGolongan(pangkat: string | null, gol: string | null) {
  const p = (pangkat ?? '').trim()
  const g = (gol ?? '').trim()
  if (p && g) return `${p} (${g})`
  if (p) return p
  if (g) return g
  return '-'
}

function factorsToInline(factors: DopdFactor[]) {
  const sorted = [...(factors ?? [])].sort((a, b) => a.order - b.order)
  // jika kosong, minimal 1 org biar ada format seperti excel
  if (sorted.length === 0) return [{ order: 1, label: 'org', qty: 1 }]

  return sorted.map((f) => ({
    order: f.order,
    label: (f.label ?? '').trim(),
    qty: Number.isFinite(f.qty) && f.qty > 0 ? Math.floor(f.qty) : 1
  }))
}

/* =========================
   Components
========================= */

function Row3({
  leftNo,
  label,
  value,
  indent,
  indent2,
  boldValue
}: {
  leftNo: string
  label: string
  value: string
  indent?: boolean
  indent2?: boolean
  boldValue?: boolean
}) {
  const s = (...arr: Array<any>) => arr.filter(Boolean)

  return (
    <View style={s(styles.row, indent && styles.indent, indent2 && styles.indent2)}>
      <Text style={styles.no}>{leftNo}</Text>
      <Text style={styles.label}>{label}</Text>
      <Text style={styles.colon}>:</Text>
      <Text style={s(styles.value, boldValue && styles.bold)}>{value}</Text>
    </View>
  )
}

function RincianTable({
  items,
  startNo,
  showJumlah
}: {
  items: DopdBiayaItem[]
  startNo: number
  showJumlah?: boolean
}) {
  const normalized = items ?? []
  const totalJumlah = sum(normalized.map((x) => x.total))

  return (
    <View style={styles.rincianWrap}>
      {normalized.length === 0 ? (
        <View style={styles.rincianEmpty}>
          <Text style={styles.rincianEmptyText}>-</Text>
        </View>
      ) : (
        normalized.map((it, idx) => {
          const no = startNo + idx
          const f = factorsToInline(it.factors)

          return (
            <View key={it.id} style={styles.rincianRow}>
              {/* kiri: "1. Uang Harian" */}
              <Text style={styles.rincianLeft}>{`${no}. ${it.uraian || it.kategori || '-'}`}</Text>
              <Text style={styles.rincianColon}>:</Text>

              {/* kanan: 430.000 x 1 org x 2 hari Rp 860.000 */}
              <View style={styles.rincianRightLine}>
                <Text style={styles.money}>{rupiah(it.hargaSatuan)}</Text>

                {f.map((ff, i) => (
                  <React.Fragment key={`${it.id}-f-${i}`}>
                    <Text style={styles.mul}>x</Text>
                    <Text style={styles.qty}>{String(ff.qty)}</Text>
                    <Text style={styles.unit}>{ff.label || '-'}</Text>
                  </React.Fragment>
                ))}

                <Text style={styles.rp}>Rp</Text>
                <Text style={styles.totalValue}>{rupiah(it.total)}</Text>
              </View>
            </View>
          )
        })
      )}

      {showJumlah ? (
        <View style={styles.jumlahRow}>
          <Text style={styles.jumlahLeft}>Jumlah</Text>
          <Text style={styles.jumlahColon}>:</Text>
          <View style={styles.jumlahRight}>
            <Text style={styles.rpBold}>Rp</Text>
            <Text style={styles.jumlahValueUnderline}>{rupiah(totalJumlah)}</Text>
          </View>
        </View>
      ) : null}
    </View>
  )
}

/* =========================
   Styles
========================= */

const styles = StyleSheet.create({
  page: {
    paddingTop: 48,
    paddingHorizontal: 48,
    paddingBottom: 48,
    fontSize: 8,
    lineHeight: 1.35
  },

  titleWrap: {
    alignItems: 'center',
    marginBottom: 18
  },
  title: {
    fontSize: 11,
    fontWeight: 700,
    textDecoration: 'underline',
    letterSpacing: 0.2
  },

  block: {
    marginTop: 6
  },

  row: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 3
  },
  indent: { marginLeft: 14 },
  indent2: { marginLeft: 28 },

  no: { width: 16 },
  label: { width: 220 },
  colon: { width: 10 },
  value: { flex: 1 },

  bold: { fontWeight: 700 },

  subBlock: { marginTop: 6 },

  rincianWrap: {
    marginTop: 2,
    marginLeft: 42 // sejajarkan dengan "- Perinciannya"
  },
  rincianEmpty: { paddingVertical: 4 },
  rincianEmptyText: { color: '#666' },

  rincianRow: {
    flexDirection: 'row',
    alignItems: 'baseline',
    marginBottom: 2
  },
  rincianLeft: {
    width: 230
  },
  rincianColon: { width: 10 },

  rincianRightLine: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'baseline',
    justifyContent: 'flex-end'
  },

  // kanan: kolom-kolom fixed biar rapi
  money: { width: 62, textAlign: 'right' },
  mul: { width: 10, textAlign: 'center' },
  qty: { width: 18, textAlign: 'right' },
  unit: { width: 26, textAlign: 'left' },

  rp: { width: 18, textAlign: 'right' },
  totalValue: { width: 72, textAlign: 'right' },

  jumlahRow: {
    flexDirection: 'row',
    alignItems: 'baseline',
    marginTop: 2
  },
  jumlahLeft: { width: 230, fontWeight: 700 },
  jumlahColon: { width: 10 },
  jumlahRight: {
    flex: 1,
    flexDirection: 'row',
    justifyContent: 'flex-end',
    alignItems: 'baseline'
  },
  rpBold: { width: 18, textAlign: 'right', fontWeight: 700 },
  jumlahValueUnderline: { width: 72, textAlign: 'right', fontWeight: 700, textDecoration: 'underline' },

  totalWrap: {
    flexDirection: 'row',
    alignItems: 'baseline',
    marginTop: 10
  },
  totalLabel: { width: 246, fontWeight: 700 },
  totalColon: { width: 10 },
  totalRight: { flex: 1, flexDirection: 'row', justifyContent: 'flex-end', alignItems: 'baseline' },
  totalValueUnderline: { width: 72, textAlign: 'right', fontWeight: 700, textDecoration: 'underline' },

  keterangan: { marginTop: 10 },
  ttdTitle: { marginTop: 2, fontWeight: 700 },

  ttdSub: { marginTop: 2 },

  ttdRow: {
    flexDirection: 'row',
    alignItems: 'baseline',
    marginTop: 8
  },
  ttdLeft: { width: 280 },
  ttdRight: { flex: 1, alignItems: 'flex-end' },
  dots: { color: '#111' },

  bottomArea: {
    marginTop: 18
  },

  bottomRightPaid: {
    alignSelf: 'flex-end',
    width: 210,
    marginBottom: 12
  },
  paidRow: { flexDirection: 'row', marginBottom: 2 },
  paidLabel: { width: 78 },
  paidColon: { width: 10 },
  paidValue: { flex: 1 },

  signers2col: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 10
  },
  signerCol: {
    width: '48%',
    alignItems: 'center'
  },
  signerTitle: { textAlign: 'center' },

  signerSpace: { height: 34 },

  signerNameUnderline: { fontWeight: 700, textDecoration: 'underline' },
  signerNip: { marginTop: 2 }
})

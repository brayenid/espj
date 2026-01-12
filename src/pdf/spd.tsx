/* eslint-disable @typescript-eslint/no-explicit-any */
// src/pdf/spd.tsx
import React from 'react'
import { Document, Page, Text, View, StyleSheet, type DocumentProps } from '@react-pdf/renderer'

import KopSurat from '@/pdf/components/kop-surat'

type RosterItem = {
  id: string
  order: number
  role: 'KEPALA_JALAN' | 'PENGIKUT'
  nama: string
  nip: string | null
  jabatan: string
  pangkat: string | null
  golongan: string | null
  instansi: string | null
}

type Spj = {
  noSpd: string | null
  tglSpd: Date
  kotaTandaTangan: string

  tempatBerangkat: string
  tempatTujuan: string
  maksudDinas: string
  alatAngkut: string

  lamaPerjalanan: number
  tglBerangkat: Date
  tglKembali: Date

  akunAnggaran: string | null
}

type Signer = {
  nama: string
  nip: string | null
  jabatan: string
  pangkat: string | null
  golongan: string | null
  instansi: string | null
  jabatanTampil: string | null
}

export type SpdPdfProps = {
  spj: Spj
  roster: RosterItem[]
  signer: Signer | null
}

const BW = 0.7 // border width normal (nggak tebal)

const styles = StyleSheet.create({
  page: {
    paddingTop: 28,
    paddingBottom: 32,
    paddingHorizontal: 28,
    fontSize: 10,
    lineHeight: 1.25,
    fontFamily: 'Helvetica'
  },

  titleWrap: { marginTop: 6, alignItems: 'center' },
  title: { fontSize: 12, fontWeight: 700, textTransform: 'uppercase' },
  nomor: { marginTop: 8 },

  table: {
    marginTop: 10,
    borderWidth: BW,
    borderColor: '#000'
  },

  row: { flexDirection: 'row' },

  // cell: border standar (normal)
  cell: {
    borderRightWidth: BW,
    borderBottomWidth: BW,
    borderColor: '#000',
    paddingVertical: 4,
    paddingHorizontal: 4
  },
  lastCol: { borderRightWidth: 0 },

  colNo: { width: 18, textAlign: 'center' },
  colLabel: { width: 230 },
  colValue: { flex: 1 },

  subRow: { flexDirection: 'row' },
  subKey: { width: 16 },
  subLabel: { flex: 1 },

  // ===== Row 8 layout (sesuai lampiran)
  row8LeftWrap: { width: '100%' },
  row8LeftHeader: { marginBottom: 2 },
  row8Line: { marginTop: 2 },

  row8RightWrap: { width: '100%' },
  row8RightHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 2
  },
  row8RightTglHeader: {
    width: 95,
    textAlign: 'center',
    borderRightWidth: BW,
    borderColor: '#000',
    paddingRight: 4
  },
  row8RightKetHeader: {
    flex: 1,
    textAlign: 'center'
  },
  row8RightRow: { flexDirection: 'row', alignItems: 'flex-start', marginTop: 2 },
  row8RightTgl: {
    width: 95,
    borderRightWidth: BW,
    borderColor: '#000',
    paddingRight: 4
  },
  row8RightKet: {
    flex: 1,
    textAlign: 'center'
  },

  // signature
  signWrap: { marginTop: 30, alignItems: 'flex-end', marginRight: -80 },
  signBox: { width: 255 }, // tetap kanan, jangan ketengah
  signSpace: { height: 48 },
  signName: { fontWeight: 700, textDecoration: 'underline' }
})

function sortRoster(roster: RosterItem[]) {
  return [...roster].sort((a, b) => {
    if (a.role !== b.role) return a.role === 'KEPALA_JALAN' ? -1 : 1
    return a.order - b.order
  })
}

function fmtDate(d: Date) {
  return d.toLocaleDateString('id-ID', { day: '2-digit', month: 'long', year: 'numeric' })
}

function fmtMonthYearNow() {
  const now = new Date()
  return now.toLocaleDateString('id-ID', { month: 'long', year: 'numeric' })
}

function fmtPangkatGol(pangkat: string | null, golongan: string | null) {
  const p = (pangkat ?? '').trim()
  const g = (golongan ?? '').trim()
  if (p && g) return `${p} / ${g}`
  if (p) return p
  if (g) return g
  return '-'
}

// ===== Terbilang (khusus hari) -> "8 (delapan) Hari"
function terbilang(n: number): string {
  const x = Math.floor(Math.abs(n || 0))
  const s = ['', 'satu', 'dua', 'tiga', 'empat', 'lima', 'enam', 'tujuh', 'delapan', 'sembilan', 'sepuluh', 'sebelas']

  if (x === 0) return 'nol'
  if (x < 12) return s[x]
  if (x < 20) return `${s[x - 10]} belas`
  if (x < 100) {
    const puluh = Math.floor(x / 10)
    const satuan = x % 10
    return `${s[puluh]} puluh${satuan ? ' ' + s[satuan] : ''}`
  }
  if (x < 200) return `seratus${x % 100 ? ' ' + terbilang(x - 100) : ''}`
  if (x < 1000) {
    const r = x % 100
    return `${s[Math.floor(x / 100)]} ratus${r ? ' ' + terbilang(r) : ''}`
  }
  // cukup untuk kebutuhan hari SPD; kalau butuh >999 nanti kita extend
  return String(x)
}

function terbilangHari(n: number) {
  const v = Math.max(0, Math.floor(Number(n) || 0))
  if (v === 0) return `0 (nol) Hari`
  return `${v} (${terbilang(v)}) Hari`
}

function Cell({
  children,
  style,
  lastCol,
  lastRow
}: {
  children: React.ReactNode
  style: any
  lastCol?: boolean
  lastRow?: boolean
}) {
  return (
    <View
      style={[
        styles.cell,
        style,
        lastCol ? styles.lastCol : undefined,
        lastRow ? { borderBottomWidth: 0 } : undefined
      ]}>
      {children}
    </View>
  )
}

function PengikutLeft({ pengikut }: { pengikut: RosterItem[] }) {
  const MAX = 5
  return (
    <View style={styles.row8LeftWrap}>
      <Text style={styles.row8LeftHeader}>Pengikut : Nama</Text>
      {Array.from({ length: MAX }).map((_, i) => {
        const p = pengikut[i]
        return (
          <Text key={i} style={styles.row8Line}>
            {i + 1}. {p?.nama ?? ''}
          </Text>
        )
      })}
    </View>
  )
}

function PengikutRight({ pengikut }: { pengikut: RosterItem[] }) {
  const MAX = 5
  return (
    <View style={styles.row8RightWrap}>
      <View style={styles.row8RightHeaderRow}>
        <Text style={styles.row8RightTglHeader}>Tanggal Lahir</Text>
        <Text style={styles.row8RightKetHeader}>Keterangan</Text>
      </View>

      {Array.from({ length: MAX }).map((_, i) => {
        const p = pengikut[i]
        return (
          <View key={i} style={styles.row8RightRow}>
            <Text style={styles.row8RightTgl}>{/* kosong sesuai lampiran */}</Text>
            <Text style={styles.row8RightKet}>{p ? p.jabatan : ''}</Text>
          </View>
        )
      })}
    </View>
  )
}

export function buildSpdDocument(props: SpdPdfProps): React.ReactElement<DocumentProps> {
  const rosterSorted = sortRoster(props.roster)
  const kepala = rosterSorted.find((r) => r.role === 'KEPALA_JALAN') ?? rosterSorted[0] ?? null
  const pengikut = rosterSorted.filter((r) => r.role === 'PENGIKUT')

  const signer = props.signer
  const signerJabatan = signer?.jabatanTampil?.trim() || signer?.jabatan || ''

  const year = props.spj.tglSpd.getFullYear()

  return (
    <Document>
      <Page size="A4" style={styles.page}>
        <KopSurat />

        <View style={styles.titleWrap}>
          <Text style={styles.title}>SURAT PERJALANAN DINAS (SPD)</Text>
          <Text style={styles.nomor}>
            Nomor : {props.spj.noSpd ?? '..................................................'}
          </Text>
        </View>

        <View style={styles.table}>
          {/* 1 */}
          <View style={styles.row}>
            <Cell style={styles.colNo}>
              <Text>1</Text>
            </Cell>
            <Cell style={styles.colLabel}>
              <Text>Pejabat yang berwenang memberi perintah</Text>
            </Cell>
            <Cell style={styles.colValue} lastCol>
              <Text>{signerJabatan || '-'}</Text>
            </Cell>
          </View>

          {/* 2 */}
          <View style={styles.row}>
            <Cell style={styles.colNo}>
              <Text>2</Text>
            </Cell>
            <Cell style={styles.colLabel}>
              <Text>Nama/NIP Pegawai yang melaksanakan perjalanan dinas</Text>
            </Cell>
            <Cell style={styles.colValue} lastCol>
              <Text>{kepala?.nama ?? '-'}</Text>
              <Text>NIP. {kepala?.nip ?? '-'}</Text>
            </Cell>
          </View>

          {/* 3 */}
          <View style={styles.row}>
            <Cell style={styles.colNo}>
              <Text>3</Text>
            </Cell>
            <Cell style={styles.colLabel}>
              <View style={styles.subRow}>
                <Text style={styles.subKey}>a.</Text>
                <Text style={styles.subLabel}>Pangkat dan Golongan</Text>
              </View>
              <View style={styles.subRow}>
                <Text style={styles.subKey}>b.</Text>
                <Text style={styles.subLabel}>Jabatan/Instansi</Text>
              </View>
              <View style={styles.subRow}>
                <Text style={styles.subKey}>c.</Text>
                <Text style={styles.subLabel}>Tingkat Biaya Perjalanan Dinas</Text>
              </View>
            </Cell>
            <Cell style={styles.colValue} lastCol>
              <View style={styles.subRow}>
                <Text style={styles.subKey}>a.</Text>
                <Text style={styles.subLabel}>{fmtPangkatGol(kepala?.pangkat ?? null, kepala?.golongan ?? null)}</Text>
              </View>
              <View style={styles.subRow}>
                <Text style={styles.subKey}>b.</Text>
                <Text style={styles.subLabel}>
                  {kepala?.jabatan ?? '-'}, {kepala?.instansi ?? 'Sekretariat Daerah Kabupaten Kutai Barat'}
                </Text>
              </View>
              <View style={styles.subRow}>
                <Text style={styles.subKey}>c.</Text>
                <Text style={styles.subLabel}>{/* kosong sesuai desain */}</Text>
              </View>
            </Cell>
          </View>

          {/* 4 */}
          <View style={styles.row}>
            <Cell style={styles.colNo}>
              <Text>4</Text>
            </Cell>
            <Cell style={styles.colLabel}>
              <Text>Maksud Perjalanan Dinas</Text>
            </Cell>
            <Cell style={styles.colValue} lastCol>
              <Text>{props.spj.maksudDinas}</Text>
            </Cell>
          </View>

          {/* 5 */}
          <View style={styles.row}>
            <Cell style={styles.colNo}>
              <Text>5</Text>
            </Cell>
            <Cell style={styles.colLabel}>
              <Text>Alat Angkut yang dipergunakan</Text>
            </Cell>
            <Cell style={styles.colValue} lastCol>
              <Text>{props.spj.alatAngkut}</Text>
            </Cell>
          </View>

          {/* 6 */}
          <View style={styles.row}>
            <Cell style={styles.colNo}>
              <Text>6</Text>
            </Cell>
            <Cell style={styles.colLabel}>
              <View style={styles.subRow}>
                <Text style={styles.subKey}>a.</Text>
                <Text style={styles.subLabel}>Tempat Berangkat</Text>
              </View>
              <View style={styles.subRow}>
                <Text style={styles.subKey}>b.</Text>
                <Text style={styles.subLabel}>Tempat Tujuan</Text>
              </View>
            </Cell>
            <Cell style={styles.colValue} lastCol>
              <View style={styles.subRow}>
                <Text style={styles.subKey}>a.</Text>
                <Text style={styles.subLabel}>{props.spj.tempatBerangkat}</Text>
              </View>
              <View style={styles.subRow}>
                <Text style={styles.subKey}>b.</Text>
                <Text style={styles.subLabel}>{props.spj.tempatTujuan}</Text>
              </View>
            </Cell>
          </View>

          {/* 7 */}
          <View style={styles.row}>
            <Cell style={styles.colNo}>
              <Text>7</Text>
            </Cell>
            <Cell style={styles.colLabel}>
              <View style={styles.subRow}>
                <Text style={styles.subKey}>a.</Text>
                <Text style={styles.subLabel}>Lamanya Perjalanan Dinas</Text>
              </View>
              <View style={styles.subRow}>
                <Text style={styles.subKey}>b.</Text>
                <Text style={styles.subLabel}>Tanggal Berangkat</Text>
              </View>
              <View style={styles.subRow}>
                <Text style={styles.subKey}>c.</Text>
                <Text style={styles.subLabel}>Tanggal Harus Kembali</Text>
              </View>
            </Cell>
            <Cell style={styles.colValue} lastCol>
              <View style={styles.subRow}>
                <Text style={styles.subKey}>a.</Text>
                <Text style={styles.subLabel}>{terbilangHari(props.spj.lamaPerjalanan)}</Text>
              </View>
              <View style={styles.subRow}>
                <Text style={styles.subKey}>b.</Text>
                <Text style={styles.subLabel}>{fmtDate(props.spj.tglBerangkat)}</Text>
              </View>
              <View style={styles.subRow}>
                <Text style={styles.subKey}>c.</Text>
                <Text style={styles.subLabel}>{fmtDate(props.spj.tglKembali)}</Text>
              </View>
            </Cell>
          </View>

          {/* 8 Pengikut (sesuai lampiran: Nama di kiri, Tgl/Ket di kanan) */}
          <View style={styles.row}>
            <Cell style={styles.colNo}>
              <Text>8</Text>
            </Cell>

            <Cell style={[styles.colLabel, { paddingVertical: 4, paddingHorizontal: 6 }]}>
              <PengikutLeft pengikut={pengikut} />
            </Cell>

            <Cell style={[styles.colValue, { paddingVertical: 4, paddingHorizontal: 6 }]} lastCol>
              <PengikutRight pengikut={pengikut} />
            </Cell>
          </View>

          {/* 9 */}
          <View style={styles.row}>
            <Cell style={styles.colNo}>
              <Text>9</Text>
            </Cell>
            <Cell style={styles.colLabel}>
              <Text>Pembebanan Anggaran</Text>
            </Cell>
            <Cell style={styles.colValue} lastCol>
              <Text>{props.spj.akunAnggaran ?? '-'}</Text>
              <View style={{ marginTop: 4 }}>
                <View style={styles.subRow}>
                  <Text style={styles.subKey}>a.</Text>
                  <Text style={styles.subLabel}>Instansi</Text>
                </View>
                <View style={styles.subRow}>
                  <Text style={styles.subKey}>b.</Text>
                  <Text style={styles.subLabel}>Akun</Text>
                </View>
              </View>
              <View style={{ marginTop: 2 }}>
                <View style={styles.subRow}>
                  <Text style={styles.subKey}>a.</Text>
                  <Text style={styles.subLabel}>{kepala?.instansi ?? 'Sekretariat Daerah Kabupaten Kutai Barat'}</Text>
                </View>
                <View style={styles.subRow}>
                  <Text style={styles.subKey}>b.</Text>
                  <Text style={styles.subLabel}>{/* kosong sesuai desain */}</Text>
                </View>
              </View>
            </Cell>
          </View>

          {/* 10 (last row => remove bottom border) */}
          <View style={styles.row}>
            <Cell style={styles.colNo} lastRow>
              <Text>10</Text>
            </Cell>
            <Cell style={styles.colLabel} lastRow>
              <Text>Keterangan lain-lain</Text>
            </Cell>
            <Cell style={styles.colValue} lastCol lastRow>
              <Text>
                Setibanya ditempat yang dituju supaya SPPD ini diketahui oleh Pejabat yang berwenang ditempat tersebut
              </Text>
            </Cell>
          </View>
        </View>

        {/* Signature (tetap kanan, dan tanggal month-year mengikuti hari ini) */}
        <View style={styles.signWrap}>
          <View style={styles.signBox}>
            <Text>Dikeluarkan di {props.spj.kotaTandaTangan}</Text>
            <Text>
              Tanggal, {'        '} {fmtMonthYearNow()}
            </Text>
            <Text>{signerJabatan ? `${signerJabatan},` : ''}</Text>

            <View style={styles.signSpace} />

            <Text style={styles.signName}>{signer?.nama ?? ''}</Text>
            <Text>{fmtPangkatGol(signer?.pangkat ?? null, signer?.golongan ?? null)}</Text>
            <Text>{signer?.nip ? `NIP. ${signer.nip}` : ''}</Text>
          </View>
        </View>
      </Page>
    </Document>
  )
}

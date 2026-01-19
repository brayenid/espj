// src/pdf/laporan.tsx
import React from 'react'
import { Document, Page, StyleSheet, Text, View, type DocumentProps } from '@react-pdf/renderer'
import KopSurat from '@/pdf/components/kop-surat'
import { LaporanHasilMode } from '@prisma/client'
import { fmtDateId } from '@/lib/utils'

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

type Laporan = {
  dasarLaporan: string | null
  kegiatan: string | null
  waktu: string | null
  lokasi: string | null
  tujuan: string | null

  signerNama: string | null
  signerNip: string | null
  signerJabatan: string | null
  signerPangkat: string | null
  signerGolongan: string | null
  signerJabatanTampil: string | null

  hasilMode: LaporanHasilMode
  hasilPembuka: string | null
  hasilPoin: string[]
  hasilNarasi: string | null
}

export type LaporanPdfProps = {
  spj: {
    noSuratTugas: string | null
  }
  roster: RosterItem[]
  laporan: Laporan | null
}

function sortRoster(list: RosterItem[]) {
  return [...list].sort((a, b) => {
    if (a.role !== b.role) return a.role === 'KEPALA_JALAN' ? -1 : 1
    return a.order - b.order
  })
}

function safeText(s?: string | null, fallback = '-') {
  const t = (s ?? '').trim()
  return t.length ? t : fallback
}

function fmtPangkatGol(pangkat: string | null, gol: string | null) {
  const p = (pangkat ?? '').trim()
  const g = (gol ?? '').trim()
  if (p && g) return `${p} (${g})`
  if (p) return p
  if (g) return g
  return ''
}

function dots(len = 12) {
  return '.'.repeat(len)
}

function normalizeMultiline(s: string) {
  return s.replace(/\r\n/g, '\n').replace(/\r/g, '\n').trim()
}

function normalizeOneLine(s: string) {
  return normalizeMultiline(s).replace(/\s+/g, ' ').trim().toLowerCase()
}

function MetaRow({ label, value }: { label: string; value: string }) {
  return (
    <View style={styles.metaRow}>
      <Text style={styles.metaLabel}>{label}</Text>
      <Text style={styles.metaColon}>:</Text>
      <Text style={styles.metaValue}>{value}</Text>
    </View>
  )
}

function PointsBlock({ points }: { points: string[] }) {
  const cleaned = (points ?? []).map((x) => normalizeMultiline(String(x || ''))).filter(Boolean)
  if (cleaned.length === 0) return <Text style={styles.bodyText}>-</Text>

  return (
    <View style={{ marginTop: 2 }}>
      {cleaned.map((p, idx) => (
        <View key={idx} style={styles.pointRow}>
          <Text style={styles.pointNo}>{idx + 1}.</Text>
          <Text style={styles.pointText}>{p}</Text>
        </View>
      ))}
    </View>
  )
}

export function buildLaporanDocument(props: LaporanPdfProps): React.ReactElement<DocumentProps> {
  const rosterSorted = sortRoster(props.roster ?? [])
  const laporan = props.laporan

  const dasar = safeText(
    laporan?.dasarLaporan ?? (props.spj.noSuratTugas ? `Surat Tugas Nomor ${props.spj.noSuratTugas}` : null),
    '-'
  )

  const kegiatanRaw = (laporan?.kegiatan ?? '').trim()
  const kegiatan = safeText(laporan?.kegiatan, '-')
  const waktu = safeText(laporan?.waktu ?? fmtDateId(new Date()), '-')
  const lokasi = safeText(laporan?.lokasi, '-')
  const tujuan = safeText(laporan?.tujuan, '-')

  const hasilMode = laporan?.hasilMode ?? 'POINTS'
  const hasilNarasi = normalizeMultiline(safeText(laporan?.hasilNarasi, ''))

  // ===== FIX: pembuka jangan dobel
  const pembukaManual = normalizeMultiline(safeText(laporan?.hasilPembuka, ''))
  const pembukaAuto =
    kegiatanRaw.length > 0
      ? `Setelah melakukan kegiatan ${kegiatanRaw}, maka dapat disimpulkan sebagai berikut:`
      : `Setelah melakukan kegiatan, maka dapat disimpulkan sebagai berikut:`

  // kalau manual kosong -> pakai auto
  // kalau manual ada tapi sama dengan auto -> pakai auto (biar tidak dobel “makadapat…”)
  const manualIsSameAsAuto = normalizeOneLine(pembukaManual) === normalizeOneLine(pembukaAuto)
  const pembukaFinal =
    pembukaManual.length > 0 && !manualIsSameAsAuto
      ? pembukaManual
      : hasilMode === 'POINTS'
        ? pembukaAuto
        : pembukaManual

  const signerNama = safeText(laporan?.signerNama, '')
  const signerNip = safeText(laporan?.signerNip, '')
  const signerJabatanRaw = (laporan?.signerJabatanTampil ?? laporan?.signerJabatan ?? '').trim()
  const signerJabatanLabel = signerJabatanRaw ? `${signerJabatanRaw},` : ''
  const signerPangkatGol = fmtPangkatGol(laporan?.signerPangkat ?? null, laporan?.signerGolongan ?? null)

  return (
    <Document>
      <Page size="A4" style={styles.page}>
        <KopSurat />

        <View style={styles.titleWrap}>
          <Text style={styles.title}>LAPORAN PERJALANAN DINAS</Text>
        </View>

        <View style={styles.metaWrap}>
          <MetaRow label="Dasar Laporan" value={dasar} />
          <MetaRow label="Kegiatan Yang Di Lakukan" value={kegiatan} />
          <MetaRow label="Waktu" value={waktu} />
          <MetaRow label="1. Lokasi" value={lokasi} />
          <MetaRow label="2. Tujuan" value={tujuan} />
        </View>

        <View style={styles.sectionRow}>
          <Text style={styles.metaLabel}>3. Hasil Pelaksanaan</Text>
          <Text style={styles.metaColon}>:</Text>

          <View style={styles.sectionValue}>
            {/* ✅ hanya satu pembuka */}
            {pembukaFinal ? <Text style={styles.bodyText}>{pembukaFinal}</Text> : null}

            {hasilMode === 'POINTS' ? <PointsBlock points={laporan?.hasilPoin ?? []} /> : null}

            {hasilMode === 'NARRATIVE' ? (
              <Text style={[styles.bodyText, { marginTop: pembukaFinal ? 6 : 0 }]}>{hasilNarasi || '-'}</Text>
            ) : null}
          </View>
        </View>

        <View style={{ marginTop: 10 }}>
          <Text style={[styles.bodyText, styles.paragraph]}>
            Demikian laporan Perjalanan Dinas ini kami sampaikan untuk bahan pertanggungjawaban kerja sesuai dengan
            bidang tugas dan untuk bahan tindak lanjut bagaimana mestinya.
          </Text>
        </View>

        {/* ===== Signatures */}
        <View style={styles.signWrap}>
          {/* Left signer */}
          <View style={styles.signColLeft}>
            <Text style={styles.signLabel}>{signerJabatanLabel || ''}</Text>
            <View style={styles.signSpace} />
            <Text style={styles.signName}>{signerNama}</Text>
            {signerPangkatGol ? <Text style={styles.signSub}>{signerPangkatGol}</Text> : null}
            {signerNip ? <Text style={styles.signSub}>NIP. {signerNip}</Text> : null}
          </View>

          {/* Right roster executor */}
          <View style={styles.signColRight}>
            <Text style={styles.signLabel}>Yang Melaksanakan Tugas</Text>

            <View style={{ marginTop: 8 }}>
              {rosterSorted.map((r, idx) => (
                <View key={r.id} style={styles.execRow}>
                  <Text style={styles.execNo}>{idx + 1}</Text>

                  <Text style={styles.execName}>{safeText(r.nama, '-')}</Text>

                  {/* zig-zag hanya titik */}
                  <View style={styles.execDotsArea}>
                    <View style={[styles.execDotsInner, idx % 2 === 0 ? styles.execDotsLeft : styles.execDotsRight]}>
                      <Text style={styles.execDotsText}>: {dots(14)}</Text>
                    </View>
                  </View>
                </View>
              ))}
            </View>
          </View>
        </View>
      </Page>
    </Document>
  )
}

export default function LaporanPdf(props: LaporanPdfProps) {
  return buildLaporanDocument(props)
}

const styles = StyleSheet.create({
  page: {
    paddingTop: 40,
    paddingBottom: 40,
    paddingHorizontal: 50,
    fontSize: 11,
    lineHeight: 1.35,
    fontFamily: 'Helvetica'
  },

  hr: {
    marginTop: 8,
    borderTopWidth: 1,
    borderTopColor: '#000'
  },

  titleWrap: {
    marginTop: 10,
    alignItems: 'center',
    marginBottom: 10
  },
  title: {
    fontSize: 11,
    fontWeight: 700,
    textTransform: 'uppercase'
  },

  metaWrap: {
    marginTop: 10
  },
  metaRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 2
  },
  metaLabel: {
    width: 150
  },
  metaColon: {
    width: 10,
    textAlign: 'center'
  },
  metaValue: {
    flex: 1
  },

  sectionRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginTop: 4
  },
  sectionValue: {
    flex: 1
  },

  bodyText: {
    fontSize: 11,
    lineHeight: 1.5
  },

  paragraph: {
    textAlign: 'justify',
    textIndent: 22
  },

  pointRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 3
  },
  pointNo: {
    width: 14
  },
  pointText: {
    flex: 1
  },

  signWrap: {
    marginTop: 28,
    flexDirection: 'row',
    justifyContent: 'space-between'
  },
  signColLeft: {
    width: '45%'
  },
  signColRight: {
    width: '55%'
  },
  signLabel: {
    fontSize: 11
  },
  signSpace: {
    height: 44
  },
  signName: {
    fontWeight: 700,
    textDecoration: 'underline'
  },
  signSub: {
    marginTop: 2
  },

  execRow: {
    flexDirection: 'row',
    alignItems: 'baseline',
    marginBottom: 10
  },

  execNo: { width: 14 },

  // fixed supaya ":" sejajar dan "titik" gak nabrak nama
  execName: { width: 240 },

  execColon: { width: 10, textAlign: 'center' },

  // area setelah ":" (sisa lebar kolom kanan)
  execDotsArea: { flex: 1, marginLeft: -70 },

  // inner wrapper biar kita bisa “geser kanan” tapi tetap ada batas
  execDotsInner: { width: 140 }, // BUKAN flex

  execDotsLeft: { alignItems: 'flex-start' },
  execDotsRight: { alignItems: 'flex-end' },

  // panjang garis titik
  execDotsText: { width: 90 }
})

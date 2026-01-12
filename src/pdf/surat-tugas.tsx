import React from 'react'
import { Document, Page, Text, View, StyleSheet, type DocumentProps } from '@react-pdf/renderer'

import KopSurat from '@/pdf/components/kop-surat'
import { terbilangId } from '@/lib/utils'

type Roster = {
  id: string
  nama: string
  nip: string | null
  jabatan: string
  pangkat: string | null
  golongan: string | null
}

type Spj = {
  kotaTandaTangan: string
  tempatTujuan: string
  tempatBerangkat: string
  alatAngkut: string
  lamaPerjalanan: number
  akunAnggaran: string | null
  tglBerangkat: Date
  tglKembali: Date
  tglSuratTugas: Date
}

type SuratTugas = {
  nomor: string | null
  untuk: string
  assignedRosterItemId: string | null

  signerNama: string
  signerNip: string | null
  signerJabatan: string
  signerPangkatGolongan: string | null
}

export type SuratTugasPdfProps = {
  spj: Spj
  suratTugas: SuratTugas
  roster: Roster[]
}

const styles = StyleSheet.create({
  page: {
    paddingTop: 34,
    paddingBottom: 36,
    paddingHorizontal: 42,
    fontSize: 11,
    lineHeight: 1.35,
    fontFamily: 'Helvetica'
  },

  blockCenter: { alignItems: 'center' },
  title: {
    marginTop: 6,
    fontSize: 12,
    fontWeight: 700,
    textTransform: 'uppercase'
  },
  nomor: {
    marginTop: 4,
    fontSize: 11
  },

  memerintahkan: {
    marginTop: 14,
    marginBottom: 10,
    textAlign: 'center',
    fontWeight: 700,
    textTransform: 'uppercase'
  },

  table: { marginTop: 2 },
  row: { flexDirection: 'row', marginBottom: 6 },
  colLeft: { width: 105 },
  colColon: { width: 10, textAlign: 'center' },
  colRight: { flex: 1 },

  // sub block “Kepada : 1 Nama ...”
  subWrap: { marginLeft: 18 },
  subRow: { flexDirection: 'row', marginBottom: 4 },
  subNo: { width: 16 },
  subLabel: { width: 95 },
  subColon: { width: 10, textAlign: 'center' },
  subValue: { flex: 1 },

  // ttd
  ttdWrap: { marginTop: 25, alignItems: 'flex-end', marginRight: -80 },
  ttdBox: { width: 240 },
  ttdDate: { textAlign: 'left' },
  ttdJabatan: { marginTop: 2 },
  ttdSpace: { height: 60 },
  ttdName: { fontWeight: 700, textDecoration: 'underline' },
  ttdPangkat: { marginTop: 2 },
  ttdNip: { marginTop: 2 }
})

function fmtDate(d: Date) {
  return d.toLocaleDateString('id-ID', { day: '2-digit', month: 'long', year: 'numeric' })
}

function fmtMonthYear(d: Date) {
  return d.toLocaleDateString('id-ID', { month: 'long', year: 'numeric' })
}

function fmtPangkatGol(pangkat: string | null, golongan: string | null) {
  const p = (pangkat ?? '').trim()
  const g = (golongan ?? '').trim()
  if (p && /\([^)]+\)/.test(p)) return p
  if (p && !g) return p
  if (p && g) return `${p} (${g})`
  if (!p && g) return g
  return '-'
}

export function buildSuratTugasDocument(props: SuratTugasPdfProps): React.ReactElement<DocumentProps> {
  const { spj, suratTugas, roster } = props

  // contoh dokumen: "6 (enam) hari, tanggal 10 November s.d. tanggal 15 November 2025"
  const lamaText = `${spj.lamaPerjalanan} (${terbilangId(spj.lamaPerjalanan)}) hari, tanggal ${fmtDate(
    spj.tglBerangkat
  )} s.d. tanggal ${fmtDate(spj.tglKembali)}`

  return (
    <Document>
      <Page size="A4" style={styles.page}>
        <KopSurat />

        <View style={styles.blockCenter}>
          <Text style={styles.title}>SURAT TUGAS</Text>
          <Text style={styles.nomor}>
            NOMOR : {suratTugas.nomor || '.......................................................'}
          </Text>
        </View>

        <Text style={styles.memerintahkan}>MEMERINTAHKAN:</Text>

        <View style={styles.table}>
          {/* Kepada */}
          <View style={styles.row}>
            <Text style={styles.colLeft}>Kepada</Text>
            <Text style={styles.colColon}>:</Text>

            <View style={styles.colRight}>
              <View style={styles.subWrap}>
                {roster.map((r, idx) => (
                  <View key={r.id} style={{ marginBottom: 8 }}>
                    <View style={styles.subRow}>
                      <Text style={styles.subNo}>{idx + 1}</Text>
                      <Text style={styles.subLabel}>Nama</Text>
                      <Text style={styles.subColon}>:</Text>
                      <Text style={styles.subValue}>{r.nama}</Text>
                    </View>

                    <View style={styles.subRow}>
                      <Text style={styles.subNo} />
                      <Text style={styles.subLabel}>Pangkat/Gol</Text>
                      <Text style={styles.subColon}>:</Text>
                      <Text style={styles.subValue}>{fmtPangkatGol(r.pangkat, r.golongan)}</Text>
                    </View>

                    <View style={styles.subRow}>
                      <Text style={styles.subNo} />
                      <Text style={styles.subLabel}>NIP</Text>
                      <Text style={styles.subColon}>:</Text>
                      <Text style={styles.subValue}>{r.nip ?? '-'}</Text>
                    </View>

                    <View style={styles.subRow}>
                      <Text style={styles.subNo} />
                      <Text style={styles.subLabel}>Jabatan</Text>
                      <Text style={styles.subColon}>:</Text>
                      <Text style={styles.subValue}>{r.jabatan}</Text>
                    </View>
                  </View>
                ))}
              </View>
            </View>
          </View>

          {/* Untuk */}
          <View style={styles.row}>
            <Text style={styles.colLeft}>Untuk</Text>
            <Text style={styles.colColon}>:</Text>
            <Text style={styles.colRight}>{suratTugas.untuk}</Text>
          </View>

          {/* Tujuan */}
          <View style={styles.row}>
            <Text style={styles.colLeft}>Tujuan</Text>
            <Text style={styles.colColon}>:</Text>
            <Text style={styles.colRight}>{spj.tempatTujuan}</Text>
          </View>

          {/* Lamanya */}
          <View style={styles.row}>
            <Text style={styles.colLeft}>Lamanya</Text>
            <Text style={styles.colColon}>:</Text>
            <Text style={styles.colRight}>{lamaText}</Text>
          </View>

          {/* Beban Anggaran */}
          <View style={styles.row}>
            <Text style={styles.colLeft}>Beban Anggaran</Text>
            <Text style={styles.colColon}>:</Text>
            <Text style={styles.colRight}>{spj.akunAnggaran ?? '-'}</Text>
          </View>
        </View>

        <View style={styles.ttdWrap}>
          <View style={styles.ttdBox}>
            <Text style={styles.ttdDate}>
              {spj.kotaTandaTangan}, {'     '} {fmtMonthYear(spj.tglSuratTugas)}
            </Text>
            <Text style={styles.ttdJabatan}>{suratTugas.signerJabatan},</Text>
            <View style={styles.ttdSpace} />
            <Text style={styles.ttdName}>{suratTugas.signerNama}</Text>
            <Text style={styles.ttdPangkat}>{suratTugas.signerPangkatGolongan ?? '-'}</Text>
            <Text style={styles.ttdNip}>NIP. {suratTugas.signerNip ?? '-'}</Text>
          </View>
        </View>
      </Page>
    </Document>
  )
}

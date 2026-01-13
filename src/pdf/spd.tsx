/* eslint-disable @typescript-eslint/no-explicit-any */
// src/pdf/spd.tsx
import React from 'react'
import { Document, Page, Text, View, StyleSheet, type DocumentProps } from '@react-pdf/renderer'

import KopSurat from '@/pdf/components/kop-surat'
import { fmtDateId, terbilangId } from '@/lib/utils'

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
  judulAnggaran?: string | null
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

const BW = 0.7

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

  // Gaya khusus Poin 8 agar garis vertikal menerus
  row8Header: {
    flexDirection: 'row',
    borderBottomWidth: BW,
    borderColor: '#000',
    backgroundColor: '#fff'
  },
  row8Body: {
    flexDirection: 'row'
  },
  col8Nama: {
    width: 230, // Harus sama dengan colLabel
    borderRightWidth: BW,
    borderColor: '#000',
    padding: 4
  },
  col8Tgl: {
    width: 95, // Lebar kolom tanggal lahir
    borderRightWidth: BW,
    borderColor: '#000',
    padding: 4,
    textAlign: 'center'
  },
  col8Ket: {
    flex: 1,
    padding: 4,
    textAlign: 'center'
  },

  signWrap: { marginTop: 30, alignItems: 'flex-end', marginRight: -80 },
  signBox: { width: 255 },
  signSpace: { height: 48 },
  signName: { fontWeight: 700, textDecoration: 'underline' }
})

function sortRoster(roster: RosterItem[]) {
  return [...roster].sort((a, b) => {
    if (a.role !== b.role) return a.role === 'KEPALA_JALAN' ? -1 : 1
    return a.order - b.order
  })
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

function Cell({ children, style, lastCol, lastRow }: any) {
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

export function buildSpdDocument(props: SpdPdfProps): React.ReactElement<DocumentProps> {
  const rosterSorted = sortRoster(props.roster)
  const kepala = rosterSorted.find((r) => r.role === 'KEPALA_JALAN') ?? rosterSorted[0] ?? null
  const pengikut = rosterSorted.filter((r) => r.role === 'PENGIKUT')
  const signer = props.signer
  const signerJabatan = signer?.jabatanTampil?.trim() || signer?.jabatan || ''
  const MAX_PENGIKUT = 5

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
          {/* Baris 1-7 tetap seperti sebelumnya */}
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
                <Text style={styles.subLabel}>-</Text>
              </View>
            </Cell>
          </View>

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
                <Text style={styles.subLabel}>{terbilangId(props.spj.lamaPerjalanan)}</Text>
              </View>
              <View style={styles.subRow}>
                <Text style={styles.subKey}>b.</Text>
                <Text style={styles.subLabel}>{fmtDateId(props.spj.tglBerangkat)}</Text>
              </View>
              <View style={styles.subRow}>
                <Text style={styles.subKey}>c.</Text>
                <Text style={styles.subLabel}>{fmtDateId(props.spj.tglKembali)}</Text>
              </View>
            </Cell>
          </View>

          {/* PERBAIKAN POIN 8: Garis pemisah Nama, Tgl Lahir, Ket memanjang ke bawah */}
          <View style={styles.row}>
            <Cell style={[styles.colNo, { borderBottomWidth: BW }]}>
              <Text>8</Text>
            </Cell>
            <View style={{ flex: 1, borderBottomWidth: BW, borderColor: '#000' }}>
              {/* Header Poin 8 */}
              <View style={styles.row8Header}>
                <View style={[styles.col8Nama, { borderBottomWidth: 0 }]}>
                  <Text>Pengikut : Nama</Text>
                </View>
                <View style={[styles.col8Tgl, { borderBottomWidth: 0 }]}>
                  <Text>Tanggal Lahir</Text>
                </View>
                <View style={[styles.col8Ket, { borderBottomWidth: 0 }]}>
                  <Text>Keterangan</Text>
                </View>
              </View>
              {/* Body Poin 8 */}
              {Array.from({ length: MAX_PENGIKUT }).map((_, i) => {
                const p = pengikut[i]
                return (
                  <View key={i} style={styles.row8Body}>
                    <View style={[styles.col8Nama, { borderRightWidth: BW, borderBottomWidth: 0 }]}>
                      <Text>
                        {i + 1}. {p?.nama ?? ''}
                      </Text>
                    </View>
                    <View style={[styles.col8Tgl, { borderRightWidth: BW, borderBottomWidth: 0 }]}>
                      <Text>{/* Kosong sesuai SS */}</Text>
                    </View>
                    <View style={[styles.col8Ket, { borderBottomWidth: 0 }]}>
                      <Text>{p?.jabatan ?? ''}</Text>
                    </View>
                  </View>
                )
              })}
            </View>
          </View>

          {/* 9 PEMBEBANAN ANGGARAN */}
          <View style={styles.row}>
            <Cell style={styles.colNo}>
              <Text>9</Text>
            </Cell>
            <Cell style={styles.colLabel}>
              <Text>Pembebanan Anggaran</Text>
              <View style={{ marginTop: 8 }}>
                <View style={styles.subRow}>
                  <Text style={styles.subKey}>a.</Text>
                  <Text style={styles.subLabel}>Instansi</Text>
                </View>
                <View style={styles.subRow}>
                  <Text style={styles.subKey}>b.</Text>
                  <Text style={styles.subLabel}>Akun</Text>
                </View>
              </View>
            </Cell>
            <Cell style={styles.colValue} lastCol>
              <Text>{props.spj.akunAnggaran ?? 'DPA SKPD Bagian Organisasi'}</Text>
              <View style={{ marginTop: 8 }}>
                <View style={styles.subRow}>
                  <Text style={styles.subKey}>a.</Text>
                  <Text style={styles.subLabel}>{kepala?.instansi ?? 'Sekretariat Daerah Kabupaten Kutai Barat'}</Text>
                </View>
                <View style={styles.subRow}>
                  <Text style={styles.subKey}>b.</Text>
                  <Text style={styles.subLabel}>{'-'}</Text>
                </View>
              </View>
            </Cell>
          </View>

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

        <View style={styles.signWrap}>
          <View style={styles.signBox}>
            <Text>Dikeluarkan di {props.spj.kotaTandaTangan}</Text>
            <Text>
              Tanggal, {'            '} {fmtMonthYearNow()}
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

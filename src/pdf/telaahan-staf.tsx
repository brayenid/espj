// src/pdf/telaahan-staf.tsx
import React from 'react'
import { Document, Page, Text, View, StyleSheet, type DocumentProps } from '@react-pdf/renderer'
import KopSurat from '@/pdf/components/kop-surat'
import { fmtDateId } from '@/lib/utils'

export type RosterItemPdf = {
  order: number
  role: 'KEPALA_JALAN' | 'PENGIKUT'
  nama: string
  nip: string | null
  jabatan: string
  pangkat: string | null // bisa "Pembina (IV/a)" atau "IX"
  golongan: string | null // bisa "IV/a" kalau dipisah
}

export type TelaahanPdfData = {
  // meta
  kepada: string | null // Kepada Yth
  sifat: string | null
  lampiran: string | null
  perihal: string | null

  // isi
  dasar: string | null
  praAnggapan: string[]
  fakta: string[]
  analisis: string | null
  kesimpulan: string | null
  saran: string | null
  tglTelaahan: Date | undefined
}

export type SpjPdfData = {
  kotaTandaTangan: string
  tglSuratTugas: Date
  noTelaahan?: string | null
}

export type TelaahanSigner = {
  nama: string
  nip?: string | null
  jabatan?: string | null
  pangkat?: string | null // contoh: "Pembina (IV/a)"
  golongan?: string | null // contoh: "IV/a"
} | null

export type TelaahanStafPdfProps = {
  spj: SpjPdfData
  telaahan: TelaahanPdfData
  roster: RosterItemPdf[]
  signer?: TelaahanSigner

  instansiLine1?: string
  instansiLine2?: string
  alamatLine?: string
}

const styles = StyleSheet.create({
  page: {
    paddingTop: 28,
    paddingBottom: 32,
    paddingHorizontal: 40,
    fontSize: 11,
    lineHeight: 1.35,
    fontFamily: 'Helvetica'
  },

  // ===== Kop surat (fixed) =====
  header: {
    position: 'relative',
    marginBottom: 10,
    paddingBottom: 8
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center'
  },
  logoWrap: {
    width: 62,
    height: 62,
    marginRight: 10,
    justifyContent: 'center',
    alignItems: 'center'
  },
  logo: {
    width: 56,
    height: 56,
    objectFit: 'contain'
  },
  headerText: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center'
  },
  instansi1: {
    fontSize: 12,
    fontWeight: 700,
    textTransform: 'uppercase'
  },
  instansi2: {
    fontSize: 16,
    fontWeight: 700,
    textTransform: 'uppercase',
    marginTop: 2
  },
  alamat: {
    fontSize: 8.5,
    marginTop: 4,
    textAlign: 'center'
  },
  line: {
    marginTop: 8,
    borderBottomWidth: 1.2,
    borderBottomColor: '#000'
  },

  title: {
    marginTop: 6,
    textAlign: 'center',
    fontSize: 11.5,
    fontWeight: 700,
    textTransform: 'uppercase',
    textDecoration: 'underline',
    letterSpacing: 0.3
  },

  // ===== Meta kiri =====
  metaBlock: {
    marginTop: 10,
    marginBottom: 10,
    width: '70%'
  },
  metaRow: {
    flexDirection: 'row',
    marginBottom: 2.5
  },
  metaLabel: { width: 80 },
  metaColon: { width: 10, textAlign: 'center' },
  metaValue: { flex: 1 },

  // ===== Section styles =====
  sectionTitle: {
    fontWeight: 700,
    marginTop: 10,
    marginBottom: 6
  },

  // paragraf seperti contoh: ada indent + justify
  paragraph: {
    textAlign: 'justify',
    marginLeft: 16,
    marginRight: 6,
    marginBottom: 6,
    textIndent: 22,
    lineHeight: 1
  },

  // list bernomor di kiri (1. 2. 3.) dengan indent seperti contoh
  listItem: {
    flexDirection: 'row',
    marginLeft: 24,
    marginRight: 6,
    marginBottom: 4
  },
  listNo: {
    width: 16
  },
  listText: {
    flex: 1,
    textAlign: 'justify'
  },

  // Kesimpulan biasanya paragraf tanpa list
  paragraphNoIndent: {
    textAlign: 'justify',
    marginLeft: 16,
    marginRight: 6,
    marginBottom: 6
  },

  // ===== Saran/Tindakan roster block =====
  rosterIntro: {
    marginLeft: 16,
    marginRight: 6,
    marginBottom: 8,
    textAlign: 'justify'
  },

  personBlock: {
    marginLeft: 34,
    marginBottom: 8
  },
  personRow: {
    flexDirection: 'row',
    marginBottom: 2.5
  },
  personNo: {
    width: 16,
    fontWeight: 700
  },
  personContent: {
    flex: 1
  },
  personLine: {
    flexDirection: 'row',
    marginBottom: 2
  },
  personLabel: { width: 95 },
  personColon: { width: 10, textAlign: 'center' },
  personValue: { flex: 1 },

  closing: {
    marginTop: 8,
    marginLeft: 16,
    marginRight: 6,
    textAlign: 'justify'
  },

  // ===== Signature =====
  signerWrap: {
    marginTop: 18,
    alignItems: 'flex-end'
  },
  signerBox: {
    width: 240
  },
  signerJabatan: {
    textAlign: 'center',
    marginBottom: 2
  },
  signerSpace: {
    height: 55
  },
  signerName: {
    textAlign: 'center',
    fontWeight: 700,
    textDecoration: 'underline'
  },
  signerPangkat: {
    textAlign: 'center',
    marginTop: 1
  },
  signerNip: {
    textAlign: 'center',
    marginTop: 1
  }
})

function splitParagraphs(text: string) {
  return text
    .split(/\n+/)
    .map((t) => t.trim())
    .filter(Boolean)
}

function fmtPangkatGolongan(pangkat: string | null, golongan: string | null) {
  const p = (pangkat ?? '').trim()
  const g = (golongan ?? '').trim()

  if (p && /\([^)]+\)/.test(p)) return p
  if (p && !g) return p
  if (p && g) return `${p} (${g})`
  if (!p && g) return g

  return '-'
}

export function buildTelaahanStafDocument(props: TelaahanStafPdfProps): React.ReactElement<DocumentProps> {
  const {
    spj,
    telaahan,
    roster,
    signer,
    instansiLine1 = 'PEMERINTAH KABUPATEN KUTAI BARAT',
    instansiLine2 = 'SEKRETARIAT DAERAH',
    alamatLine = 'Jalan Kompleks Perkantoran Pemerintah Kabupaten Kutai Barat, Telepon (0542) 594754\nKode Pos 75776 Fax (0542) 404384 Website: setda.kutaibaratkab.go.id'
  } = props

  const kepadaYth = telaahan.kepada ?? 'Sekretaris Daerah Kabupaten Kutai Barat'
  const dari = signer?.jabatan ?? 'Kepala Bagian Organisasi'
  const tanggal = fmtDateId(telaahan.tglTelaahan as Date)
  const nomor = spj.noTelaahan ?? ''
  const lampiran = telaahan.lampiran ?? '-'
  const perihal = telaahan.perihal ?? '-'

  const dasarParas = splitParagraphs(telaahan.dasar ?? '')
  const analisisParas = splitParagraphs(telaahan.analisis ?? '')
  const kesimpulanParas = splitParagraphs(telaahan.kesimpulan ?? '')
  const saranParas = splitParagraphs(telaahan.saran ?? '')

  const signerNama = signer?.nama ?? 'AGUNG SUGARA, SE., M.Si'
  const signerNip = signer?.nip ?? '19790906 200801 1027'
  const signerPangkat = fmtPangkatGolongan(signer?.pangkat ?? 'Pembina', signer?.golongan ?? 'IV/a')

  return (
    <Document>
      <Page size="A4" style={styles.page}>
        <KopSurat
          title="TELAAHAN STAF"
          instansiLine1={instansiLine1}
          instansiLine2={instansiLine2}
          alamatLine={alamatLine}
        />

        <View>
          {/* ===== META ===== */}
          <View style={styles.metaBlock}>
            <View style={styles.metaRow}>
              <Text style={styles.metaLabel}>Kepada Yth</Text>
              <Text style={styles.metaColon}>:</Text>
              <Text style={styles.metaValue}>{kepadaYth}</Text>
            </View>

            <View style={styles.metaRow}>
              <Text style={styles.metaLabel}>Dari</Text>
              <Text style={styles.metaColon}>:</Text>
              <Text style={styles.metaValue}>{dari}</Text>
            </View>

            <View style={styles.metaRow}>
              <Text style={styles.metaLabel}>Tanggal</Text>
              <Text style={styles.metaColon}>:</Text>
              <Text style={styles.metaValue}>{tanggal}</Text>
            </View>

            <View style={styles.metaRow}>
              <Text style={styles.metaLabel}>Nomor</Text>
              <Text style={styles.metaColon}>:</Text>
              <Text style={styles.metaValue}>{nomor}</Text>
            </View>

            <View style={styles.metaRow}>
              <Text style={styles.metaLabel}>Lampiran</Text>
              <Text style={styles.metaColon}>:</Text>
              <Text style={styles.metaValue}>{lampiran}</Text>
            </View>

            <View style={styles.metaRow}>
              <Text style={styles.metaLabel}>Perihal</Text>
              <Text style={styles.metaColon}>:</Text>
              <Text style={styles.metaValue}>{perihal}</Text>
            </View>
          </View>

          {/* ===== A. Dasar ===== */}
          {dasarParas.length === 0 ? (
            <View wrap={false}>
              <Text style={styles.sectionTitle}>A. Dasar</Text>
              <Text style={styles.paragraph}>-</Text>
            </View>
          ) : (
            <>
              <View wrap={false}>
                <Text style={styles.sectionTitle}>A. Dasar</Text>
                <Text style={styles.paragraph}>{dasarParas[0]}</Text>
              </View>
              {dasarParas.slice(1).map((p, i) => (
                <Text key={`dasar-${i}`} style={styles.paragraph}>
                  {p}
                </Text>
              ))}
            </>
          )}

          {/* ===== A. Pra Anggapan ===== */}
          {telaahan.praAnggapan?.length ? (
            <>
              <View wrap={false}>
                <Text style={styles.sectionTitle}>A. Pra Anggapan</Text>
                <View style={styles.listItem}>
                  <Text style={styles.listNo}>1.</Text>
                  <Text style={styles.listText}>{telaahan.praAnggapan[0]}</Text>
                </View>
              </View>
              {telaahan.praAnggapan.slice(1).map((v, i) => (
                <View key={`pra-${i}`} style={styles.listItem}>
                  <Text style={styles.listNo}>{`${i + 2}.`}</Text>
                  <Text style={styles.listText}>{v}</Text>
                </View>
              ))}
            </>
          ) : (
            <View wrap={false}>
              <Text style={styles.sectionTitle}>A. Pra Anggapan</Text>
              <Text style={styles.paragraph}>-</Text>
            </View>
          )}

          {/* ===== B. Fakta-fakta yang Memengaruhi ===== */}
          {telaahan.fakta?.length ? (
            <>
              <View wrap={false}>
                <Text style={styles.sectionTitle}>B. Fakta - Fakta yang Memengaruhi</Text>
                <View style={styles.listItem}>
                  <Text style={styles.listNo}>1.</Text>
                  <Text style={styles.listText}>{telaahan.fakta[0]}</Text>
                </View>
              </View>
              {telaahan.fakta.slice(1).map((v, i) => (
                <View key={`fakta-${i}`} style={styles.listItem}>
                  <Text style={styles.listNo}>{`${i + 2}.`}</Text>
                  <Text style={styles.listText}>{v}</Text>
                </View>
              ))}
            </>
          ) : (
            <View wrap={false}>
              <Text style={styles.sectionTitle}>B. Fakta – Fakta yang Mempengaruhi</Text>
              <Text style={styles.paragraph}>-</Text>
            </View>
          )}

          {/* ===== D. Analisis ===== */}
          {analisisParas.length > 0 ? (
            <>
              <View wrap={false}>
                <Text style={styles.sectionTitle}>D. Analisis</Text>
                <Text style={styles.paragraph}>{analisisParas[0]}</Text>
              </View>
              {analisisParas.slice(1).map((p, i) => (
                <Text key={`analisis-extra-${i}`} style={styles.paragraph}>
                  {p}
                </Text>
              ))}
            </>
          ) : null}

          {/* ===== C. Kesimpulan ===== */}
          {kesimpulanParas.length === 0 ? (
            <View wrap={false}>
              <Text style={styles.sectionTitle}>C. Kesimpulan</Text>
              <Text style={styles.paragraphNoIndent}>-</Text>
            </View>
          ) : (
            <>
              <View wrap={false}>
                <Text style={styles.sectionTitle}>C. Kesimpulan</Text>
                <Text style={styles.paragraph}>{kesimpulanParas[0]}</Text>
              </View>
              {kesimpulanParas.slice(1).map((p, i) => (
                <Text key={`kesimpulan-extra-${i}`} style={styles.paragraph}>
                  {p}
                </Text>
              ))}
            </>
          )}

          {/* ===== E. Saran/Tindakan ===== */}
          {saranParas.length > 0 ? (
            <>
              <View wrap={false}>
                <Text style={styles.sectionTitle}>E. Saran/Tindakan</Text>
                <Text style={styles.paragraph}>{saranParas[0]}</Text>
              </View>
              {saranParas.slice(1).map((p, i) => (
                <Text key={`saran-extra-${i}`} style={styles.paragraph}>
                  {p}
                </Text>
              ))}
            </>
          ) : (
            <View wrap={false}>
              <Text style={styles.sectionTitle}>E. Saran/Tindakan</Text>
              <Text style={[styles.rosterIntro, styles.paragraph]}>
                Sehubungan dengan kegiatan di maksud maka kami mengusulkan pegawai yang akan mengikuti kegiatan tersebut
                adalah:
              </Text>
            </View>
          )}

          {/* Roster block (sudah ada wrap={false} di personBlock asli) */}
          {roster.length ? (
            roster.map((r, idx) => (
              <View key={`person-${r.order}-${r.nama}`} style={styles.personBlock} wrap={false}>
                <View style={styles.personRow}>
                  <Text style={styles.personNo}>{`${idx + 1}`}</Text>
                  <View style={styles.personContent}>
                    <View style={styles.personLine}>
                      <Text style={styles.personLabel}>Nama</Text>
                      <Text style={styles.personColon}>:</Text>
                      <Text style={styles.personValue}>{r.nama}</Text>
                    </View>

                    <View style={styles.personLine}>
                      <Text style={styles.personLabel}>NIP</Text>
                      <Text style={styles.personColon}>:</Text>
                      <Text style={styles.personValue}>{r.nip ?? '-'}</Text>
                    </View>

                    <View style={styles.personLine}>
                      <Text style={styles.personLabel}>Pangkat / Golongan</Text>
                      <Text style={styles.personColon}>:</Text>
                      <Text style={styles.personValue}>{fmtPangkatGolongan(r.pangkat, r.golongan)}</Text>
                    </View>

                    <View style={styles.personLine}>
                      <Text style={styles.personLabel}>Jabatan</Text>
                      <Text style={styles.personColon}>:</Text>
                      <Text style={styles.personValue}>{r.jabatan}</Text>
                    </View>
                  </View>
                </View>
              </View>
            ))
          ) : (
            <Text style={styles.rosterIntro}>-</Text>
          )}

          <View wrap={false}>
            <Text style={styles.closing}>
              Demikian telaahan staf ini disampaikan, atas perkenan Bapak diucapkan terima kasih.
            </Text>

            {/* ===== SIGNATURE ===== */}
            <View style={styles.signerWrap}>
              <View style={styles.signerBox}>
                <Text style={styles.signerJabatan}>{dari},</Text>
                <View style={styles.signerSpace} />
                <Text style={styles.signerName}>{signerNama}</Text>
                <Text style={styles.signerPangkat}>{signerPangkat}</Text>
                <Text style={styles.signerNip}>NIP. {signerNip}</Text>
              </View>
            </View>
          </View>
        </View>
      </Page>
    </Document>
  )
}

export default function TelaahanStafPdf(props: TelaahanStafPdfProps) {
  return buildTelaahanStafDocument(props)
}

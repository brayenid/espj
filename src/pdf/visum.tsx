// src/pdf/visum.tsx
import React from 'react'
import { Document, Page, StyleSheet, Text, View, type DocumentProps } from '@react-pdf/renderer'

type Signer = {
  nama: string
  nip: string | null
  // ✅ supaya label jabatan tidak hardcoded
  jabatan?: string | null
  jabatanTampil?: string | null
}

type VisumSpj = {
  tempatBerangkat: string
  tempatTujuan: string
}

export type VisumPdfProps = {
  spj: VisumSpj
  stageCount: number
  signer: Signer | null
}

// ===== helpers
function roman(n: number) {
  const map: Record<number, string> = {
    1: 'I',
    2: 'II',
    3: 'III',
    4: 'IV',
    5: 'V',
    6: 'VI',
    7: 'VII',
    8: 'VIII'
  }
  return map[n] ?? String(n)
}

function dots(len = 42) {
  return '.'.repeat(len)
}

function safeStageCount(n: number) {
  const x = Number.isFinite(n) ? Math.floor(n) : 4
  return Math.min(6, Math.max(1, x))
}

// ===== components
function Line() {
  return <View style={styles.hr} />
}

function RowField({ label, value }: { label: string; value?: string; strongValue?: boolean }) {
  return (
    <View style={styles.fieldRow}>
      <Text style={styles.fieldLabel}>{label}</Text>
      <Text style={styles.fieldColon}>:</Text>
      <Text style={[styles.fieldValue]}>{value ?? dots()}</Text>
    </View>
  )
}

function StageBlock({ no, leftTitle, rightTitle }: { no: number; leftTitle: string; rightTitle: string }) {
  return (
    <View style={styles.stageWrap}>
      <View style={styles.stageLeft}>
        <Text style={styles.stageNo}>{roman(no)}.</Text>
        <View style={styles.stageContent}>
          <RowField label={leftTitle} />
          <RowField label="Pada Tanggal" />
          <RowField label="Kepala" />
          <View style={styles.signSpaceMini} />
          <Text style={styles.nipLabel}>NIP.</Text>
        </View>
      </View>

      <View style={styles.vline} />

      <View style={styles.stageRight}>
        <View style={styles.stageContent}>
          <RowField label={rightTitle} />
          <RowField label="Ke" />
          <RowField label="Pada Tanggal" />
          <RowField label="Kepala" />
          <View style={styles.signSpaceMini} />
          <Text style={styles.nipLabel}>NIP.</Text>
        </View>
      </View>
    </View>
  )
}

export function buildVisumDocument(props: VisumPdfProps): React.ReactElement<DocumentProps> {
  const stageCount = safeStageCount(props.stageCount)

  const signerName = props.signer?.nama ?? ''
  const signerNip = props.signer?.nip ?? ''

  // ✅ jabatan penandatangan ikut signer
  const signerJabatanRaw = (props.signer?.jabatanTampil ?? props.signer?.jabatan ?? '').trim()
  const signerJabatanLabel = signerJabatanRaw ? `${signerJabatanRaw},` : ''

  const repeatedStages = Array.from({ length: stageCount }).map((_, i) => 2 + i)

  return (
    <Document>
      <Page size="A4" style={styles.page}>
        <View style={styles.outerBox}>
          <Line />

          {/* ===== I (khusus: hanya kanan berisi "Berangkat Dari...") */}
          {/* ✅ pakai stageWrapI supaya tinggi cukup dan tidak overlap */}
          <View style={styles.stageWrapI}>
            <View style={styles.stageLeft}>
              <Text style={styles.stageNo}>{/* kosong */}</Text>
              <View style={styles.stageContent} />
            </View>

            <View style={styles.vline} />

            <View style={styles.stageRight}>
              <View style={styles.stageContent}>
                <View style={styles.iHeaderRow}>
                  <Text style={styles.stageNoInline}>{roman(1)}.</Text>
                  <Text style={styles.iHeaderText}>
                    Berangkat Dari : <Text style={styles.bold}>{props.spj.tempatBerangkat}</Text>
                    {'\n'}
                    (Tempat Kedudukan)
                  </Text>
                </View>

                <RowField label="Ke" value={props.spj.tempatTujuan || dots()} />
                <RowField label="Pada Tanggal" />

                {/* ✅ jabatan ikut signer (tidak hardcoded) */}
                <Text style={styles.iSignerLabel}>{signerJabatanLabel || dots()}</Text>

                {/* ✅ ruang tanda tangan dibesarkan + aman karena stageWrapI lebih tinggi */}
                <View style={styles.signSpaceI} />

                <Text style={styles.signerName}>{signerName}</Text>
                <Text style={styles.signerNip}>NIP. {signerNip}</Text>
              </View>
            </View>
          </View>

          <Line />

          {/* ===== II..(V) sesuai stageCount */}
          {repeatedStages.map((n) => (
            <React.Fragment key={n}>
              <StageBlock no={n} leftTitle="Tiba di" rightTitle="Berangkat Dari" />
              <Line />
            </React.Fragment>
          ))}

          {/* ===== VI (kiri: tiba di tempat berangkat, kanan: paragraf pernyataan) */}
          <View style={styles.stageWrap}>
            <View style={styles.stageLeft}>
              <Text style={styles.stageNo}>{roman(6)}.</Text>
              <View style={styles.stageContent}>
                <RowField label="Tiba di" value={props.spj.tempatBerangkat} strongValue />
                <RowField label="Pada Tanggal" />

                {/* ✅ tidak hardcoded */}
                <RowField label="Pejabat yang memberi perintah" value={signerJabatanLabel || dots()} />

                <View style={styles.signSpaceVI} />
                <View style={styles.signSpaceVI} />

                <Text style={styles.signerName}>{signerName}</Text>
                <Text style={styles.signerNip}>NIP. {signerNip}</Text>
              </View>
            </View>

            <View style={styles.vline} />

            <View style={styles.stageRight}>
              <View style={styles.stageContent}>
                <Text style={styles.paragraph}>
                  Telah diperiksa, dengan keterangan bahwa perjalanan tersebut diatas benar dilakukan atas perintahnya
                  dan semata-mata untuk kepentingan jabatan dalam waktu yang sesingkat-singkatnya.
                </Text>
              </View>
            </View>
          </View>

          <Line />

          {/* ===== VII & VIII */}
          <View style={styles.footerBlock}>
            <View style={styles.footerRow}>
              <Text style={styles.footerNo}>{roman(7)}.</Text>
              <Text style={styles.footerLabel}>Catatan Lain-lain</Text>
              <Text style={styles.footerColon}>:</Text>
              <Text style={styles.footerValue}>{dots(70)}</Text>
            </View>

            <View style={[styles.footerRow, { marginTop: 6 }]}>
              <Text style={styles.footerNo}>{roman(8)}.</Text>
              <Text style={styles.footerLabel}>PERHATIAN</Text>
              <Text style={styles.footerColon}>:</Text>
              <View style={styles.perhatianBox}>
                <Text style={styles.perhatianText}>
                  PPK yang menerbitkan SPD, pegawai yang melakukan perjalanan dinas, para pejabat yang mengesahkan
                  tanggal berangkat/tiba, serta bendahara pengeluaran bertanggung jawab berdasarkan peraturan-peraturan
                  Keuangan Negara apabila negara menderita rugi akibat kesalahan, kelalaian, dan kealpaannya.
                </Text>
              </View>
            </View>
          </View>
        </View>
      </Page>
    </Document>
  )
}

export default function VisumPdf(props: VisumPdfProps) {
  return buildVisumDocument(props)
}

// ===== styles
const styles = StyleSheet.create({
  page: {
    paddingTop: 24,
    paddingBottom: 24,
    paddingHorizontal: 28,
    fontSize: 9.5,
    lineHeight: 1.25,
    fontFamily: 'Helvetica'
  },

  outerBox: {
    borderWidth: 1,
    borderColor: '#000'
  },

  hr: {
    height: 1,
    backgroundColor: '#000'
  },

  // default stage
  stageWrap: {
    flexDirection: 'row',
    minHeight: 110
  },

  // ✅ khusus blok I biar ruang ttd cukup & tidak overlap garis bawah
  stageWrapI: {
    flexDirection: 'row',
    minHeight: 150
  },

  stageLeft: {
    width: '50%',
    flexDirection: 'row',
    paddingTop: 8,
    paddingBottom: 8,
    paddingLeft: 10,
    paddingRight: 10
  },

  stageRight: {
    width: '50%',
    paddingTop: 8,
    paddingBottom: 8,
    paddingLeft: 10,
    paddingRight: 10
  },

  vline: {
    width: 1,
    backgroundColor: '#000'
  },

  stageNo: {
    width: 18,
    fontSize: 9.5
  },

  stageNoInline: {
    width: 18,
    fontSize: 9.5
  },

  stageContent: {
    flex: 1
  },

  fieldRow: {
    flexDirection: 'row',
    marginBottom: 2
  },
  fieldLabel: {
    width: 78
  },
  fieldColon: {
    width: 10,
    textAlign: 'center'
  },
  fieldValue: {
    flex: 1
  },

  nipLabel: {
    marginTop: 10
  },

  bold: { fontWeight: 700 },

  // I block
  iHeaderRow: {
    flexDirection: 'row',
    marginBottom: 2
  },
  iHeaderText: {
    flex: 1
  },
  iSignerLabel: {
    marginTop: 2
  },

  // ✅ dibesarkan (aman karena stageWrapI lebih tinggi)
  signSpaceI: {
    height: 40
  },

  signerName: {
    fontWeight: 700
  },
  signerNip: {
    marginTop: 2
  },

  signSpaceMini: {
    height: 18
  },

  // VI: space ttd tidak perlu sebesar I
  signSpaceVI: {
    height: 24
  },

  paragraph: {
    fontSize: 9,
    textAlign: 'justify'
  },

  footerBlock: {
    paddingTop: 8,
    paddingBottom: 10,
    paddingLeft: 10,
    paddingRight: 10
  },

  footerRow: {
    flexDirection: 'row',
    alignItems: 'flex-start'
  },
  footerNo: { width: 18 },
  footerLabel: { width: 100 },
  footerColon: { width: 10, textAlign: 'center' },
  footerValue: { flex: 1 },

  perhatianBox: {
    flex: 1
  },
  perhatianText: {
    fontSize: 9,
    textAlign: 'justify'
  }
})

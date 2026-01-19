import { Image, StyleSheet, Text, View } from '@react-pdf/renderer'

export type KopSuratProps = {
  title?: string

  instansiLine1?: string
  instansiLine2?: string
  alamatLine?: string
}

const styles = StyleSheet.create({
  header: { position: 'relative', marginBottom: 10, paddingBottom: 8 },
  headerRow: { flexDirection: 'row', alignItems: 'center' },

  logoWrap: {
    width: 62,
    height: 62,
    marginRight: 10,
    justifyContent: 'center',
    alignItems: 'center'
  },
  logo: { width: 59, height: 59, objectFit: 'contain' },

  headerText: { flex: 1, alignItems: 'center', justifyContent: 'center' },

  instansi1: { fontSize: 14, fontWeight: 700, textTransform: 'uppercase' },
  instansi2: { fontSize: 18, fontWeight: 700, textTransform: 'uppercase', marginTop: 2 },

  alamat: { fontSize: 8.5, marginTop: 8, textAlign: 'center', whiteSpace: 'pre-line' },

  line: { marginTop: 8, borderBottomWidth: 1.2, borderBottomColor: '#000' },

  title: {
    marginTop: 6,
    textAlign: 'center',
    fontSize: 11.5,
    fontWeight: 700,
    textTransform: 'uppercase',
    textDecoration: 'underline',
    letterSpacing: 0.3
  }
})

export default function KopSurat({
  title,
  instansiLine1 = 'PEMERINTAH KABUPATEN KUTAI BARAT',
  instansiLine2 = 'SEKRETARIAT DAERAH',
  alamatLine = 'Jalan Kompleks Perkantoran Pemerintah Kabupaten Kutai Barat, Telepon (0542) 594754\nKode Pos 75776 Fax (0542) 404384 Website: setda.kutaibaratkab.go.id'
}: KopSuratProps) {
  const logoUrl = `${process.env.BASE_URL}/kubar.png`

  return (
    <View style={styles.header}>
      <View style={styles.headerRow}>
        <View style={styles.logoWrap}>
          <Image style={styles.logo} src={logoUrl} />
        </View>

        <View style={styles.headerText}>
          <Text style={styles.instansi1}>{instansiLine1}</Text>
          <Text style={styles.instansi2}>{instansiLine2}</Text>
          <Text style={styles.alamat}>{alamatLine}</Text>
        </View>

        {/* spacer kanan supaya center */}
        <View style={{ width: 62, height: 62, marginLeft: 10 }} />
      </View>

      <View style={styles.line} />
      {title ? <Text style={styles.title}>{title}</Text> : null}
    </View>
  )
}

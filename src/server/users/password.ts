export async function hashPassword(password: string) {
  const pw = password.trim()
  if (pw.length < 6) throw new Error('Password minimal 6 karakter.')

  // Prefer bcryptjs (lebih sering dipakai di Next.js)
  try {
    const bcryptjs = await import('bcryptjs')
    return await bcryptjs.hash(pw, 10)
  } catch {
    // fallback bcrypt (native)
    try {
      const bcrypt = await import('bcrypt')
      return await bcrypt.hash(pw, 10)
    } catch {
      throw new Error('Dependency bcryptjs/bcrypt belum terpasang. Install salah satu: `npm i bcryptjs`.')
    }
  }
}

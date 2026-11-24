import { createClient } from '@supabase/supabase-js';
import crypto from 'crypto';

const defaultUrl = 'https://nlvzvpajpngxhlllbtsq.supabase.co';
const defaultKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.e30.placeholder';

const supabaseUrl = process.env.PUBLIC_SUPABASE_URL || import.meta.env.PUBLIC_SUPABASE_URL || defaultUrl;
const supabaseAnonKey = process.env.PUBLIC_SUPABASE_ANON_KEY || import.meta.env.PUBLIC_SUPABASE_ANON_KEY || defaultKey;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || import.meta.env.SUPABASE_SERVICE_ROLE_KEY || '';

// Public client with safe fallback
export const supabase = createClient(supabaseUrl || defaultUrl, supabaseAnonKey || defaultKey);

// Admin / Service Role client (only used server-side in API routes)
export const supabaseAdmin = supabaseServiceKey
  ? createClient(supabaseUrl || defaultUrl, supabaseServiceKey, {
      auth: { autoRefreshToken: false, persistSession: false }
    })
  : supabase;

const SESSION_HMAC_SECRET = supabaseServiceKey || 'iela-unirow-hmac-secret-2026';

export interface IelaSessionUser {
  userId?: string;
  username: string;
  nama: string;
  role: string;
  iat?: number;
}

export function createIelaSessionToken(user: IelaSessionUser): string {
  const payload = Buffer.from(JSON.stringify({
    userId: user.userId || '',
    username: user.username,
    nama: user.nama,
    role: user.role,
    iat: Date.now()
  }), 'utf-8').toString('base64url');
  const sig = crypto.createHmac('sha256', SESSION_HMAC_SECRET).update(payload).digest('base64url');
  return `${payload}.${sig}`;
}

export function verifyIelaSessionToken(token?: string | null): IelaSessionUser | null {
  if (!token || typeof token !== 'string' || !token.includes('.')) return null;
  const [payload, sig] = token.split('.');
  if (!payload || !sig) return null;
  const expected = crypto.createHmac('sha256', SESSION_HMAC_SECRET).update(payload).digest('base64url');
  if (sig.length !== expected.length) return null;
  if (!crypto.timingSafeEqual(Buffer.from(sig), Buffer.from(expected))) return null;
  try {
    return JSON.parse(Buffer.from(payload, 'base64url').toString('utf-8')) as IelaSessionUser;
  } catch {
    return null;
  }
}

export function getAuthenticatedIelaUser(request: Request, cookies?: any): IelaSessionUser | null {
  const headerToken = request.headers.get('x-iela-token');
  const fromHeader = verifyIelaSessionToken(headerToken);
  if (fromHeader) return fromHeader;

  const cookieVal = cookies?.get?.('iela_session')?.value;
  const fromCookie = verifyIelaSessionToken(cookieVal);
  if (fromCookie) return fromCookie;

  return null;
}

export interface Pendaftar {
  pendaftar_id: string;
  user_id?: string;
  nim: string;
  nama: string;
  nama_panggilan?: string;
  jenis_kelamin?: string;
  ttl?: string;
  alamat_asal?: string;
  alamat_sekarang?: string;
  no_hp?: string;
  hobby?: string;
  cita_cita?: string;
  motto_hidup?: string;
  semester?: string;
  prodi?: string;
  ipk?: number;
  bidang_pilihan_1?: string;
  bidang_pilihan_2?: string;
  keterampilan?: string;
  motivasi?: string;
  target_iela?: string;
  riwayat_organisasi?: string;
  pelatihan_diikuti?: string;
  buku_diresume?: string;
  url_foto?: string;
  url_khs?: string;
  url_cv?: string;
  url_sertifikat?: string;
  url_resume?: string;
  url_jurnal_referensi?: string;
  url_follow_ig?: string;
  url_follow_tiktok?: string;
  status_pendaftaran?: string;
  qr_code_id?: string;
  created_at?: string;
  updated_at?: string;
}

export interface PenilaianRekap {
  penilaian_id: string;
  pendaftar_id: string;
  user_id_penilai: string;
  skor_pengetahuan: number;
  skor_keterampilan: number;
  skor_kedisiplinan: number;
  skor_attitude: number;
  nilai_bobot_total: number;
  catatan_evaluasi?: string;
  tanggal_penilaian?: string;
  nama_pendaftar?: string;
  nama_penilai?: string;
  created_at?: string;
}

export interface UserProfile {
  user_id: string;
  username_nim: string;
  password_hash?: string;
  nama_lengkap: string;
  email?: string;
  role: 'Admin' | 'Penguji' | 'Pendaftar';
  status_aktif: boolean;
  bidang_divisi?: string;
  jabatan_divisi?: string;
  jabatan_bidang?: string;
}

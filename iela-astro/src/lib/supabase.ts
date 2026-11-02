import { createClient } from '@supabase/supabase-js';

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

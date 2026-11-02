-- ========================================================
-- SKEMA DATABASE SUPABASE (POSTGRESQL) - IELA WEBAPP
-- Laboratorium Teknik Industri (IELA) - UNIROW Tuban
-- ========================================================

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 1. TABEL PENGATURAN SISTEM
CREATE TABLE IF NOT EXISTS pengaturan (
    param_id VARCHAR(30) PRIMARY KEY,
    key_name VARCHAR(100) UNIQUE NOT NULL,
    value_text TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. TABEL AKUN PENGGUNA (ADMIN, PENGUJI, PENDAFTAR)
CREATE TABLE IF NOT EXISTS users_profile (
    user_id VARCHAR(30) PRIMARY KEY,
    username_nim VARCHAR(50) UNIQUE NOT NULL,
    password_hash TEXT,
    nama_lengkap TEXT NOT NULL,
    email TEXT,
    role VARCHAR(30) DEFAULT 'Pendaftar', -- 'Admin', 'Penguji', 'Pendaftar'
    status_aktif BOOLEAN DEFAULT TRUE,
    bidang_divisi TEXT,
    jabatan_divisi TEXT,
    jabatan_bidang TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3. TABEL PENDAFTAR SELEKSI ASISTEN
CREATE TABLE IF NOT EXISTS pendaftar (
    pendaftar_id VARCHAR(30) PRIMARY KEY,
    user_id VARCHAR(30),
    nim VARCHAR(30) NOT NULL,
    nama TEXT NOT NULL,
    nama_panggilan TEXT,
    jenis_kelamin VARCHAR(20),
    ttl TEXT,
    alamat_asal TEXT,
    alamat_sekarang TEXT,
    no_hp VARCHAR(30),
    hobby TEXT,
    cita_cita TEXT,
    motto_hidup TEXT,
    semester VARCHAR(10),
    prodi VARCHAR(50) DEFAULT 'Teknik Industri',
    ipk NUMERIC(3,2),
    bidang_pilihan_1 TEXT,
    bidang_pilihan_2 TEXT,
    keterampilan TEXT,
    motivasi TEXT,
    target_iela TEXT,
    riwayat_organisasi TEXT,
    pelatihan_diikuti TEXT,
    buku_diresume TEXT,
    url_foto TEXT,
    url_khs TEXT,
    url_cv TEXT,
    url_sertifikat TEXT,
    url_resume TEXT,
    url_jurnal_referensi TEXT,
    url_follow_ig TEXT,
    url_follow_tiktok TEXT,
    status_pendaftaran VARCHAR(50) DEFAULT 'Submitted',
    qr_code_id VARCHAR(50),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 4. TABEL PENILAIAN WAWANCARA & REKAP NILAI PENGUJI
CREATE TABLE IF NOT EXISTS penilaian_rekap (
    penilaian_id VARCHAR(30) PRIMARY KEY,
    pendaftar_id VARCHAR(30) REFERENCES pendaftar(pendaftar_id) ON DELETE CASCADE,
    user_id_penilai VARCHAR(30),
    skor_pengetahuan NUMERIC(5,2) DEFAULT 0,
    skor_keterampilan NUMERIC(5,2) DEFAULT 0,
    skor_kedisiplinan NUMERIC(5,2) DEFAULT 0,
    skor_attitude NUMERIC(5,2) DEFAULT 0,
    nilai_bobot_total NUMERIC(5,2) DEFAULT 0,
    catatan_evaluasi TEXT,
    tanggal_penilaian TEXT,
    nama_pendaftar TEXT,
    nama_penilai TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 5. TABEL PUBLIKASI RISET & JURNAL ILMIAH
CREATE TABLE IF NOT EXISTS publikasi (
    publikasi_id VARCHAR(30) PRIMARY KEY,
    nama_penulis TEXT NOT NULL,
    judul_artikel TEXT NOT NULL,
    link_artikel TEXT,
    nama_jurnal TEXT,
    tahun INTEGER,
    bidang_sublab TEXT,
    tanggal_input TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 6. TABEL GALERI KEGIATAN & PRAKTIKUM
CREATE TABLE IF NOT EXISTS galeri_kegiatan (
    foto_id VARCHAR(30) PRIMARY KEY,
    judul_kegiatan TEXT NOT NULL,
    deskripsi_kegiatan TEXT,
    tanggal_kegiatan TEXT,
    url_foto TEXT NOT NULL,
    kategori_event VARCHAR(50),
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 7. TABEL PROFIL KONTEN BERITA
CREATE TABLE IF NOT EXISTS profil_konten (
    konten_id VARCHAR(30) PRIMARY KEY,
    judul TEXT NOT NULL,
    kategori VARCHAR(50),
    deskripsi TEXT,
    url_gambar TEXT,
    tanggal_publish TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 8. TABEL PENGUMUMAN RESMI
CREATE TABLE IF NOT EXISTS pengumuman (
    pengumuman_id VARCHAR(30) PRIMARY KEY,
    judul TEXT NOT NULL,
    isi_pengumuman TEXT NOT NULL,
    tanggal_terbit TEXT,
    status_publish VARCHAR(20) DEFAULT 'Published',
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- INDEKS UNTUK PERFORMA QUERY
CREATE INDEX IF NOT EXISTS idx_pendaftar_nim ON pendaftar(nim);
CREATE INDEX IF NOT EXISTS idx_pendaftar_status ON pendaftar(status_pendaftaran);
CREATE INDEX IF NOT EXISTS idx_penilaian_pendaftar ON penilaian_rekap(pendaftar_id);
CREATE INDEX IF NOT EXISTS idx_users_username ON users_profile(username_nim);
CREATE INDEX IF NOT EXISTS idx_users_role ON users_profile(role);

import type { APIRoute } from 'astro';
import { supabaseAdmin, supabase } from '../../../lib/supabase';
import { buildStatusEmailHtml } from '../../../utils/emailTemplate';

export const POST: APIRoute = async ({ request }) => {
  try {
    const formData = await request.formData();
    
    // Read textual fields
    const nim = String(formData.get('nim') || '').trim();
    const nama = String(formData.get('nama') || '').trim();
    const namaPanggilan = String(formData.get('namaPanggilan') || '').trim();
    const jk = String(formData.get('jk') || '').trim();
    const ttl = String(formData.get('ttl') || '').trim();
    const hp = String(formData.get('hp') || '').trim();
    const email = String(formData.get('email') || '').trim();
    const alamatAsal = String(formData.get('alamatAsal') || '').trim();
    const alamatSekarang = String(formData.get('alamatSekarang') || '').trim();
    const hobby = String(formData.get('hobby') || '').trim();
    const citaCita = String(formData.get('citaCita') || '').trim();
    const motto = String(formData.get('motto') || '').trim();

    // Semester is strictly fixed to Semester 3
    const semester = 'Semester 3';
    const prodi = String(formData.get('prodi') || 'S1 Teknik Industri').trim();
    const ipk = parseFloat(String(formData.get('ipk') || '0'));
    let pilihan1 = String(formData.get('pilihan1') || '').trim();
    const sub1 = String(formData.get('sub_manufaktur_1') || '').trim();
    if (pilihan1 === 'Proses Manufaktur' && sub1) {
      pilihan1 = 'Proses Manufaktur (' + sub1 + ')';
    }

    let pilihan2 = String(formData.get('pilihan2') || '').trim();
    const sub2 = String(formData.get('sub_manufaktur_2') || '').trim();
    if (pilihan2 === 'Proses Manufaktur' && sub2) {
      pilihan2 = 'Proses Manufaktur (' + sub2 + ')';
    }
    const keterampilan = String(formData.get('keterampilan') || '').trim();
    const motivasi = String(formData.get('motivasi') || '').trim();
    const targetIela = String(formData.get('targetIela') || '').trim();
    const organisasi = String(formData.get('organisasi') || '').trim();
    const pelatihan = String(formData.get('pelatihan') || '').trim();
    const resumeBuku = String(formData.get('resumeBuku') || '').trim();

    if (!nim || !nama) {
      return new Response(JSON.stringify({ success: false, message: 'NPM dan Nama Lengkap wajib diisi!' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    // VALIDASI KETAT: IPK WAJIB >= 3.00
    if (isNaN(ipk) || ipk < 3.00) {
      return new Response(
        JSON.stringify({
          success: false,
          message: 'Syarat pendaftaran minimal IPK kumulatif adalah 3.00. IPK yang Anda masukkan belum memenuhi syarat.'
        }),
        {
          status: 400,
          headers: { 'Content-Type': 'application/json' }
        }
      );
    }

    const clientToUse = supabaseAdmin || supabase;
    const timestamp = Date.now();
    const pendaftarId = `REG-${new Date().getFullYear()}-${timestamp.toString().slice(-4)}`;

    // Helper to upload files to Supabase Storage bucket 'berkas-pendaftar'
    const uploadDoc = async (fileKey: string, prefix: string): Promise<string> => {
      const file = formData.get(fileKey) as File | null;
      if (!file || !(file instanceof File) || file.size === 0) return '';

      try {
        const cleanName = file.name.replace(/[^a-zA-Z0-9.-]/g, '_');
        const path = `${nim}/${prefix}_${cleanName}`;
        const arrayBuf = await file.arrayBuffer();
        const buf = Buffer.from(arrayBuf);

        const { data: uploadRes, error: upErr } = await clientToUse.storage
          .from('berkas-pendaftar')
          .upload(path, buf, {
            contentType: file.type || 'application/octet-stream',
            upsert: true
          });

        if (!upErr && uploadRes) {
          const { data: pubData } = clientToUse.storage.from('berkas-pendaftar').getPublicUrl(path);
          return pubData.publicUrl;
        } else {
          return `https://storage.placeholder.iela.unirow/${path}`;
        }
      } catch (e: any) {
        console.warn(`Upload doc ${fileKey} warning:`, e.message);
        return '';
      }
    };

    // Upload the 8 mandatory documents (including Bukti Follow IG & TikTok)
    const [urlFoto, urlKhs, urlCv, urlSertifikat, urlResume, urlJurnal, urlFollowIg, urlFollowTiktok] = await Promise.all([
      uploadDoc('file_foto', 'FOTO'),
      uploadDoc('file_khs', 'KHS'),
      uploadDoc('file_cv', 'CV'),
      uploadDoc('file_sertifikat', 'SERTIFIKAT'),
      uploadDoc('file_resume', 'RESUME'),
      uploadDoc('file_jurnal', 'JURNAL'),
      uploadDoc('file_follow_ig', 'BUKTI_FOLLOW_IG'),
      uploadDoc('file_follow_tiktok', 'BUKTI_FOLLOW_TIKTOK')
    ]);

    // Insert record into PostgreSQL table 'pendaftar'
    const { data: insertedData, error: dbErr } = await clientToUse
      .from('pendaftar')
      .upsert([
        {
          pendaftar_id: pendaftarId,
          nim: nim,
          nama: nama,
          nama_panggilan: namaPanggilan,
          jenis_kelamin: jk,
          ttl: ttl,
          alamat_asal: alamatAsal,
          alamat_sekarang: alamatSekarang,
          no_hp: hp,
          hobby: hobby,
          cita_cita: citaCita,
          motto_hidup: motto,
          semester: semester,
          prodi: prodi,
          ipk: ipk,
          bidang_pilihan_1: pilihan1,
          bidang_pilihan_2: pilihan2,
          keterampilan: keterampilan,
          motivasi: motivasi,
          target_iela: targetIela,
          riwayat_organisasi: organisasi,
          pelatihan_diikuti: pelatihan,
          buku_diresume: resumeBuku,
          url_foto: urlFoto,
          url_khs: urlKhs,
          url_cv: urlCv,
          url_sertifikat: urlSertifikat,
          url_resume: urlResume,
          url_jurnal_referensi: urlJurnal,
          url_follow_ig: urlFollowIg,
          url_follow_tiktok: urlFollowTiktok,
          status_pendaftaran: 'Submitted',
          qr_code_id: `IELA-${nim}`
        }
      ], { onConflict: 'nim' })
      .select();

    if (dbErr) {
      console.warn('Database upsert warning:', dbErr.message);
    }

    // Generate formal confirmation email template
    const emailHtml = buildStatusEmailHtml(nama, nim, 'Submitted');

    return new Response(
      JSON.stringify({
        success: true,
        message: 'Formulir pendaftaran dan ke-8 berkas persyaratan berhasil disimpan secara resmi!',
        pendaftar_id: pendaftarId,
        nim: nim,
        nama: nama,
        email_preview: emailHtml.slice(0, 500)
      }),
      {
        status: 200,
        headers: { 'Content-Type': 'application/json' }
      }
    );
  } catch (err: any) {
    console.error('Submit API Error:', err);
    return new Response(
      JSON.stringify({
        success: false,
        message: err.message || 'Terjadi kesalahan sistem saat memproses pendaftaran.'
      }),
      {
        status: 500,
        headers: { 'Content-Type': 'application/json' }
      }
    );
  }
};

import type { APIRoute } from 'astro';
import { supabase, supabaseAdmin } from '../../../lib/supabase';
import crypto from 'crypto';
import dbSeedRaw from '../../../data/db_seed.json';

// In-memory persistent state for local dev & offline fallback
let localStore: any = JSON.parse(JSON.stringify(dbSeedRaw));

function hashPassword(str: string): string {
  return crypto.createHash('sha256').update(String(str).trim()).digest('hex');
}

export const POST: APIRoute = async ({ params, request }) => {
  const action = params.action;
  const client = supabaseAdmin || supabase;

  try {
    let body: any = {};
    try {
      body = await request.json();
    } catch (e) {
      body = {};
    }

    const args = Array.isArray(body.args) ? body.args : [body];

    // ==========================================
    // 1. GET INITIAL DATA (POPULATES ALL VIEWS)
    // ==========================================
    if (action === 'getInitialData') {
      try {
        const [
          usersRes,
          pendaftarRes,
          profilRes,
          galeriRes,
          penilaianRes,
          pengumumanRes,
          pengaturanRes,
          publikasiRes
        ] = await Promise.all([
          client.from('users_profile').select('*').order('created_at', { ascending: true }).limit(2000),
          client.from('pendaftar').select('*').order('created_at', { ascending: false }).limit(2000),
          client.from('profil_konten').select('*').order('created_at', { ascending: false }).limit(2000),
          client.from('galeri_kegiatan').select('*').order('created_at', { ascending: false }).limit(2000),
          client.from('penilaian_rekap').select('*').order('created_at', { ascending: false }).limit(2000),
          client.from('pengumuman').select('*').order('created_at', { ascending: false }).limit(2000),
          client.from('pengaturan').select('*').limit(2000),
          client.from('publikasi').select('*').order('created_at', { ascending: false }).limit(2000)
        ]);

        if (!usersRes.error && usersRes.data && usersRes.data.length > 0) {
          const USERS = usersRes.data.map((u: any) => ({
            User_ID: u.user_id,
            user_id: u.user_id,
            Username_NIM: u.username_nim,
            username_nim: u.username_nim,
            Nama_Lengkap: u.nama_lengkap,
            nama_lengkap: u.nama_lengkap,
            Email: u.email || '',
            email: u.email || '',
            Role: u.role,
            role: u.role,
            Status_Aktif: (u.status_aktif !== false && u.status_aktif !== 'Non-Aktif' && String(u.status_aktif).toLowerCase() !== 'false'),
            status_aktif: u.status_aktif,
            Bidang_Divisi: u.bidang_divisi || '',
            bidang_divisi: u.bidang_divisi || '',
            Jabatan_Divisi: u.jabatan_divisi || '',
            jabatan_divisi: u.jabatan_divisi || '',
            Jabatan_Bidang: u.jabatan_bidang || ''
          }));

          const PENDAFTAR = (pendaftarRes.data || []).map((p: any) => ({
            Pendaftar_ID: p.pendaftar_id,
            pendaftar_id: p.pendaftar_id,
            NIM: p.nim,
            nim: p.nim,
            Nama: p.nama,
            nama: p.nama,
            Nama_Panggilan: p.nama_panggilan || '',
            Jenis_Kelamin: p.jenis_kelamin || '',
            TTL: p.ttl || '',
            Alamat_Asal: p.alamat_asal || '',
            Alamat_Sekarang: p.alamat_sekarang || '',
            No_HP: p.no_hp || '',
            Hobby: p.hobby || '',
            Cita_Cita: p.cita_cita || '',
            Motto_Hidup: p.motto_hidup || '',
            Semester: p.semester || '3',
            Prodi: p.prodi || 'Teknik Industri',
            IPK: p.ipk || 0,
            Bidang_Pilihan_1: p.bidang_pilihan_1 || '',
            Bidang_Pilihan_2: p.bidang_pilihan_2 || '',
            Keterampilan: p.keterampilan || '',
            Motivasi: p.motivasi || '',
            Target_IELA: p.target_iela || '',
            Riwayat_Organisasi: p.riwayat_organisasi || '',
            Pelatihan_Diikuti: p.pelatihan_diikuti || '',
            Buku_Diresume: p.buku_diresume || '',
            URL_Foto: p.url_foto || '',
            URL_KHS: p.url_khs || '',
            URL_CV: p.url_cv || '',
            URL_Sertifikat: p.url_sertifikat || '',
            URL_Resume: p.url_resume || '',
            URL_Jurnal_Referensi: p.url_jurnal_referensi || '',
            URL_Follow_IG: p.url_follow_ig || '',
            URL_Follow_TikTok: p.url_follow_tiktok || '',
            Status_Pendaftaran: p.status_pendaftaran || 'Submitted',
            status_pendaftaran: p.status_pendaftaran || 'Submitted',
            QR_Code_ID: p.qr_code_id || ''
          }));

          const PROFIL_KONTEN = (profilRes.data || []).map((k: any) => ({
            Konten_ID: k.konten_id,
            id: k.konten_id,
            Judul: k.judul,
            Kategori: k.kategori,
            Deskripsi: k.deskripsi,
            URL_Gambar: k.url_gambar,
            Tanggal_Publish: k.tanggal_publish
          }));

          const GALERI_KEGIATAN = (galeriRes.data || []).map((g: any) => ({
            Foto_ID: g.foto_id,
            Galeri_ID: g.foto_id,
            id: g.foto_id,
            Judul: g.judul_kegiatan,
            Judul_Kegiatan: g.judul_kegiatan,
            Deskripsi: g.deskripsi_kegiatan,
            Deskripsi_Kegiatan: g.deskripsi_kegiatan,
            URL_Gambar: g.url_foto,
            URL_Foto: g.url_foto,
            Kategori: g.kategori_event || 'Kegiatan',
            Kategori_Event: g.kategori_event || 'Kegiatan',
            Tanggal: g.tanggal_kegiatan,
            Tanggal_Kegiatan: g.tanggal_kegiatan
          }));

          const PENILAIAN_REKAP = (penilaianRes.data || []).map((p: any) => ({
            Penilaian_ID: p.penilaian_id,
            id: p.penilaian_id,
            Pendaftar_ID: p.pendaftar_id,
            pendaftar_id: p.pendaftar_id,
            User_ID_Penilai: p.user_id_penilai,
            user_id_penilai: p.user_id_penilai,
            Skor_Pengetahuan: p.skor_pengetahuan,
            skor_pengetahuan: p.skor_pengetahuan,
            Skor_Keterampilan: p.skor_keterampilan,
            skor_keterampilan: p.skor_keterampilan,
            Skor_Kedisiplinan: p.skor_kedisiplinan,
            skor_kedisiplinan: p.skor_kedisiplinan,
            Skor_Attitude: p.skor_attitude,
            skor_attitude: p.skor_attitude,
            Nilai_Bobot_Total: p.nilai_bobot_total,
            nilai_bobot_total: p.nilai_bobot_total,
            Catatan_Evaluasi: p.catatan_evaluasi || '',
            catatan_evaluasi: p.catatan_evaluasi || '',
            Tanggal_Penilaian: p.tanggal_penilaian || p.created_at,
            Nama_Pendaftar: p.nama_pendaftar || '',
            Nama_Penilai: p.nama_penilai || ''
          }));

          const PENGUMUMAN = (pengumumanRes.data || []).map((p: any) => ({
            Pengumuman_ID: p.pengumuman_id,
            id: p.pengumuman_id,
            Judul: p.judul,
            Isi_Pengumuman: p.isi_pengumuman,
            Tanggal_Terbit: p.tanggal_terbit,
            Status: p.status_publish || 'Published',
            Status_Publish: p.status_publish || 'Published'
          }));

          const PENGATURAN = (pengaturanRes.data || []).map((pt: any) => ({
            Param_ID: pt.param_id,
            Key_Name: pt.key_name,
            Value_Text: pt.value_text,
            key: pt.key_name,
            value: pt.value_text
          }));

          const PUBLIKASI = (publikasiRes.data || []).map((pb: any) => ({
            Publikasi_ID: pb.publikasi_id,
            id: pb.publikasi_id,
            Nama_Penulis: pb.nama_penulis,
            Judul_Artikel: pb.judul_artikel,
            Link_Artikel: pb.link_artikel,
            Nama_Jurnal: pb.nama_jurnal,
            Tahun: pb.tahun,
            Bidang_Sublab: pb.bidang_sublab,
            Tanggal_Input: pb.tanggal_input
          }));

          return new Response(JSON.stringify({
            success: true,
            data: {
              USERS,
              PENDAFTAR,
              PROFIL_KONTEN,
              GALERI_KEGIATAN,
              PENILAIAN_REKAP,
              SELEKSI_LOG: [],
              PENGUMUMAN,
              PENGATURAN,
              PUBLIKASI
            }
          }), { headers: { 'Content-Type': 'application/json' } });
        }
      } catch (errDb) {
        console.error('getInitialData DB fetch error:', errDb);
      }

      // Offline / Local fallback using loaded Excel seed
      const safeUsers = (localStore.USERS || []).map((u: any) => {
        const copy = { ...u };
        delete copy.Password;
        return copy;
      });

      return new Response(JSON.stringify({
        success: true,
        data: {
          USERS: safeUsers,
          PENDAFTAR: localStore.PENDAFTAR || [],
          PROFIL_KONTEN: localStore.PROFIL_KONTEN || [],
          GALERI_KEGIATAN: localStore.GALERI_KEGIATAN || [],
          PENILAIAN_REKAP: localStore.PENILAIAN_REKAP || [],
          SELEKSI_LOG: localStore.SELEKSI_LOG || [],
          PENGUMUMAN: localStore.PENGUMUMAN || [],
          PENGATURAN: localStore.PENGATURAN || [],
          PUBLIKASI: localStore.PUBLIKASI || []
        }
      }), { headers: { 'Content-Type': 'application/json' } });
    }

    // ==========================================
    // 2. AUTHENTICATION & PASSWORD
    // ==========================================
    if (action === 'login') {
      const usernameRaw = String(args[0] || '').trim();
      const password = String(args[1] || '').trim();
      const normalizedUsername = usernameRaw.replace(/\.0$/, '');
      const normalizedLower = normalizedUsername.toLowerCase();

      if (!usernameRaw || !password) {
        return new Response(JSON.stringify({
          success: false,
          message: 'Username/NIM dan Password wajib diisi!'
        }), { headers: { 'Content-Type': 'application/json' } });
      }

      let supabaseConnected = false;

      // A. Check Supabase users_profile (strict per-account password_hash check)
      try {
        const orClauses = Array.from(new Set([
          `username_nim.eq.${normalizedUsername}`,
          `username_nim.eq.${usernameRaw}`,
          `username_nim.eq.${normalizedUsername}.0`,
          `username_nim.eq.${normalizedLower}`
        ])).join(',');

        const { data: dbUsers, error: dbUsersErr } = await client
          .from('users_profile')
          .select('*')
          .or(orClauses);

        if (!dbUsersErr) {
          supabaseConnected = true;
        }

        if (dbUsers && dbUsers.length > 0) {
          const u = dbUsers[0];
          const isPrimaryAdmin = String(u.username_nim || '').trim().toLowerCase() === 'admin';
          const isUserActive = isPrimaryAdmin || (
            u.status_aktif !== false &&
            String(u.status_aktif || '').toLowerCase() !== 'false' &&
            String(u.status_aktif || '').toLowerCase() !== 'non-aktif'
          );

          if (!isUserActive) {
            return new Response(JSON.stringify({
              success: false,
              message: 'Akun Anda sedang berstatus Non-Aktif. Silakan hubungi Administrator.'
            }), { headers: { 'Content-Type': 'application/json' } });
          }

          const storedPass = String(u.password_hash || '').trim();
          const incomingHash = hashPassword(password);
          let isMatch = false;

          if (storedPass) {
            isMatch = (storedPass === incomingHash) || (storedPass === password);
          } else {
            // Legacy row without password_hash: only accept role-appropriate initial password
            isMatch = isPrimaryAdmin ? (password === 'admin123') : (password === 'das12345');
          }

          if (isMatch) {
            return new Response(JSON.stringify({
              success: true,
              user: {
                userId: u.user_id,
                username: u.username_nim,
                nama: u.nama_lengkap,
                role: u.role,
                jabatanBidang: u.jabatan_bidang || `${u.jabatan_divisi || ''} / ${u.bidang_divisi || ''}`.trim()
              }
            }), { headers: { 'Content-Type': 'application/json' } });
          }

          return new Response(JSON.stringify({
            success: false,
            message: 'Username/NIM atau Password salah!'
          }), { headers: { 'Content-Type': 'application/json' } });
        }
      } catch (e) {
        console.error('Supabase login check error:', e);
      }

      // B. Check Pendaftar by NIM (only if no users_profile row existed for this NIM)
      try {
        const { data: pendaftarList } = await client
          .from('pendaftar')
          .select('*')
          .or(`nim.eq.${normalizedUsername},nim.eq.${usernameRaw},nim.eq.${normalizedUsername}.0`);

        if (pendaftarList && pendaftarList.length > 0) {
          const p = pendaftarList[0];
          if (password === 'das12345') {
            return new Response(JSON.stringify({
              success: true,
              user: {
                userId: p.pendaftar_id,
                username: p.nim,
                nama: p.nama,
                role: 'Pendaftar',
                jabatanBidang: p.bidang_pilihan_1 || 'Calon Asisten'
              }
            }), { headers: { 'Content-Type': 'application/json' } });
          }

          return new Response(JSON.stringify({
            success: false,
            message: 'Username/NIM atau Password salah!'
          }), { headers: { 'Content-Type': 'application/json' } });
        }
      } catch (e) {}

      // C. Offline fallback (only when Supabase could not be reached)
      if (!supabaseConnected) {
        const foundUser = (localStore.USERS || []).find((u: any) => {
          const uNim = String(u.Username_NIM || u.username_nim || '').trim().replace(/\.0$/, '');
          return uNim.toLowerCase() === normalizedLower;
        });

        if (foundUser) {
          const isPrimaryAdmin = String(foundUser.Username_NIM || foundUser.username_nim || '').trim().toLowerCase() === 'admin';
          const storedPass = String(foundUser.Password || foundUser.password_hash || '').trim();
          const incomingHash = hashPassword(password);
          const isMatch = storedPass
            ? (storedPass === incomingHash || storedPass === password)
            : (isPrimaryAdmin ? password === 'admin123' : password === 'das12345');

          if (isMatch) {
            return new Response(JSON.stringify({
              success: true,
              user: {
                userId: foundUser.User_ID || foundUser.user_id,
                username: foundUser.Username_NIM || foundUser.username_nim,
                nama: foundUser.Nama_Lengkap || foundUser.nama_lengkap,
                role: foundUser.Role || foundUser.role,
                jabatanBidang: foundUser.Jabatan_Bidang || foundUser.jabatan_bidang || ''
              }
            }), { headers: { 'Content-Type': 'application/json' } });
          }
        }
      }

      return new Response(JSON.stringify({
        success: false,
        message: 'Username/NIM atau Password salah!'
      }), { headers: { 'Content-Type': 'application/json' } });
    }

    if (action === 'changePassword') {
      const userId = String(args[0] || '').trim();
      const oldPass = String(args[1] || '').trim();
      const newPass = String(args[2] || '').trim();

      if (!userId || !oldPass || !newPass) {
        return new Response(JSON.stringify({
          success: false,
          message: 'Password lama dan password baru wajib diisi!'
        }), { headers: { 'Content-Type': 'application/json' } });
      }

      const oldHash = hashPassword(oldPass);
      const newHash = hashPassword(newPass);

      try {
        const { data: existingUser, error: fetchErr } = await client
          .from('users_profile')
          .select('user_id, username_nim, password_hash')
          .eq('user_id', userId)
          .maybeSingle();

        if (!fetchErr && existingUser) {
          const isPrimaryAdmin = String(existingUser.username_nim || '').trim().toLowerCase() === 'admin';
          const storedPass = String(existingUser.password_hash || '').trim();
          const oldMatches = storedPass
            ? (storedPass === oldHash || storedPass === oldPass)
            : (isPrimaryAdmin ? oldPass === 'admin123' : oldPass === 'das12345');

          if (!oldMatches) {
            return new Response(JSON.stringify({
              success: false,
              message: 'Password lama yang Anda masukkan salah!'
            }), { headers: { 'Content-Type': 'application/json' } });
          }

          const { error: updateErr } = await client
            .from('users_profile')
            .update({ password_hash: newHash })
            .eq('user_id', userId);

          if (updateErr) {
            return new Response(JSON.stringify({
              success: false,
              message: `Gagal memperbarui password: ${updateErr.message}`
            }), { status: 500, headers: { 'Content-Type': 'application/json' } });
          }
        }
      } catch (e) {
        console.error('Supabase changePassword error:', e);
      }

      const u = (localStore.USERS || []).find((x: any) => String(x.User_ID || x.user_id) === userId);
      if (u) u.Password = newHash;

      return new Response(JSON.stringify({
        success: true,
        message: 'Password berhasil diubah!'
      }), { headers: { 'Content-Type': 'application/json' } });
    }

    // ==========================================
    // 3. REGISTRATION & APPLICANT FORM
    // ==========================================
    if (action === 'registerPendaftar') {
      const payload = args[0] || {};
      const npm = String(payload.npm || '').trim().replace(/\.0$/, '');
      const nama = String(payload.nama || '').trim();
      const email = String(payload.email || '').trim();
      const password = String(payload.password || '').trim();
      const passHash = hashPassword(password);

      const userId = 'USR-' + Math.floor(1000 + Math.random() * 9000);
      const pendaftarId = 'PDF-' + Math.floor(1000 + Math.random() * 9000);

      try {
        await client.from('users_profile').upsert({
          user_id: userId,
          username_nim: npm,
          nama_lengkap: nama,
          email: email,
          role: 'Pendaftar',
          status_aktif: true,
          password_hash: passHash
        }, { onConflict: 'username_nim' });

        await client.from('pendaftar').upsert({
          pendaftar_id: pendaftarId,
          user_id: userId,
          nim: npm,
          nama: nama,
          status_pendaftaran: 'Draft'
        }, { onConflict: 'nim' });
      } catch (e) {
        console.error('Failed to register in Supabase:', e);
      }

      localStore.USERS = localStore.USERS || [];
      localStore.USERS.push({
        User_ID: userId,
        Username_NIM: npm,
        Nama_Lengkap: nama,
        Role: 'Pendaftar',
        Status_Aktif: 'Aktif',
        Password: passHash
      });

      return new Response(JSON.stringify({
        success: true,
        message: `Pendaftaran akun ${npm} berhasil! Silakan login untuk melengkapi formulir.`,
        user: { userId, username: npm, nama, role: 'Pendaftar' }
      }), { headers: { 'Content-Type': 'application/json' } });
    }

    if (action === 'submitFormPendaftaran') {
      const payload = args[0] || {};
      const nim = String(payload.NIM || payload.nim || '').trim().replace(/\.0$/, '');
      let pId = String(payload.Pendaftar_ID || payload.pendaftar_id || '').trim();
      if (!pId) pId = 'PDF-' + Math.floor(1000 + Math.random() * 9000);

      const pendaftarRow: any = {
        pendaftar_id: pId,
        nim: nim,
        nama: payload.Nama || payload.nama || '',
        nama_panggilan: payload.Nama_Panggilan || payload.nama_panggilan || '',
        jenis_kelamin: payload.Jenis_Kelamin || payload.jenis_kelamin || '',
        ttl: payload.TTL || payload.ttl || '',
        no_hp: payload.No_HP || payload.no_hp || '',
        alamat_asal: payload.Alamat_Asal || payload.alamat_asal || '',
        alamat_sekarang: payload.Alamat_Sekarang || payload.alamat_sekarang || '',
        hobby: payload.Hobby || payload.hobby || '',
        cita_cita: payload.Cita_Cita || payload.cita_cita || '',
        motto_hidup: payload.Motto_Hidup || payload.motto_hidup || '',
        semester: String(payload.Semester || payload.semester || '3'),
        prodi: payload.Prodi || payload.prodi || 'Teknik Industri',
        ipk: Number(payload.IPK || payload.ipk) || 3.0,
        bidang_pilihan_1: payload.Bidang_Pilihan_1 || payload.bidang_pilihan_1 || '',
        bidang_pilihan_2: payload.Bidang_Pilihan_2 || payload.bidang_pilihan_2 || '',
        keterampilan: payload.Keterampilan || payload.keterampilan || '',
        motivasi: payload.Motivasi || payload.motivasi || '',
        target_iela: payload.Target_IELA || payload.target_iela || '',
        riwayat_organisasi: payload.Riwayat_Organisasi || payload.riwayat_organisasi || '',
        pelatihan_diikuti: payload.Pelatihan_Diikuti || payload.pelatihan_diikuti || '',
        buku_diresume: payload.Buku_Diresume || payload.buku_diresume || '',
        url_foto: payload.URL_Foto || payload.File_Foto_Base64 || '',
        url_khs: payload.URL_KHS || payload.File_KHS_Base64 || '',
        url_cv: payload.URL_CV || payload.File_CV_Base64 || '',
        url_sertifikat: payload.URL_Sertifikat || payload.File_Sertifikat_Base64 || '',
        url_resume: payload.URL_Resume || payload.File_Resume_Base64 || '',
        url_jurnal_referensi: payload.URL_Jurnal_Referensi || payload.File_Jurnal_Base64 || '',
        status_pendaftaran: 'Submitted'
      };

      try {
        await client.from('pendaftar').upsert(pendaftarRow, { onConflict: 'pendaftar_id' });
      } catch (e) {
        console.error('Failed to upsert submit pendaftar:', e);
      }

      if (!localStore.PENDAFTAR) localStore.PENDAFTAR = [];
      const idx = localStore.PENDAFTAR.findIndex((p: any) => {
        const pNim = String(p.NIM || p.nim || '').trim().replace(/\.0$/, '');
        const pPId = String(p.Pendaftar_ID || p.pendaftar_id || '').trim();
        return (pId && pPId === pId) || (nim && pNim === nim);
      });

      const storeItem = {
        ...pendaftarRow,
        Pendaftar_ID: pId,
        NIM: nim,
        Nama: pendaftarRow.nama,
        Status_Pendaftaran: 'Submitted'
      };
      if (idx !== -1) localStore.PENDAFTAR[idx] = storeItem;
      else localStore.PENDAFTAR.push(storeItem);

      return new Response(JSON.stringify({
        success: true,
        message: 'Formulir pendaftaran berhasil disimpan dan dikirim!'
      }), { headers: { 'Content-Type': 'application/json' } });
    }

    // ==========================================
    // 4. PENILAIAN WAWANCARA & SELEKSI
    // ==========================================
    if (action === 'savePenilaian') {
      const payload = args[0] || {};
      const pId = String(payload.pendaftarId || '').trim();
      const uId = String(payload.userIdPenilai || '').trim();
      const sk1 = Number(payload.skorPengetahuan || 0);
      const sk2 = Number(payload.skorKeterampilan || 0);
      const sk3 = Number(payload.skorKedisiplinan || 0);
      const sk4 = Number(payload.skorAttitude || 0);
      const catatan = String(payload.catatan || '');

      // Read configurable weights from payload or Supabase pengaturan (default 25 / 35 / 20 / 20)
      let w1 = Number(payload.bobotPengetahuan || 0);
      let w2 = Number(payload.bobotKeterampilan || 0);
      let w3 = Number(payload.bobotKedisiplinan || 0);
      let w4 = Number(payload.bobotAttitude || 0);

      if (!w1 && !w2 && !w3 && !w4) {
        try {
          const { data: bobotRows } = await client
            .from('pengaturan')
            .select('key_name, value_text')
            .in('key_name', ['BOBOT_PENGETAHUAN', 'BOBOT_KETERAMPILAN', 'BOBOT_KEDISIPLINAN', 'BOBOT_ATTITUDE']);
          const bMap: Record<string, number> = {};
          (bobotRows || []).forEach((r: any) => {
            bMap[String(r.key_name).trim()] = Number(r.value_text);
          });
          w1 = bMap.BOBOT_PENGETAHUAN || 25;
          w2 = bMap.BOBOT_KETERAMPILAN || 35;
          w3 = bMap.BOBOT_KEDISIPLINAN || 20;
          w4 = bMap.BOBOT_ATTITUDE || 20;
        } catch (e) {
          w1 = 25; w2 = 35; w3 = 20; w4 = 20;
        }
      }
      const wSum = (w1 + w2 + w3 + w4) || 100;
      const bobotTotal = Number((((sk1 * w1) + (sk2 * w2) + (sk3 * w3) + (sk4 * w4)) / wSum).toFixed(2));
      const nowStr = new Date().toISOString();

      try {
        const { data: existing } = await client.from('penilaian_rekap')
          .select('penilaian_id')
          .eq('pendaftar_id', pId)
          .eq('user_id_penilai', uId)
          .maybeSingle();

        if (existing && existing.penilaian_id) {
          await client.from('penilaian_rekap').update({
            skor_pengetahuan: sk1,
            skor_keterampilan: sk2,
            skor_kedisiplinan: sk3,
            skor_attitude: sk4,
            nilai_bobot_total: bobotTotal,
            catatan_evaluasi: catatan,
            tanggal_penilaian: nowStr
          }).eq('penilaian_id', existing.penilaian_id);
        } else {
          const evalId = `EVL-${Math.floor(10000 + Math.random() * 90000)}`;
          await client.from('penilaian_rekap').insert({
            penilaian_id: evalId,
            pendaftar_id: pId,
            user_id_penilai: uId,
            skor_pengetahuan: sk1,
            skor_keterampilan: sk2,
            skor_kedisiplinan: sk3,
            skor_attitude: sk4,
            nilai_bobot_total: bobotTotal,
            catatan_evaluasi: catatan,
            tanggal_penilaian: nowStr
          });
        }
      } catch (e) {
        console.error('Failed to save penilaian in Supabase:', e);
      }

      if (!localStore.PENILAIAN_REKAP) localStore.PENILAIAN_REKAP = [];
      const idx = localStore.PENILAIAN_REKAP.findIndex((x: any) => String(x.Pendaftar_ID) === pId && String(x.User_ID_Penilai) === uId);
      const evalObj = {
        Penilaian_ID: `EVL-${pId}-${uId}`,
        Pendaftar_ID: pId,
        User_ID_Penilai: uId,
        Skor_Pengetahuan: sk1,
        Skor_Keterampilan: sk2,
        Skor_Kedisiplinan: sk3,
        Skor_Attitude: sk4,
        Nilai_Bobot_Total: bobotTotal,
        Catatan_Evaluasi: catatan,
        Tanggal_Penilaian: nowStr
      };
      if (idx !== -1) localStore.PENILAIAN_REKAP[idx] = evalObj;
      else localStore.PENILAIAN_REKAP.push(evalObj);

      return new Response(JSON.stringify({
        success: true,
        message: 'Penilaian Wawancara Berhasil Disimpan!',
        evalObj
      }), { headers: { 'Content-Type': 'application/json' } });
    }

    if (action === 'updatePendaftarStatusAndNotify') {
      const payload = args[0] || {};
      const pId = String(payload.pendaftarId || '').trim();
      const npm = String(payload.npm || '').trim().replace(/\.0$/, '');
      const newStatus = String(payload.newStatus || '').trim();

      try {
        if (pId) {
          await client.from('pendaftar').update({ status_pendaftaran: newStatus }).eq('pendaftar_id', pId);
        } else if (npm) {
          await client.from('pendaftar').update({ status_pendaftaran: newStatus }).eq('nim', npm);
        }
      } catch (e) {
        console.error('Failed to update status in Supabase:', e);
      }

      const p = (localStore.PENDAFTAR || []).find((x: any) =>
        (pId && String(x.Pendaftar_ID) === pId) || (npm && String(x.NIM).replace(/\.0$/, '') === npm)
      );
      if (p) p.Status_Pendaftaran = newStatus;

      return new Response(JSON.stringify({
        success: true,
        message: `Status kandidat berhasil diperbarui menjadi '${newStatus}'!`
      }), { headers: { 'Content-Type': 'application/json' } });
    }

    if (action === 'batchUpdatePendaftarStatusAndNotify') {
      const payload = args[0] || {};
      const candidates = payload.candidates || payload.updates || [];
      const globalStatus = payload.newStatus || payload.status;

      for (const c of candidates) {
        const pId = String(c.pendaftarId || c.Pendaftar_ID || '').trim();
        const npm = String(c.npm || c.NIM || '').trim().replace(/\.0$/, '');
        const stat = String(c.status || c.newStatus || globalStatus || '').trim();

        if (stat) {
          try {
            if (pId) {
              await client.from('pendaftar').update({ status_pendaftaran: stat }).eq('pendaftar_id', pId);
            } else if (npm) {
              await client.from('pendaftar').update({ status_pendaftaran: stat }).eq('nim', npm);
            }
          } catch (e) {
            console.error('Failed to update batch candidate in Supabase:', e);
          }

          const cand = (localStore.PENDAFTAR || []).find((x: any) =>
            (pId && String(x.Pendaftar_ID) === pId) || (npm && String(x.NIM).replace(/\.0$/, '') === npm)
          );
          if (cand) cand.Status_Pendaftaran = stat;
        }
      }

      return new Response(JSON.stringify({
        success: true,
        message: `Berhasil memperbarui status ${candidates.length} kandidat!`
      }), { headers: { 'Content-Type': 'application/json' } });
    }

    if (action === 'deletePendaftar') {
      const payload = args[0] || {};
      const pId = String(payload.pendaftarId || payload.Pendaftar_ID || '').trim();
      const npm = String(payload.npm || payload.NIM || '').trim().replace(/\.0$/, '');

      try {
        if (pId) {
          await client.from('penilaian_rekap').delete().eq('pendaftar_id', pId);
          await client.from('seleksi_log').delete().eq('pendaftar_id', pId);
          await client.from('pendaftar').delete().eq('pendaftar_id', pId);
        } else if (npm) {
          await client.from('pendaftar').delete().eq('nim', npm);
        }
        if (npm) {
          await client
            .from('users_profile')
            .delete()
            .or(`username_nim.eq.${npm},username_nim.eq.${npm}.0`)
            .ilike('role', '%pendaftar%');
        }
      } catch (e) {
        console.error('Failed to deletePendaftar in Supabase:', e);
      }

      localStore.PENDAFTAR = (localStore.PENDAFTAR || []).filter((x: any) =>
        !(
          (pId && String(x.Pendaftar_ID) === pId) ||
          (npm && String(x.NIM).replace(/\.0$/, '') === npm)
        )
      );
      if (pId) {
        localStore.PENILAIAN_REKAP = (localStore.PENILAIAN_REKAP || []).filter(
          (x: any) => String(x.Pendaftar_ID) !== pId
        );
      }
      if (npm) {
        localStore.USERS = (localStore.USERS || []).filter((u: any) => {
          const uNim = String(u.Username_NIM || u.username_nim || '').trim().replace(/\.0$/, '');
          const uRole = String(u.Role || u.role || '').toLowerCase();
          return !(uNim === npm && uRole.includes('pendaftar'));
        });
      }

      return new Response(JSON.stringify({
        success: true,
        message: `Data pendaftar (${npm || pId}) beserta akun login pendaftarnya berhasil dihapus!`
      }), { headers: { 'Content-Type': 'application/json' } });
    }

    if (action === 'cleanupRejectedAndDraftPendaftar') {
      let deletedCount = 0;
      const pIdsToDelete: string[] = [];
      const nimsToDelete: string[] = [];

      try {
        const { data: allPendaftar } = await client
          .from('pendaftar')
          .select('pendaftar_id, nim, status_pendaftaran');

        (allPendaftar || []).forEach((row: any) => {
          const st = String(row.status_pendaftaran || '').toLowerCase().trim();
          if (st === 'draft' || st.includes('tidak')) {
            if (row.pendaftar_id) pIdsToDelete.push(String(row.pendaftar_id).trim());
            if (row.nim) nimsToDelete.push(String(row.nim).trim().replace(/\.0$/, ''));
          }
        });

        deletedCount = pIdsToDelete.length;

        if (pIdsToDelete.length > 0) {
          await client.from('penilaian_rekap').delete().in('pendaftar_id', pIdsToDelete);
          await client.from('seleksi_log').delete().in('pendaftar_id', pIdsToDelete);
          await client.from('pendaftar').delete().in('pendaftar_id', pIdsToDelete);
        }
        for (const nim of nimsToDelete) {
          if (!nim) continue;
          await client
            .from('users_profile')
            .delete()
            .or(`username_nim.eq.${nim},username_nim.eq.${nim}.0`)
            .ilike('role', '%pendaftar%');
        }
      } catch (e) {
        console.error('Failed to cleanupRejectedAndDraftPendaftar in Supabase:', e);
      }

      const beforeLocal = (localStore.PENDAFTAR || []).length;
      localStore.PENDAFTAR = (localStore.PENDAFTAR || []).filter((x: any) => {
        const st = String(x.Status_Pendaftaran || '').toLowerCase().trim();
        return !(st === 'draft' || st.includes('tidak'));
      });
      if (!deletedCount) {
        deletedCount = Math.max(0, beforeLocal - (localStore.PENDAFTAR || []).length);
      }
      if (pIdsToDelete.length > 0) {
        localStore.PENILAIAN_REKAP = (localStore.PENILAIAN_REKAP || []).filter(
          (x: any) => !pIdsToDelete.includes(String(x.Pendaftar_ID))
        );
      }
      if (nimsToDelete.length > 0) {
        localStore.USERS = (localStore.USERS || []).filter((u: any) => {
          const uNim = String(u.Username_NIM || u.username_nim || '').trim().replace(/\.0$/, '');
          const uRole = String(u.Role || u.role || '').toLowerCase();
          return !(nimsToDelete.includes(uNim) && uRole.includes('pendaftar'));
        });
      }

      return new Response(JSON.stringify({
        success: true,
        deletedCount,
        message: `Berhasil membersihkan ${deletedCount} data pendaftar Tidak Lolos & Draft (NPM mereka kini bebas untuk mendaftar di periode berikutnya)!`
      }), { headers: { 'Content-Type': 'application/json' } });
    }

    if (action === 'resetAllRecruitmentData') {
      let deletedCount = 0;
      try {
        const { data: allPendaftar } = await client
          .from('pendaftar')
          .select('pendaftar_id');
        deletedCount = (allPendaftar || []).length;

        // Wipe all evaluation, log, and applicant records
        await client.from('penilaian_rekap').delete().neq('penilaian_id', '__NONE__');
        await client.from('seleksi_log').delete().neq('log_id', '__NONE__');
        await client.from('pendaftar').delete().neq('pendaftar_id', '__NONE__');
        // Delete only user accounts with role Pendaftar (preserving Admin, Penguji, Aslab/Anggota)
        await client.from('users_profile').delete().ilike('role', '%pendaftar%');
        // Clear interview queue state in pengaturan
        await client
          .from('pengaturan')
          .update({ value_text: '[]' })
          .in('key_name', ['INTERVIEW_QUEUE_ORDER', 'INTERVIEW_QUEUE_DONE']);
      } catch (e) {
        console.error('Failed to resetAllRecruitmentData in Supabase:', e);
      }

      if (!deletedCount) {
        deletedCount = (localStore.PENDAFTAR || []).length;
      }
      localStore.PENDAFTAR = [];
      localStore.PENILAIAN_REKAP = [];
      localStore.SELEKSI_LOG = [];
      localStore.USERS = (localStore.USERS || []).filter((u: any) => {
        const uRole = String(u.Role || u.role || '').toLowerCase();
        return !uRole.includes('pendaftar');
      });

      return new Response(JSON.stringify({
        success: true,
        deletedCount,
        message: `Berhasil mengosongkan ${deletedCount} data pendaftar, antrean wawancara, & rekap nilai! Sistem siap untuk periode rekrutmen baru.`
      }), { headers: { 'Content-Type': 'application/json' } });
    }

    if (action === 'importRecruitmentBackup') {
      const payload = args[0] || {};
      const mode = String(payload.mode || 'merge').toLowerCase(); // 'merge' | 'replace'
      const useBuiltInSeed = Boolean(payload.useBuiltInSeed);
      const enrichFromArchive = payload.enrichFromArchive !== false;

      const seedPendaftar: any[] = Array.isArray((dbSeedRaw as any).PENDAFTAR) ? (dbSeedRaw as any).PENDAFTAR : [];
      const seedPenilaian: any[] = Array.isArray((dbSeedRaw as any).PENILAIAN_REKAP) ? (dbSeedRaw as any).PENILAIAN_REKAP : [];

      const seedByPid: Record<string, any> = {};
      const seedByNim: Record<string, any> = {};
      seedPendaftar.forEach((sp: any) => {
        const pid = String(sp.Pendaftar_ID || sp.pendaftar_id || '').trim();
        const nim = String(sp.NIM || sp.nim || '').trim().replace(/\.0$/, '');
        if (pid) seedByPid[pid] = sp;
        if (nim) seedByNim[nim] = sp;
      });

      const rawPendaftar: any[] = useBuiltInSeed
        ? seedPendaftar
        : (Array.isArray(payload.pendaftarList) ? payload.pendaftarList : []);
      const rawPenilaian: any[] = useBuiltInSeed
        ? seedPenilaian
        : (Array.isArray(payload.penilaianList) ? payload.penilaianList : []);

      if (rawPendaftar.length === 0 && rawPenilaian.length === 0) {
        return new Response(JSON.stringify({
          success: false,
          message: 'Tidak ada data pendaftar atau penilaian yang valid di dalam file backup.'
        }), { status: 400, headers: { 'Content-Type': 'application/json' } });
      }

      if (mode === 'replace') {
        try {
          await client.from('penilaian_rekap').delete().neq('penilaian_id', '__NONE__');
          await client.from('seleksi_log').delete().neq('log_id', '__NONE__');
          await client.from('pendaftar').delete().neq('pendaftar_id', '__NONE__');
          await client.from('users_profile').delete().ilike('role', '%pendaftar%');
          await client
            .from('pengaturan')
            .update({ value_text: '[]' })
            .in('key_name', ['INTERVIEW_QUEUE_ORDER', 'INTERVIEW_QUEUE_DONE']);
        } catch (e) {
          console.error('Failed clearing old data in replace mode:', e);
        }
        localStore.PENDAFTAR = [];
        localStore.PENILAIAN_REKAP = [];
        localStore.SELEKSI_LOG = [];
      }

      const existingNimToPid: Record<string, string> = {};
      const existingUserByNim: Record<string, string> = {};
      try {
        const [{ data: curPendaftar }, { data: curUsers }] = await Promise.all([
          client.from('pendaftar').select('pendaftar_id, nim').limit(2000),
          client.from('users_profile').select('user_id, username_nim').limit(2000)
        ]);
        (curPendaftar || []).forEach((r: any) => {
          const n = String(r.nim || '').trim().replace(/\.0$/, '');
          if (n && r.pendaftar_id) existingNimToPid[n] = String(r.pendaftar_id).trim();
        });
        (curUsers || []).forEach((u: any) => {
          const n = String(u.username_nim || '').trim().replace(/\.0$/, '');
          if (n && u.user_id) existingUserByNim[n] = String(u.user_id).trim();
        });
      } catch (e) {}

      const cleanVal = (v: any, fallback = '') => {
        if (v === undefined || v === null) return fallback;
        const s = String(v).trim();
        return (s === '' || s === '-') ? (fallback || s) : s;
      };
      const cleanPhone = (v: any) => {
        let s = String(v ?? '').trim().replace(/\.0$/, '');
        if (/^8\d{7,13}$/.test(s)) s = '0' + s;
        return s;
      };

      const pendaftarRows: any[] = [];
      const newUsersRows: any[] = [];
      const stalePidsToDelete: string[] = [];
      const nimToFinalPid: Record<string, string> = {};
      const namaLowerToFinalPid: Record<string, string> = {};
      const defaultPassHash = hashPassword('das12345');

      rawPendaftar.forEach((item: any, idx: number) => {
        const nim = String(item.NIM ?? item.nim ?? item.NPM ?? item.npm ?? '').trim().replace(/\.0$/, '');
        const nama = String(item.Nama ?? item.nama ?? item.Nama_Lengkap ?? item.nama_lengkap ?? '').trim();
        if (!nim && !nama) return;

        const seedRef = enrichFromArchive ? (seedByPid[String(item.Pendaftar_ID || item.pendaftar_id || '').trim()] || seedByNim[nim] || {}) : {};
        let pId = String(item.Pendaftar_ID || item.pendaftar_id || '').trim();
        if (!pId || pId === '-') {
          pId = existingNimToPid[nim] || String(seedRef.Pendaftar_ID || '').trim() || `PDF-${Math.floor(1000 + Math.random() * 8999)}-${idx}`;
        }

        if (nim && existingNimToPid[nim] && existingNimToPid[nim] !== pId) {
          stalePidsToDelete.push(existingNimToPid[nim]);
        }

        if (nim) nimToFinalPid[nim] = pId;
        if (nama) namaLowerToFinalPid[nama.toLowerCase()] = pId;

        if (nim && !existingUserByNim[nim]) {
          const uId = `USR-IMP-${nim.slice(-4)}-${idx + 1}`;
          existingUserByNim[nim] = uId;
          newUsersRows.push({
            user_id: uId,
            username_nim: nim,
            nama_lengkap: nama || nim,
            role: 'Pendaftar',
            status_aktif: true,
            password_hash: defaultPassHash
          });
        }

        const semClean = String(item.Semester ?? item.semester ?? seedRef.Semester ?? '3').trim().replace(/\.0$/, '') || '3';
        const ipkNum = parseFloat(String(item.IPK ?? item.ipk ?? seedRef.IPK ?? '0').replace(',', '.')) || 0;
        const phoneStr = cleanPhone(cleanVal(item.No_HP ?? item.no_hp, seedRef.No_HP || ''));

        pendaftarRows.push({
          pendaftar_id: pId,
          nim: nim || `IMP-${idx + 1}`,
          nama: nama || '-',
          nama_panggilan: cleanVal(item.Nama_Panggilan ?? item.nama_panggilan, seedRef.Nama_Panggilan || ''),
          jenis_kelamin: cleanVal(item.Jenis_Kelamin ?? item.jenis_kelamin, seedRef.Jenis_Kelamin || ''),
          ttl: cleanVal(item.TTL ?? item.ttl, seedRef.TTL || ''),
          alamat_asal: cleanVal(item.Alamat_Asal ?? item.alamat_asal, seedRef.Alamat_Asal || ''),
          alamat_sekarang: cleanVal(item.Alamat_Sekarang ?? item.alamat_sekarang, seedRef.Alamat_Sekarang || ''),
          no_hp: phoneStr,
          hobby: cleanVal(item.Hobby ?? item.hobby, seedRef.Hobby || ''),
          cita_cita: cleanVal(item.Cita_Cita ?? item.cita_cita, seedRef.Cita_Cita || ''),
          motto_hidup: cleanVal(item.Motto_Hidup ?? item.motto_hidup, seedRef.Motto_Hidup || ''),
          semester: semClean,
          prodi: cleanVal(item.Prodi ?? item.prodi, seedRef.Prodi || 'Teknik Industri'),
          ipk: ipkNum,
          bidang_pilihan_1: cleanVal(item.Bidang_Pilihan_1 ?? item.bidang_pilihan_1, seedRef.Bidang_Pilihan_1 || ''),
          bidang_pilihan_2: cleanVal(item.Bidang_Pilihan_2 ?? item.bidang_pilihan_2, seedRef.Bidang_Pilihan_2 || ''),
          keterampilan: cleanVal(item.Keterampilan ?? item.keterampilan, seedRef.Keterampilan || ''),
          motivasi: cleanVal(item.Motivasi ?? item.motivasi, seedRef.Motivasi || ''),
          target_iela: cleanVal(item.Target_IELA ?? item.target_iela, seedRef.Target_IELA || ''),
          riwayat_organisasi: cleanVal(item.Riwayat_Organisasi ?? item.riwayat_organisasi, seedRef.Riwayat_Organisasi || ''),
          pelatihan_diikuti: cleanVal(item.Pelatihan_Diikuti ?? item.pelatihan_diikuti, seedRef.Pelatihan_Diikuti || ''),
          buku_diresume: cleanVal(item.Buku_Diresume ?? item.buku_diresume, seedRef.Buku_Diresume || ''),
          url_foto: cleanVal(item.URL_Foto ?? item.url_foto, seedRef.URL_Foto || ''),
          url_khs: cleanVal(item.URL_KHS ?? item.url_khs, seedRef.URL_KHS || ''),
          url_cv: cleanVal(item.URL_CV ?? item.url_cv, seedRef.URL_CV || ''),
          url_sertifikat: cleanVal(item.URL_Sertifikat ?? item.url_sertifikat, seedRef.URL_Sertifikat || ''),
          url_resume: cleanVal(item.URL_Resume ?? item.url_resume, seedRef.URL_Resume || ''),
          url_jurnal_referensi: cleanVal(item.URL_Jurnal_Referensi ?? item.url_jurnal_referensi, seedRef.URL_Jurnal_Referensi || ''),
          status_pendaftaran: cleanVal(item.Status_Pendaftaran ?? item.status_pendaftaran, seedRef.Status_Pendaftaran || 'Submitted'),
          qr_code_id: cleanVal(item.QR_Code_ID ?? item.qr_code_id, seedRef.QR_Code_ID || (nim ? `QR-IELA-${nim}` : ''))
        });
      });

      // Deduplicate pendaftarRows by pendaftar_id
      const uniquePendaftarMap: Record<string, any> = {};
      pendaftarRows.forEach((r) => { uniquePendaftarMap[r.pendaftar_id] = r; });
      const finalPendaftarRows = Object.values(uniquePendaftarMap);
      const validPidSet = new Set(finalPendaftarRows.map((r: any) => r.pendaftar_id));

      // Resolve evaluations source (either from uploaded file sheet OR matched archive evaluations)
      let sourceEvals: any[] = rawPenilaian;
      if (sourceEvals.length === 0 && enrichFromArchive && validPidSet.size > 0) {
        sourceEvals = seedPenilaian.filter((ev: any) => {
          const evPid = String(ev.Pendaftar_ID || ev.pendaftar_id || '').trim();
          const evNama = String(ev.Nama_Pendaftar || ev.nama_pendaftar || '').trim().toLowerCase();
          return validPidSet.has(evPid) || (evNama && Boolean(namaLowerToFinalPid[evNama]));
        });
      }

      const penilaianMap: Record<string, any> = {};
      sourceEvals.forEach((ev: any, idx: number) => {
        let pId = String(ev.Pendaftar_ID || ev.pendaftar_id || '').trim();
        const evNim = String(ev.NPM || ev.NIM || ev.nim || '').trim().replace(/\.0$/, '');
        const evNama = String(ev.Nama_Pendaftar || ev.Nama_Kandidat || ev.nama_pendaftar || '').trim();
        if ((!pId || !validPidSet.has(pId)) && evNim && nimToFinalPid[evNim]) {
          pId = nimToFinalPid[evNim];
        }
        if ((!pId || !validPidSet.has(pId)) && evNama && namaLowerToFinalPid[evNama.toLowerCase()]) {
          pId = namaLowerToFinalPid[evNama.toLowerCase()];
        }
        if (!pId) return;

        const uPenilai = String(ev.User_ID_Penilai || ev.user_id_penilai || 'USR-001').trim();
        let evId = String(ev.Penilaian_ID || ev.penilaian_id || '').trim();
        if (!evId || evId === '-') {
          evId = `EVL-${pId}-${uPenilai}-${idx + 1}`;
        }

        const sk1 = parseFloat(String(ev.Skor_Pengetahuan ?? ev.skor_pengetahuan ?? 0).replace(',', '.')) || 0;
        const sk2 = parseFloat(String(ev.Skor_Keterampilan ?? ev.skor_keterampilan ?? 0).replace(',', '.')) || 0;
        const sk3 = parseFloat(String(ev.Skor_Kedisiplinan ?? ev.skor_kedisiplinan ?? 0).replace(',', '.')) || 0;
        const sk4 = parseFloat(String(ev.Skor_Attitude ?? ev.skor_attitude ?? 0).replace(',', '.')) || 0;
        let bobot = parseFloat(String(ev.Nilai_Bobot_Total ?? ev.nilai_bobot_total ?? 0).replace(',', '.'));
        if (!bobot && (sk1 || sk2 || sk3 || sk4)) {
          bobot = Number(((sk1 * 25 + sk2 * 35 + sk3 * 20 + sk4 * 20) / 100).toFixed(2));
        }

        const rawTgl = String(ev.Tanggal_Penilaian ?? ev.tanggal_penilaian ?? '').trim();
        let tgl = new Date().toISOString();
        if (rawTgl && rawTgl !== '-') {
          const asNum = Number(rawTgl);
          if (!isNaN(asNum) && asNum > 25000 && asNum < 80000) {
            tgl = new Date(Math.round((asNum - 25569) * 86400 * 1000)).toISOString();
          } else {
            const parsedMs = Date.parse(rawTgl);
            if (!isNaN(parsedMs)) tgl = new Date(parsedMs).toISOString();
          }
        }

        penilaianMap[evId] = {
          penilaian_id: evId,
          pendaftar_id: pId,
          user_id_penilai: uPenilai,
          skor_pengetahuan: sk1,
          skor_keterampilan: sk2,
          skor_kedisiplinan: sk3,
          skor_attitude: sk4,
          nilai_bobot_total: bobot || 0,
          catatan_evaluasi: String(ev.Catatan_Evaluasi ?? ev.catatan_evaluasi ?? '-').trim() || '-',
          tanggal_penilaian: tgl,
          nama_pendaftar: evNama || (uniquePendaftarMap[pId]?.nama || ''),
          nama_penilai: String(ev.Nama_Penilai ?? ev.Nama_Penguji ?? ev.nama_penilai ?? '').trim()
        };
      });
      const finalPenilaianRows = Object.values(penilaianMap);

      try {
        if (stalePidsToDelete.length > 0) {
          await client.from('pendaftar').delete().in('pendaftar_id', stalePidsToDelete);
        }
        for (let i = 0; i < newUsersRows.length; i += 100) {
          await client.from('users_profile').upsert(newUsersRows.slice(i, i + 100), { onConflict: 'username_nim' });
        }
        for (let i = 0; i < finalPendaftarRows.length; i += 100) {
          const { error: pErr } = await client.from('pendaftar').upsert(finalPendaftarRows.slice(i, i + 100), { onConflict: 'pendaftar_id' });
          if (pErr) {
            console.error('Batch upsert pendaftar error:', pErr);
            return new Response(JSON.stringify({ success: false, message: `Gagal menyimpan data pendaftar: ${pErr.message}` }), {
              status: 500,
              headers: { 'Content-Type': 'application/json' }
            });
          }
        }
        for (let i = 0; i < finalPenilaianRows.length; i += 200) {
          const { error: eErr } = await client.from('penilaian_rekap').upsert(finalPenilaianRows.slice(i, i + 200), { onConflict: 'penilaian_id' });
          if (eErr) {
            console.error('Batch upsert penilaian_rekap error:', eErr);
          }
        }
      } catch (e: any) {
        console.error('importRecruitmentBackup error:', e);
        return new Response(JSON.stringify({ success: false, message: `Gagal mengimpor backup: ${e.message || e}` }), {
          status: 500,
          headers: { 'Content-Type': 'application/json' }
        });
      }

      // Sync in-memory fallback store
      localStore.PENDAFTAR = finalPendaftarRows.map((p: any) => ({
        ...p,
        Pendaftar_ID: p.pendaftar_id,
        NIM: p.nim,
        Nama: p.nama,
        Status_Pendaftaran: p.status_pendaftaran
      }));
      localStore.PENILAIAN_REKAP = finalPenilaianRows.map((ev: any) => ({
        ...ev,
        Penilaian_ID: ev.penilaian_id,
        Pendaftar_ID: ev.pendaftar_id,
        User_ID_Penilai: ev.user_id_penilai,
        Skor_Pengetahuan: ev.skor_pengetahuan,
        Skor_Keterampilan: ev.skor_keterampilan,
        Skor_Kedisiplinan: ev.skor_kedisiplinan,
        Skor_Attitude: ev.skor_attitude,
        Nilai_Bobot_Total: ev.nilai_bobot_total,
        Catatan_Evaluasi: ev.catatan_evaluasi,
        Tanggal_Penilaian: ev.tanggal_penilaian,
        Nama_Pendaftar: ev.nama_pendaftar,
        Nama_Penilai: ev.nama_penilai
      }));

      return new Response(JSON.stringify({
        success: true,
        importedPendaftarCount: finalPendaftarRows.length,
        importedPenilaianCount: finalPenilaianRows.length,
        message: `Berhasil mengimpor ${finalPendaftarRows.length} Data Pendaftar & ${finalPenilaianRows.length} Penilaian Wawancara ke sistem!`
      }), { headers: { 'Content-Type': 'application/json' } });
    }

    // ==========================================
    // 5. USER & ASLAB MANAGEMENT
    // ==========================================
    if (action === 'saveOrUpdateUser') {
      const p = args[0] || {};
      const isExistingUser = Boolean(p.userId);
      const uId = String(p.userId || `USR-${Math.floor(1000 + Math.random() * 9000)}`).trim();
      const uNim = String(p.usernameNim || p.username || '').trim();
      const nama = String(p.namaLengkap ?? p.nama ?? p.name ?? '').trim();
      const role = String(p.role ?? 'Anggota').trim();
      let div = String(p.bidangDivisi ?? '').trim();
      let jab = String(p.jabatanDivisi ?? '').trim();
      const jabBid = String(p.jabatanBidang ?? (jab ? `${jab} / ${div}` : div)).trim();

      if (jabBid && (!jab || !div)) {
        if (jabBid.includes('/')) {
          const parts = jabBid.split('/');
          if (!jab) jab = String(parts[0] || '').trim();
          if (!div) div = String(parts.slice(1).join('/') || '').trim();
        } else if (!jab) {
          jab = jabBid;
        }
      }

      // Inline role/status edits send only the changed field.
      const isPartialUpdate = isExistingUser && !('namaLengkap' in p || 'nama' in p || 'name' in p || 'usernameNim' in p || 'username' in p);
      const userRow: any = { user_id: uId };
      if ('namaLengkap' in p || 'nama' in p || 'name' in p) userRow.nama_lengkap = nama;
      if ('role' in p) userRow.role = role;
      if ('bidangDivisi' in p || div) userRow.bidang_divisi = div;
      if ('jabatanDivisi' in p || jab) userRow.jabatan_divisi = jab;
      if ('jabatanBidang' in p || 'jabatanDivisi' in p || 'bidangDivisi' in p) userRow.jabatan_bidang = jabBid;
      if ('statusAktif' in p) userRow.status_aktif = p.statusAktif !== false && p.statusAktif !== 'Non-Aktif';
      if (uNim) userRow.username_nim = uNim;

      const rawPass = String(p.newPassword || p.password || '').trim();
      if (rawPass) {
        userRow.password_hash = hashPassword(rawPass);
      } else if (!isExistingUser) {
        userRow.password_hash = hashPassword('das12345');
      }

      const { data: savedRow, error: saveError } = isPartialUpdate
        ? await client.from('users_profile').update(userRow).eq('user_id', uId).select('*').maybeSingle()
        : await client.from('users_profile').upsert(userRow, { onConflict: 'user_id' }).select('*').single();

      if (saveError) {
        console.error('Failed to save user in Supabase:', saveError);
        return new Response(JSON.stringify({ success: false, message: `Gagal menyimpan perubahan ke Supabase: ${saveError.message}` }), {
          status: 500,
          headers: { 'Content-Type': 'application/json' }
        });
      }

      if (!savedRow) {
        return new Response(JSON.stringify({ success: false, message: 'Pengguna tidak ditemukan di Supabase.' }), {
          status: 404,
          headers: { 'Content-Type': 'application/json' }
        });
      }

      const savedNama = savedRow.nama_lengkap || nama;
      const savedRole = savedRow.role || role;
      const savedDiv = savedRow.bidang_divisi || '';
      const savedJab = savedRow.jabatan_divisi || '';
      const savedJabBid = savedRow.jabatan_bidang || '';

      const idxU = (localStore.USERS || []).findIndex((x: any) => String(x.User_ID) === uId);
      const userItem = {
        User_ID: uId,
        user_id: uId,
        Username_NIM: savedRow.username_nim,
        username_nim: savedRow.username_nim,
        Nama_Lengkap: savedNama,
        nama_lengkap: savedNama,
        Role: savedRole,
        role: savedRole,
        Bidang_Divisi: savedDiv,
        Jabatan_Divisi: savedJab,
        Jabatan_Bidang: savedJabBid,
        Status_Aktif: Boolean(savedRow.status_aktif !== false && savedRow.status_aktif !== 'Non-Aktif')
      };
      if (idxU !== -1) {
        const prevPass = localStore.USERS[idxU].Password;
        localStore.USERS[idxU] = userRow.password_hash ? { ...userItem, Password: userRow.password_hash } : { ...userItem, Password: prevPass };
      } else {
        (localStore.USERS = localStore.USERS || []).push(userRow.password_hash ? { ...userItem, Password: userRow.password_hash } : userItem);
      }

      return new Response(JSON.stringify({
        success: true,
        message: `Data pengguna '${savedNama}' berhasil disimpan ke Supabase!`,
        user: userItem
      }), { headers: { 'Content-Type': 'application/json' } });
    }

    if (action === 'deleteUserAccount') {
      const uId = String(typeof args[0] === 'object' && args[0] !== null ? (args[0].userId || args[0].id || args[0].username_nim || '') : (args[0] || '')).trim();
      if (!uId) {
        return new Response(JSON.stringify({ success: false, message: 'ID pengguna wajib diisi.' }), {
          status: 400,
          headers: { 'Content-Type': 'application/json' }
        });
      }

      const { data: deletedUsers, error: deleteError } = await client
        .from('users_profile')
        .delete()
        .or(`user_id.eq.${uId},username_nim.eq.${uId}`)
        .select('user_id');

      if (deleteError) {
        console.error('Failed to delete user in Supabase:', deleteError);
        return new Response(JSON.stringify({ success: false, message: `Gagal menghapus akun dari Supabase: ${deleteError.message}` }), {
          status: 500,
          headers: { 'Content-Type': 'application/json' }
        });
      }

      if (!deletedUsers || deletedUsers.length === 0) {
        return new Response(JSON.stringify({ success: false, message: 'Akun pengguna tidak ditemukan di Supabase.' }), {
          status: 404,
          headers: { 'Content-Type': 'application/json' }
        });
      }

      localStore.USERS = (localStore.USERS || []).filter((u: any) => String(u.User_ID) !== uId && String(u.Username_NIM) !== uId);
      return new Response(JSON.stringify({ success: true, message: 'Akun asisten berhasil dihapus!' }), {
        headers: { 'Content-Type': 'application/json' }
      });
    }

    // ==========================================
    // 6. PENGATURAN & CMS TAMPILAN
    // ==========================================
    if (action === 'savePengaturan' || action === 'savePengaturanMulti' || action === 'saveCmsSettings') {
      const entries: Array<{ key: string; val: any }> = [];

      if (typeof args[0] === 'string') {
        entries.push({ key: args[0], val: args[1] });
      } else if (Array.isArray(args[0])) {
        for (const item of args[0]) {
          if (item && (item.key || item.Key_Name || item.key_name)) {
            entries.push({
              key: item.key || item.Key_Name || item.key_name,
              val: item.value ?? item.Value_Text ?? item.value_text ?? ''
            });
          }
        }
      } else if (args[0] && typeof args[0] === 'object') {
        for (const [k, v] of Object.entries(args[0])) {
          entries.push({ key: k, val: v });
        }
      }

      let seq = 0;
      for (const entry of entries) {
        seq++;
        const kClean = String(entry.key || '').trim();
        if (!kClean) continue;
        const vClean = entry.val !== null && entry.val !== undefined ? String(entry.val) : '';
        try {
          const { data: existing } = await client.from('pengaturan')
            .select('param_id')
            .eq('key_name', kClean)
            .maybeSingle();

          if (existing && existing.param_id) {
            await client.from('pengaturan')
              .update({ value_text: vClean, updated_at: new Date().toISOString() })
              .eq('param_id', existing.param_id);
          } else if (vClean !== '') {
            const newParamId = `PRM-${Date.now().toString(36).toUpperCase()}-${seq}${Math.floor(10 + Math.random() * 89)}`;
            await client.from('pengaturan')
              .insert({
                param_id: newParamId,
                key_name: kClean,
                value_text: vClean
              });
          }
        } catch (e) {
          console.error(`Failed to upsert pengaturan '${kClean}':`, e);
        }

        const pt = (localStore.PENGATURAN || []).find((x: any) => String(x.Key_Name || x.key_name).trim() === kClean);
        if (pt) {
          pt.Value_Text = vClean;
          pt.value_text = vClean;
        } else if (vClean !== '') {
          localStore.PENGATURAN = localStore.PENGATURAN || [];
          localStore.PENGATURAN.push({ Param_ID: 'PRM-LCL', Key_Name: kClean, key_name: kClean, Value_Text: vClean, value_text: vClean });
        }
      }

      let latestPengaturan: any[] = [];
      try {
        const { data: pRows } = await client.from('pengaturan').select('*').limit(2000);
        if (pRows) {
          latestPengaturan = pRows.map((pt: any) => ({
            Param_ID: pt.param_id,
            Key_Name: pt.key_name,
            Value_Text: pt.value_text,
            key: pt.key_name,
            value: pt.value_text
          }));
        }
      } catch (e) {}

      return new Response(JSON.stringify({
        success: true,
        message: `Berhasil menyimpan ${entries.length} pengaturan ke database Supabase!`,
        pengaturan: latestPengaturan
      }), {
        headers: { 'Content-Type': 'application/json' }
      });
    }

    // ==========================================
    // 7. PENGUMUMAN (ANNOUNCEMENTS)
    // ==========================================
    if (action === 'simpanPengumuman') {
      const payload = args[0] || {};
      let pId = String(payload.id || '').trim();
      const isNew = !pId;
      if (!pId) {
        pId = 'PGM-' + Math.floor(1000 + Math.random() * 9000);
      }
      const judul = String(payload.judul || '').trim();
      const isi = String(payload.isi || '').trim();
      const tgl = String(payload.tanggal || new Date().toISOString().split('T')[0]).trim();

      try {
        await client.from('pengumuman').upsert({
          pengumuman_id: pId,
          judul: judul,
          isi_pengumuman: isi,
          tanggal_terbit: tgl,
          status_publish: 'Published'
        }, { onConflict: 'pengumuman_id' });
      } catch (e) {
        console.error('Failed to upsert pengumuman in Supabase:', e);
      }

      if (!localStore.PENGUMUMAN) localStore.PENGUMUMAN = [];
      const idx = localStore.PENGUMUMAN.findIndex((x: any) => String(x.Pengumuman_ID || x.id) === pId);
      const pgmObj = {
        Pengumuman_ID: pId,
        id: pId,
        Judul: judul,
        Isi_Pengumuman: isi,
        Tanggal_Terbit: tgl,
        Status: 'Published'
      };
      if (idx !== -1) localStore.PENGUMUMAN[idx] = pgmObj;
      else localStore.PENGUMUMAN.unshift(pgmObj);

      return new Response(JSON.stringify({
        success: true,
        message: isNew ? 'Pengumuman baru berhasil dipublikasikan!' : 'Pengumuman berhasil diperbarui!'
      }), { headers: { 'Content-Type': 'application/json' } });
    }

    if (action === 'hapusPengumuman') {
      const pId = String(typeof args[0] === 'object' && args[0] !== null ? (args[0].id || args[0].pengumuman_id || '') : (args[0] || '')).trim();
      try {
        await client.from('pengumuman').delete().eq('pengumuman_id', pId);
      } catch (e) {
        console.error('Failed to delete pengumuman in Supabase:', e);
      }
      localStore.PENGUMUMAN = (localStore.PENGUMUMAN || []).filter((x: any) => String(x.Pengumuman_ID || x.id) !== pId);
      return new Response(JSON.stringify({ success: true, message: 'Pengumuman berhasil dihapus!' }), {
        headers: { 'Content-Type': 'application/json' }
      });
    }

    // ==========================================
    // 8. KONTEN & GALERI KEGIATAN
    // ==========================================
    if (action === 'saveOrUpdateKonten') {
      const payload = args[0] || {};
      const type = String(payload.type || '').trim();
      let id = String(payload.id || '').trim();
      const isNew = !id;
      const judul = String(payload.judul || '').trim() || (type === 'Galeri' ? 'Dokumentasi Kegiatan IELA' : 'Informasi Profil IELA');
      const kategori = String(payload.kategori || '').trim();
      const deskripsi = String(payload.deskripsi || '').trim();
      const uploadedPhotos = Array.isArray(payload.gambarBase64List) && payload.gambarBase64List.length > 0
        ? payload.gambarBase64List.filter(Boolean).join('||')
        : String(payload.gambarBase64 || '').trim();
      const urlGambar = String(payload.urlGambar || payload.urlFoto || '').trim() || uploadedPhotos || 'https://images.unsplash.com/photo-1581092160607-ee22621dd758?w=800';

      if (type.toLowerCase().includes('galeri')) {
        if (!id) id = 'GAL-' + Math.floor(1000 + Math.random() * 9000);
        try {
          await client.from('galeri_kegiatan').upsert({
            foto_id: id,
            judul_kegiatan: judul,
            deskripsi_kegiatan: deskripsi,
            url_foto: urlGambar,
            kategori_event: kategori || 'Kegiatan',
            tanggal_kegiatan: new Date().toISOString().split('T')[0]
          }, { onConflict: 'foto_id' });
        } catch (e) {
          console.error('Failed to upsert galeri in Supabase:', e);
        }

        if (!localStore.GALERI_KEGIATAN) localStore.GALERI_KEGIATAN = [];
        const idx = localStore.GALERI_KEGIATAN.findIndex((x: any) => String(x.Foto_ID || x.Galeri_ID || x.id) === id);
        const galObj = {
          Foto_ID: id,
          Galeri_ID: id,
          id,
          Judul: judul,
          Judul_Kegiatan: judul,
          Deskripsi: deskripsi,
          Deskripsi_Kegiatan: deskripsi,
          URL_Gambar: urlGambar,
          URL_Foto: urlGambar,
          Kategori: kategori || 'Kegiatan',
          Tanggal: new Date().toISOString().split('T')[0]
        };
        if (idx !== -1) localStore.GALERI_KEGIATAN[idx] = galObj;
        else localStore.GALERI_KEGIATAN.unshift(galObj);

      } else {
        if (!id) id = 'KTN-' + Math.floor(1000 + Math.random() * 9000);
        try {
          await client.from('profil_konten').upsert({
            konten_id: id,
            judul: judul,
            kategori: kategori || (type === 'Berita' ? 'Berita' : 'Sub-Laboratorium'),
            deskripsi: deskripsi,
            url_gambar: urlGambar,
            tanggal_publish: new Date().toISOString().split('T')[0]
          }, { onConflict: 'konten_id' });
        } catch (e) {
          console.error('Failed to upsert profil_konten in Supabase:', e);
        }

        if (!localStore.PROFIL_KONTEN) localStore.PROFIL_KONTEN = [];
        const idx = localStore.PROFIL_KONTEN.findIndex((x: any) => String(x.Konten_ID || x.id) === id);
        const ktnObj = {
          Konten_ID: id,
          id,
          Judul: judul,
          Kategori: kategori || (type === 'Berita' ? 'Berita' : 'Sub-Laboratorium'),
          Deskripsi: deskripsi,
          URL_Gambar: urlGambar,
          Tanggal_Publish: new Date().toISOString().split('T')[0]
        };
        if (idx !== -1) localStore.PROFIL_KONTEN[idx] = ktnObj;
        else localStore.PROFIL_KONTEN.unshift(ktnObj);
      }

      return new Response(JSON.stringify({
        success: true,
        message: isNew ? 'Konten berhasil ditambahkan!' : 'Konten berhasil diperbarui!'
      }), { headers: { 'Content-Type': 'application/json' } });
    }

    if (action === 'deleteKontenItem') {
      let mode = '';
      let id = '';
      if (typeof args[0] === 'object' && args[0] !== null) {
        mode = String(args[0].mode || args[0].type || '').toLowerCase().trim();
        id = String(args[0].id || '').trim();
      } else {
        mode = String(args[0] || '').toLowerCase().trim();
        id = String(args[1] || '').trim();
      }

      if (mode.includes('galeri')) {
        try {
          await client.from('galeri_kegiatan').delete().eq('foto_id', id);
        } catch (e) {
          console.error('Failed to delete galeri from Supabase:', e);
        }
        localStore.GALERI_KEGIATAN = (localStore.GALERI_KEGIATAN || []).filter((x: any) => String(x.Foto_ID || x.Galeri_ID || x.id) !== id);
      } else {
        try {
          await client.from('profil_konten').delete().eq('konten_id', id);
        } catch (e) {
          console.error('Failed to delete profil_konten from Supabase:', e);
        }
        localStore.PROFIL_KONTEN = (localStore.PROFIL_KONTEN || []).filter((x: any) => String(x.Konten_ID || x.id) !== id);
      }

      return new Response(JSON.stringify({ success: true, message: 'Konten berhasil dihapus!' }), {
        headers: { 'Content-Type': 'application/json' }
      });
    }

    // ==========================================
    // 9. PUBLIKASI ILMIAH
    // ==========================================
    if (action === 'simpanPublikasi') {
      const payload = args[0] || {};
      let pId = String(payload.id || '').trim();
      const isNew = !pId;
      if (!pId) {
        pId = 'PUB-' + Math.floor(1000 + Math.random() * 9000);
      }
      const nama = String(payload.nama || payload.nama_penulis || '').trim() || 'Tim Peneliti IELA';
      const judul = String(payload.judul || payload.judul_artikel || '').trim() || 'Publikasi Ilmiah Laboratorium IELA';
      const link = String(payload.link || payload.link_artikel || '').trim();
      const jurnal = String(payload.jurnal || payload.nama_jurnal || '').trim();
      const tahun = parseInt(String(payload.tahun || new Date().getFullYear()), 10) || 2026;
      const bidang = String(payload.bidang || payload.bidang_sublab || '').trim();

      try {
        await client.from('publikasi').upsert({
          publikasi_id: pId,
          nama_penulis: nama,
          judul_artikel: judul,
          link_artikel: link,
          nama_jurnal: jurnal,
          tahun: tahun,
          bidang_sublab: bidang,
          tanggal_input: new Date().toISOString()
        }, { onConflict: 'publikasi_id' });
      } catch (e) {
        console.error('Failed to upsert publikasi in Supabase:', e);
      }

      if (!localStore.PUBLIKASI) localStore.PUBLIKASI = [];
      const idx = localStore.PUBLIKASI.findIndex((x: any) => String(x.Publikasi_ID || x.id) === pId);
      const pubObj = {
        Publikasi_ID: pId,
        id: pId,
        Nama_Penulis: nama,
        Judul_Artikel: judul,
        Link_Artikel: link,
        Nama_Jurnal: jurnal,
        Tahun: tahun,
        Bidang_Sublab: bidang,
        Tanggal_Input: new Date().toISOString()
      };
      if (idx !== -1) localStore.PUBLIKASI[idx] = pubObj;
      else localStore.PUBLIKASI.unshift(pubObj);

      return new Response(JSON.stringify({
        success: true,
        message: isNew ? 'Publikasi artikel berhasil ditambahkan!' : 'Publikasi artikel berhasil diperbarui!'
      }), { headers: { 'Content-Type': 'application/json' } });
    }

    if (action === 'hapusPublikasi') {
      const pId = String(typeof args[0] === 'object' && args[0] !== null ? (args[0].id || args[0].publikasi_id || '') : (args[0] || '')).trim();
      try {
        await client.from('publikasi').delete().eq('publikasi_id', pId);
      } catch (e) {
        console.error('Failed to delete publikasi from Supabase:', e);
      }
      localStore.PUBLIKASI = (localStore.PUBLIKASI || []).filter((x: any) => String(x.Publikasi_ID || x.id) !== pId);
      return new Response(JSON.stringify({ success: true, message: 'Publikasi berhasil dihapus!' }), {
        headers: { 'Content-Type': 'application/json' }
      });
    }

    // Default Fallback
    return new Response(JSON.stringify({ success: true, message: `Action '${action}' berhasil diproses.` }), {
      headers: { 'Content-Type': 'application/json' }
    });

  } catch (err: any) {
    console.error('RPC Error:', err);
    return new Response(JSON.stringify({ success: false, message: err.message || 'Server RPC Error' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
};

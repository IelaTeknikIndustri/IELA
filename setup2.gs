/**
 * setup.gs - Inisialisasi Database Google Sheets IELA 2027-2028
 */

function setupDatabase() {
  var ss;
  try {
    ss = SpreadsheetApp.getActiveSpreadsheet();
  } catch (e) {
    Logger.log("Non container-bound environment detected: " + e.message);
  }

  if (!ss) {
    var files = DriveApp.getFilesByName("IELA_Recruitment_Database_2026");
    if (files.hasNext()) {
      ss = SpreadsheetApp.open(files.next());
    } else {
      ss = SpreadsheetApp.create("IELA_Recruitment_Database_2026");
    }
  }

  var aslabList = [
    { npm: "1411240021", nama: "Amelia Agustin", phone: "089696023058", bidang: "2. Ergonomi", jabatan: "Pembimbing Praktikum" },
    { npm: "1411230067", nama: "Titin Rizqi Maulida", phone: "087843225947", bidang: "3. Statistika", jabatan: "Pembimbing Praktikum" },
    { npm: "1411230112", nama: "M. Naufal Rafiq Zawawi", phone: "088513772979", bidang: "1. Fisika", jabatan: "Pembimbing Praktikum" },
    { npm: "1411230129", nama: "Marisa Anggun Aulia", phone: "085733399884", bidang: "5. Algoritma", jabatan: "Pembimbing Praktikum" },
    { npm: "1411240053", nama: "M. Tomi Wardana", phone: "089676530036", bidang: "4. Manufaktur (a. Bubut)", jabatan: "Pembimbing Praktikum" },
    { npm: "1411240045", nama: "Kirana Meida Putri", phone: "08161885976", bidang: "4. Manufaktur (a. Bubut)", jabatan: "Pembimbing Praktikum" },
    { npm: "1411230092", nama: "Khinanti Mutiara Dewi", phone: "082398069700", bidang: "2. Ergonomi", jabatan: "Pembimbing Praktikum" },
    { npm: "1411230105", nama: "M. Luqman Firdaus", phone: "085934457912", bidang: "4. Manufaktur (b. 3D Printing)", jabatan: "Anggota Sub-Lab" },
    { npm: "1411240096", nama: "Silvia Khoirun Nisa", phone: "085706097919", bidang: "3. Statistika", jabatan: "Pembimbing Praktikum" },
    { npm: "1411240077", nama: "Nurul Elvika", phone: "081331303171", bidang: "4. Manufaktur (b. 3D Printing)", jabatan: "Koordinator Sub-Lab" },
    { npm: "1411230084", nama: "Dyka Efendi", phone: "08993667883", bidang: "1. Fisika", jabatan: "Pembimbing Praktikum" },
    { npm: "1411240100", nama: "Syahrul Romadhon", phone: "083891181658", bidang: "4. Manufaktur (a. Bubut)", jabatan: "Pembimbing Praktikum" },
    { npm: "1411240074", nama: "Nanik Relawati", phone: "087873961172", bidang: "2. Ergonomi", jabatan: "Pembimbing Praktikum" },
    { npm: "1411240083", nama: "Relina Fajrikhatus S", phone: "085745084617", bidang: "5. Algoritma", jabatan: "Pembimbing Praktikum" },
    { npm: "1411240031", nama: "Bima Mauludian Andika", phone: "0895324163475", bidang: "4. Manufaktur (c. CNC)", jabatan: "Pembimbing Praktikum" },
    { npm: "1411230023", nama: "Anggun Harifianti", phone: "088804832738", bidang: "2. Ergonomi", jabatan: "Pembimbing Praktikum" },
    { npm: "1411230013", nama: "Ali Ma'sum", phone: "085733538468", bidang: "1. Fisika", jabatan: "Pembimbing Praktikum" },
    { npm: "1411240112", nama: "Siti Nurrohmawati", phone: "089670625598", bidang: "4. Manufaktur (c. CNC)", jabatan: "Pembimbing Praktikum" },
    { npm: "1411240072", nama: "M. Abdul Zunus", phone: "081456179248", bidang: "1. Fisika", jabatan: "Pembimbing Praktikum" },
    { npm: "1411230046", nama: "M. Bahruddin", phone: "085806866264", bidang: "4. Manufaktur (a. Bubut)", jabatan: "Pembimbing Praktikum" },
    { npm: "1411230061", nama: "Ryo Albareta Margareno", phone: "087707001663", bidang: "3. Statistika", jabatan: "Pembimbing Praktikum" },
    { npm: "1411230132", nama: "Shohibul Makrom", phone: "08563304847", bidang: "5. Algoritma", jabatan: "Pembimbing Praktikum" },
    { npm: "1411230100", nama: "Sony Dwi Irawan", phone: "083129561383", bidang: "4. Manufaktur (a. Bubut)", jabatan: "Pembimbing Praktikum" },
    { npm: "1411230044", nama: "M. Agus Nanto", phone: "082257153632", bidang: "1. Fisika", jabatan: "Pembimbing Praktikum" },
    { npm: "1411240019", nama: "Alfin Zamzuri", phone: "089531255556", bidang: "3. Statistika", jabatan: "Pembimbing Praktikum" },
    { npm: "1411230060", nama: "Rochmahwan Dwi Ardiansyah", phone: "082193872078", bidang: "4. Manufaktur (c. CNC)", jabatan: "Pembimbing Praktikum" },
    { npm: "1411240042", nama: "Hendik Eko Juniarto", phone: "082332881952", bidang: "4. Manufaktur (b. 3D Printing)", jabatan: "Pembimbing Praktikum" },
    { npm: "1411240079", nama: "Putri Lestari Kumkelo", phone: "087794492203", bidang: "2. Ergonomi", jabatan: "Pembimbing Praktikum" },
    { npm: "1411230083", nama: "Abdul Rokhim", phone: "081246380131", bidang: "1. Fisika", jabatan: "Pembimbing Praktikum" }
  ];

  var initialUsers = [
    ["USR-001", "admin", "das12345", "Koordinator Utama IELA", "admin@iela.unirow.ac.id", "Admin", true, "Manajemen Lab", "Koordinator Utama"],
    ["USR-002", "penguji1", "das12345", "Ir. Budi Santoso, M.T.", "budi@iela.unirow.ac.id", "Anggota", true, "1. Fisika", "Penguji Wawancara"],
    ["USR-003", "penguji2", "das12345", "Siti Aminah, S.T., M.T.", "siti@iela.unirow.ac.id", "Anggota", true, "2. Ergonomi", "Penguji Wawancara"]
  ];

  for (var k = 0; k < aslabList.length; k++) {
    var item = aslabList[k];
    var uId = "USR-" + String(100 + k);
    var emailVal = "mhs" + item.npm + "@student.unirow.ac.id";
    initialUsers.push([
      uId, item.npm, "das12345", item.nama, emailVal, "Anggota", true, item.bidang, item.jabatan
    ]);
  }

  // UPDATE: Kolom URL_Jurnal_Referensi diletakkan paling belakang agar tidak menggeser kolom status
  var schemas = [
    { name: "USERS", headers: ["User_ID", "Username_NIM", "Password", "Nama_Lengkap", "Email", "Role", "Status_Aktif", "Bidang_Divisi", "Jabatan_Divisi"], initialData: initialUsers },
    {
      name: "PROFIL_KONTEN", headers: ["Konten_ID", "Judul", "Kategori", "Deskripsi", "URL_Gambar", "Tanggal_Publish"],
      initialData: [
        ["KTN-001", "Visi & Misi IELA Unirow", "Profil", "Menjadi pusat keunggulan riset dan praktikum Teknik Industri.", "https://images.unsplash.com/photo-1581091226825-a6a2a5aee158?w=800", "2026-01-10"],
        ["KTN-002", "Fasilitas Laboratorium Ergonomi & PSK", "Fasilitas", "Dilengkapi dengan Anthropometer, Motion Capture System, dan Software Simulasi.", "https://images.unsplash.com/photo-1581092335397-9583fe92d232?w=800", "2026-01-12"],
        ["KTN-003", "Workshop Pemesinan & 3D Printing", "Berita", "Pelatihan integrasi manufaktur bubut, 3D printing, dan CNC bagi mahasiswa.", "https://images.unsplash.com/photo-1581092160607-ee22621dd758?w=800", "2026-02-01"]
      ]
    },
    {
      name: "GALERI_KEGIATAN", headers: ["Foto_ID", "Judul_Kegiatan", "Deskripsi_Kegiatan", "Tanggal_Kegiatan", "URL_Foto", "Kategori_Event"],
      initialData: [
        ["GLR-001", "Praktikum Perancangan Sistem Kerja", "Sesi pengambilan data antropometri mahasiswa.", "2026-02-15", "https://images.unsplash.com/photo-1581092580497-e0d23cbdf1dc?w=800", "Praktikum"],
        ["GLR-002", "Studi Ekskursi Manufaktur", "Kunjungan kerja laboratorium ke industri pemesinan.", "2026-02-20", "https://images.unsplash.com/photo-1581091226825-a6a2a5aee158?w=800", "Riset"]
      ]
    },
    { name: "PENDAFTAR", headers: ["Pendaftar_ID", "User_ID", "NIM", "Nama", "Nama_Panggilan", "Jenis_Kelamin", "TTL", "Alamat_Asal", "Alamat_Sekarang", "No_HP", "Hobby", "Cita_Cita", "Motto_Hidup", "Semester", "Prodi", "IPK", "Bidang_Pilihan_1", "Bidang_Pilihan_2", "Keterampilan", "Motivasi", "Target_IELA", "Riwayat_Organisasi", "Pelatihan_Diikuti", "Buku_Diresume", "URL_Foto", "URL_KHS", "URL_CV", "URL_Sertifikat", "URL_Resume", "Status_Pendaftaran", "QR_Code_ID", "URL_Jurnal_Referensi"], initialData: [] },
    { name: "PENILAIAN_REKAP", headers: ["Penilaian_ID", "Pendaftar_ID", "User_ID_Penilai", "Skor_Pengetahuan", "Skor_Keterampilan", "Skor_Kedisiplinan", "Skor_Attitude", "Nilai_Bobot_Total", "Catatan_Evaluasi", "Tanggal_Penilaian"], initialData: [] },
    { name: "SELEKSI_LOG", headers: ["Log_ID", "Pendaftar_ID", "Tahap", "Status_Tahap", "Nilai_Akhir_Rata2", "Catatan_Final", "Tanggal_Update"], initialData: [] },
    { name: "PENGUMUMAN", headers: ["Pengumuman_ID", "Judul", "Isi_Pengumuman", "Tanggal_Terbit", "Status_Publish"], initialData: [["PGM-001", "Pendaftaran IELA 2027-2028 Resmi Dibuka", "Segera lengkapi berkas Anda sebelum batas waktu pendaftaran.", "2026-01-01", "true"]] },
    { 
      name: "PENGATURAN", 
      headers: ["Param_ID", "Key_Name", "Value_Text"], 
      initialData: [
        ["PRM-001", "LINK_WA_GROUP", "https://chat.whatsapp.com/demo"],
        ["PRM-002", "MIN_IPK", "3.00"],
        ["PRM-003", "STATUS_PENDAFTARAN", "BUKA"],
        ["PRM-004", "PESAN_PENDAFTARAN_DITUTUP", "Pendaftaran Calon Asisten Laboratorium IELA periode ini saat ini sedang ditutup. Terima kasih atas antusiasme rekan-rekan mahasiswa. Pantau terus akun sosial media resmi kami untuk pengumuman tahap berikutnya."],
        ["PRM-005", "MODE_PORTAL", "REKRUTMEN"],
        ["PRM-006", "TAHUN_PERIODE", "2027/2028"],
        ["PRM-007", "NAMA_PORTAL", "Laboratorium Teknik Industri (IELA) Universitas PGRI Ronggolawe Tuban"],
        ["PRM-008", "MIN_SEMESTER", "Semester 3"],
        ["PRM-009", "TIMELINE_BUKA", "01 Januari 2027"],
        ["PRM-010", "TIMELINE_TUTUP", "15 Februari 2027"],
        ["PRM-011", "TIMELINE_WAWANCARA", "20 Februari 2027"],
        ["PRM-012", "TIMELINE_PENGUMUMAN", "01 Maret 2027"],
        ["PRM-013", "HOTLINE_WA", "085934457912"],
        ["PRM-014", "LAB_EMAIL", "iela@unirow.ac.id"],
        ["PRM-015", "LAB_INSTAGRAM", "@iela_unirow"]
      ] 
    }
  ];

  schemas.forEach(function(schema) {
    var sheet = ss.getSheetByName(schema.name);
    if (sheet) {
      sheet.clearContents();
    } else {
      sheet = ss.insertSheet(schema.name);
    }
    sheet.appendRow(schema.headers);
    if (schema.initialData && schema.initialData.length > 0) {
      schema.initialData.forEach(function(row) { sheet.appendRow(row); });
    }
    sheet.getRange(1, 1, 1, schema.headers.length).setFontWeight("bold").setBackground("#1E293B").setFontColor("#F8FAFC");
    Logger.log('Sheet ' + schema.name + ' berhasil dibuat / diverifikasi');
  });

  return "Database IELA Berhasil Dinisialisasi!";
}
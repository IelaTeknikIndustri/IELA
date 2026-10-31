/**
 * Helper untuk mencari indeks kolom header secara dinamis & toleran terhadap variasi penamaan
 */
function findHeaderColumnIndex(headers, possibleNames, defaultIndex) {
  if (!headers || !headers.length) return defaultIndex;
  for (var i = 0; i < headers.length; i++) {
    var clean = String(headers[i]).trim().toLowerCase().replace(/[\s_-]+/g, "");
    for (var k = 0; k < possibleNames.length; k++) {
      if (clean === possibleNames[k].toLowerCase().replace(/[\s_-]+/g, "")) {
        return i;
      }
    }
  }
  return defaultIndex;
}

/**
 * Code.gs - Main Backend Controller for Google Apps Script (GAS)
 * Web App Portal Profil & Recruitment IELA 2027-2028
 */

function doGet(e) {
  try {
    if (e && e.parameter && (e.parameter.action === 'sendTestLolosEmail' || e.parameter.action === 'testEmail')) {
      var to = e.parameter.to || 'luqmanf667@gmail.com';
      var nama = e.parameter.nama || 'M. Luqman Firdaus';
      var npm = e.parameter.npm || '1411230105';
      var status = e.parameter.status || 'Lolos Asisten Lab 2027';
      var note = e.parameter.note || '';
      var result = sendTestLolosEmail(to, nama, npm, status, note);
      return ContentService.createTextOutput(JSON.stringify(result)).setMimeType(ContentService.MimeType.JSON);
    }

    return HtmlService.createHtmlOutputFromFile('index')
      .setTitle('IELA WebApp - Profil & Recruitment Portal 2027-2028')
      .addMetaTag('viewport', 'width=device-width, initial-scale=1')
      .setXFrameOptionsMode(HtmlService.XFrameOptionsMode.ALLOWALL);
  } catch (err) {
    return HtmlService.createHtmlOutput("<h3>Server Error: " + err.toString() + "</h3>");
  }
}

function doPost(e) {
  try {
    var params = (e && e.parameter) || {};
    var postData = {};
    if (e && e.postData && e.postData.contents) {
      try {
        postData = JSON.parse(e.postData.contents);
      } catch (ex) {}
    }
    var action = params.action || postData.action;
    if (action === 'sendTestLolosEmail' || action === 'testEmail') {
      var to = params.to || postData.to || 'luqmanf667@gmail.com';
      var nama = params.nama || postData.nama || 'M. Luqman Firdaus';
      var npm = params.npm || postData.npm || '1411230105';
      var status = params.status || postData.status || 'Lolos Asisten Lab 2027';
      var note = params.note || postData.note || '';
      var result = sendTestLolosEmail(to, nama, npm, status, note);
      return ContentService.createTextOutput(JSON.stringify(result)).setMimeType(ContentService.MimeType.JSON);
    }
  } catch (err) {}
  return doGet(e);
}

/**
 * Mengirimkan email notifikasi uji coba status lolos seleksi ke alamat email tujuan.
 */
function sendTestLolosEmail(recipientEmail, targetNama, npm, statusType, customNote) {
  try {
    var email = String(recipientEmail || "luqmanf667@gmail.com").trim();
    if (!email || email.indexOf("@") === -1) {
      return { success: false, message: "Alamat email tidak valid: " + email };
    }
    
    var nama = String(targetNama || "M. Luqman Firdaus").trim();
    var nim = String(npm || "1411230105").trim();
    var st = String(statusType || "Lolos Asisten Lab 2027").trim();
    var note = customNote !== undefined && String(customNote).trim() !== ""
      ? String(customNote).trim()
      : "Ini adalah email konfirmasi resmi dari Sistem Informasi Rekrutmen Asisten Laboratorium Teknik Industri (IELA) Universitas PGRI Ronggolawe Tuban untuk periode kepengurusan 2027-2028.";

    var subject = "[PEMBERITAHUAN RESMI] Penetapan Hasil Seleksi Asisten Laboratorium IELA 2027/2028 - " + nama;
    var htmlBody = buildStatusEmailHtml(nama, nim, st, note);

    MailApp.sendEmail({
      to: email,
      subject: subject,
      htmlBody: htmlBody
    });

    return {
      success: true,
      message: "Email notifikasi '" + st + "' berhasil dikirim ke " + email,
      email: email,
      nama: nama,
      npm: nim,
      status: st
    };
  } catch (err) {
    return {
      success: false,
      message: "Gagal mengirim email: " + err.toString()
    };
  }
}

function include(filename) {
  return HtmlService.createHtmlOutputFromFile(filename).getContent();
}

function getSpreadsheet() {
  var ss;
  try {
    ss = SpreadsheetApp.getActiveSpreadsheet();
    if (ss) return ss;
  } catch (e) {}

  var files = DriveApp.getFilesByName("IELA_Recruitment_Database_2026");
  var bestFile = null;
  var maxSize = -1;
  
  while (files.hasNext()) {
    var file = files.next();
    var size = file.getSize();
    if (size > maxSize) {
      maxSize = size;
      bestFile = file;
    }
  }

  if (bestFile) {
    return SpreadsheetApp.open(bestFile);
  } else {
    if (typeof setupDatabase === 'function') setupDatabase();
    var filesNew = DriveApp.getFilesByName("IELA_Recruitment_Database_2026");
    if (filesNew.hasNext()) return SpreadsheetApp.open(filesNew.next());
  }
  return null;
}

function getCachedData(key, ttlSeconds) {
  try {
    var cache = CacheService.getScriptCache();
    var cached = cache.get(key);
    if (cached) return JSON.parse(cached);
  } catch (e) {}
  return null;
}

function invalidateCache(key) {
  try {
    CacheService.getScriptCache().remove("INITIAL_DATA_SECURE");
    CacheService.getScriptCache().remove("INITIAL_DATA");
    if (key) CacheService.getScriptCache().remove(key);
  } catch (e) {}
}

function tambahkanKolomNamaRekapPenilaian() {
  var ss = getSpreadsheet();
  if (!ss) throw new Error("Database spreadsheet tidak ditemukan.");

  var penilaianSheet = ss.getSheetByName("PENILAIAN_REKAP");
  var pendaftarSheet = ss.getSheetByName("PENDAFTAR");
  var usersSheet = ss.getSheetByName("USERS");
  if (!penilaianSheet || !pendaftarSheet || !usersSheet) {
    throw new Error("Sheet PENILAIAN_REKAP, PENDAFTAR, atau USERS tidak ditemukan.");
  }

  var penilaianLastRow = penilaianSheet.getLastRow();
  if (penilaianLastRow < 2) return "Tidak ada data penilaian untuk diperbarui.";

  var penilaianLastColumn = penilaianSheet.getLastColumn();
  var penilaianHeaders = penilaianSheet.getRange(1, 1, 1, penilaianLastColumn).getDisplayValues()[0];
  var pendaftarData = pendaftarSheet.getDataRange().getDisplayValues();
  var usersData = usersSheet.getDataRange().getDisplayValues();

  var pendaftarIdColumn = findHeaderColumnIndex(pendaftarData[0], ["Pendaftar_ID"], -1);
  var pendaftarNamaColumn = findHeaderColumnIndex(pendaftarData[0], ["Nama"], -1);
  var userIdColumn = findHeaderColumnIndex(usersData[0], ["User_ID"], -1);
  var userNamaColumn = findHeaderColumnIndex(usersData[0], ["Nama_Lengkap"], -1);
  var penilaianPendaftarColumn = findHeaderColumnIndex(penilaianHeaders, ["Pendaftar_ID"], -1);
  var penilaianUserColumn = findHeaderColumnIndex(penilaianHeaders, ["User_ID_Penilai"], -1);

  if ([pendaftarIdColumn, pendaftarNamaColumn, userIdColumn, userNamaColumn, penilaianPendaftarColumn, penilaianUserColumn].some(function(index) {
    return index < 0;
  })) {
    throw new Error("Header ID atau nama yang diperlukan tidak ditemukan.");
  }

  var pendaftarNames = {};
  for (var p = 1; p < pendaftarData.length; p++) {
    var pendaftarId = String(pendaftarData[p][pendaftarIdColumn] || "").trim();
    var pendaftarNama = String(pendaftarData[p][pendaftarNamaColumn] || "").trim();
    if (pendaftarId && pendaftarNama) pendaftarNames[pendaftarId] = pendaftarNama;
  }

  var userNames = {};
  for (var u = 1; u < usersData.length; u++) {
    var userId = String(usersData[u][userIdColumn] || "").trim();
    var userNama = String(usersData[u][userNamaColumn] || "").trim();
    if (userId && userNama) userNames[userId] = userNama;
  }

  var penilaianData = penilaianSheet.getRange(2, 1, penilaianLastRow - 1, penilaianLastColumn).getDisplayValues();
  var unresolvedPendaftar = {};
  var unresolvedUsers = {};
  for (var r = 0; r < penilaianData.length; r++) {
    var rowPendaftarId = String(penilaianData[r][penilaianPendaftarColumn] || "").trim();
    var rowUserId = String(penilaianData[r][penilaianUserColumn] || "").trim();
    if (rowPendaftarId && !pendaftarNames[rowPendaftarId]) unresolvedPendaftar[rowPendaftarId] = true;
    if (rowUserId && !userNames[rowUserId]) unresolvedUsers[rowUserId] = true;
  }

  var missingIds = Object.keys(unresolvedPendaftar).concat(Object.keys(unresolvedUsers));
  if (missingIds.length) {
    throw new Error("Nama tidak ditemukan untuk ID berikut; spreadsheet tidak diubah: " + missingIds.join(", "));
  }

  var namaPendaftarColumn = findHeaderColumnIndex(penilaianHeaders, ["Nama_Pendaftar"], -1);
  var namaPenilaiColumn = findHeaderColumnIndex(penilaianHeaders, ["Nama_Penilai"], -1);
  var columnsToAdd = [];
  if (namaPendaftarColumn < 0) columnsToAdd.push({ header: "Nama_Pendaftar", key: "pendaftar" });
  if (namaPenilaiColumn < 0) columnsToAdd.push({ header: "Nama_Penilai", key: "penilai" });

  if (columnsToAdd.length) {
    penilaianSheet.insertColumnsAfter(penilaianLastColumn, columnsToAdd.length);
    for (var c = 0; c < columnsToAdd.length; c++) {
      var newColumn = penilaianLastColumn + c + 1;
      penilaianSheet.getRange(1, newColumn).setValue(columnsToAdd[c].header);
      if (columnsToAdd[c].key === "pendaftar") namaPendaftarColumn = newColumn - 1;
      if (columnsToAdd[c].key === "penilai") namaPenilaiColumn = newColumn - 1;
    }
  }

  var namaPendaftarValues = [];
  var namaPenilaiValues = [];
  for (var i = 0; i < penilaianData.length; i++) {
    var applicantId = String(penilaianData[i][penilaianPendaftarColumn] || "").trim();
    var evaluatorId = String(penilaianData[i][penilaianUserColumn] || "").trim();
    namaPendaftarValues.push([applicantId ? pendaftarNames[applicantId] : ""]);
    namaPenilaiValues.push([evaluatorId ? userNames[evaluatorId] : ""]);
  }

  penilaianSheet.getRange(2, namaPendaftarColumn + 1, namaPendaftarValues.length, 1).setValues(namaPendaftarValues);
  penilaianSheet.getRange(2, namaPenilaiColumn + 1, namaPenilaiValues.length, 1).setValues(namaPenilaiValues);

  return "Kolom Nama_Pendaftar dan Nama_Penilai berhasil diisi untuk " + penilaianData.length + " baris. Kolom ID tetap dipertahankan.";
}

/**
 * Generate secure SHA-256 hash for passwords.
 * @param {string} str
 * @return {string}
 */
function hashPassword(str) {
  if (!str) return "";
  var rawHash = Utilities.computeDigest(Utilities.DigestAlgorithm.SHA_256, String(str), Utilities.Charset.UTF_8);
  var txtHash = "";
  for (var i = 0; i < rawHash.length; i++) {
    var hashVal = rawHash[i];
    if (hashVal < 0) hashVal += 256;
    var byteString = hashVal.toString(16);
    if (byteString.length == 1) byteString = "0" + byteString;
    txtHash += byteString;
  }
  return txtHash;
}

/**
 * Fetch all initial database sheets or return cached data.
 * @param {boolean} forceRefresh
 */
function getInitialData(forceRefresh) {
  try {
    if (!forceRefresh) {
      var cached = getCachedData("INITIAL_DATA_SECURE", 60);
      if (cached) return { success: true, data: cached };
    }

    var ss = getSpreadsheet();
    if (!ss) return { success: false, message: "Spreadsheet database tidak ditemukan!" };

    // Otomatis pastikan tab sheet LOLOS_BERKAS dan CALON_IELA terbuat di spreadsheet
    initSelectionSheets(ss);

    var sheetNames = ["USERS", "PROFIL_KONTEN", "GALERI_KEGIATAN", "PENDAFTAR", "PENILAIAN_REKAP", "SELEKSI_LOG", "PENGUMUMAN", "PENGATURAN", "PUBLIKASI"];
    var result = {};

    sheetNames.forEach(function(sName) {
      var sheet = ss.getSheetByName(sName);
      if (!sheet) {
        result[sName] = [];
        return;
      }
      var vals = sheet.getDataRange().getDisplayValues();
      if (vals.length < 2) {
        result[sName] = [];
        return;
      }
      var headers = vals[0];
      var rows = [];
      for (var i = 1; i < vals.length; i++) {
        var rowObj = {};
        for (var j = 0; j < headers.length; j++) {
          var hName = String(headers[j]).trim();
          var hLower = hName.toLowerCase();
          // KEAMANAN KRITIS: Kolom Password dan Email di USERS tidak pernah dikirim ke frontend publik!
          if (sName === "USERS" && (hLower === "password" || hLower === "email")) {
            continue;
          }
          rowObj[hName] = vals[i][j];
        }
        rows.push(rowObj);
      }

      if (sName === "GALERI_KEGIATAN") {
        var idxTgl = headers.indexOf("Tanggal_Kegiatan");
        if (idxTgl === -1) idxTgl = headers.indexOf("Tanggal");
        var idxFoto = headers.indexOf("URL_Foto");

        for (var i = 1; i < vals.length; i++) {
          var tVal = idxTgl !== -1 ? vals[i][idxTgl] : "";
          var fVal = idxFoto !== -1 ? vals[i][idxFoto] : "";

          if (tVal && (String(tVal).indexOf("http") === 0 || String(tVal).indexOf("drive.google") !== -1)) {
            var correctFoto = tVal;
            var correctTgl = (fVal && String(fVal).indexOf("http") === -1) ? fVal : Utilities.formatDate(new Date(), Session.getScriptTimeZone(), 'yyyy-MM-dd');

            if (rows[i - 1]) {
              if (idxTgl !== -1) rows[i - 1][headers[idxTgl]] = correctTgl;
              if (idxFoto !== -1) rows[i - 1][headers[idxFoto]] = correctFoto;
              rows[i - 1].Tanggal = correctTgl;
            }

            try {
              if (idxTgl !== -1 && idxFoto !== -1) {
                sheet.getRange(i + 1, idxTgl + 1).setValue(correctTgl);
                sheet.getRange(i + 1, idxFoto + 1).setValue(correctFoto);
              }
            } catch (sheetFixErr) {}
          }
        }
      }

      result[sName] = rows;
    });

    try {
      CacheService.getScriptCache().put("INITIAL_DATA_SECURE", JSON.stringify(result), 60);
    } catch (e) {}

    return { success: true, data: result };
  } catch (err) {
    return { success: false, message: err.toString() };
  }
}

function login(username, password) {
  try {
    var ss = getSpreadsheet();
    if (!ss) return { success: false, message: "Database tidak ditemukan!" };
    var sheet = ss.getSheetByName("USERS");
    if (!sheet) return { success: false, message: "Sheet USERS tidak ditemukan!" };

    var data = sheet.getDataRange().getDisplayValues();
    if (data.length < 2) return { success: false, message: "Belum ada pengguna terdaftar!" };

    var headers = data[0];
    var uCol = headers.indexOf("Username_NIM");
    var pCol = headers.indexOf("Password");
    var idCol = headers.indexOf("User_ID");
    var nameCol = headers.indexOf("Nama_Lengkap");
    var emailCol = headers.indexOf("Email");
    var roleCol = headers.indexOf("Role");
    var activeCol = headers.indexOf("Status_Aktif");
    var divCol = headers.indexOf("Bidang_Divisi");
    var jabCol = headers.indexOf("Jabatan_Divisi");
    var jabBidCol = headers.indexOf("Jabatan_Bidang");

    if (uCol === -1 || pCol === -1) {
      return { success: false, message: "Format kolom USERS tidak valid." };
    }

    var uClean = String(username).trim();
    var pClean = String(password).trim();
    var pHash = hashPassword(pClean);

    for (var i = 1; i < data.length; i++) {
      if (String(data[i][uCol]).trim() === uClean) {
        var dbPass = String(data[i][pCol]).trim();
        if (dbPass === pClean || dbPass === pHash) {
          // Jika masih berupa plaintext, otomatis enkripsi ke SHA-256 di spreadsheet secara seamless
          if (dbPass === pClean && dbPass !== pHash) {
            sheet.getRange(i + 1, pCol + 1).setValue(pHash);
          }
          var isActive = activeCol !== -1 ? String(data[i][activeCol]).toLowerCase() !== "false" : true;
          if (!isActive) {
            return { success: false, message: "Akun Anda dinonaktifkan oleh Admin!" };
          }
          return {
            success: true,
            user: {
              userId: idCol !== -1 ? data[i][idCol] : "",
              username: data[i][uCol],
              nama: nameCol !== -1 ? data[i][nameCol] : "",
              email: emailCol !== -1 ? data[i][emailCol] : "",
              role: roleCol !== -1 ? data[i][roleCol] : "Pendaftar",
              bidangDivisi: divCol !== -1 ? (data[i][divCol] || "-") : "-",
              jabatanDivisi: jabCol !== -1 ? (data[i][jabCol] || "Anggota Sub-Lab") : "Anggota Sub-Lab",
              jabatanBidang: jabBidCol !== -1 ? (data[i][jabBidCol] || "") : ""
            }
          };
        }
        return { success: false, message: "NPM / Username atau Password salah!" };
      }
    }
    return { success: false, message: "NPM / Username atau Password salah!" };
  } catch (err) {
    return { success: false, message: err.toString() };
  }
}

function changePassword(userId, oldPassword, newPassword) {
  try {
    var ss = getSpreadsheet();
    var sheet = ss.getSheetByName("USERS");
    var data = sheet.getDataRange().getValues();
    
    // Find header
    var headers = data[0];
    var idCol = headers.indexOf("User_ID");
    var passCol = headers.indexOf("Password");
    
    if (idCol === -1 || passCol === -1) {
      return { success: false, message: "Struktur kolom USERS tidak valid." };
    }
    
    var oldClean = String(oldPassword).trim();
    var oldHash = hashPassword(oldClean);
    var newHash = hashPassword(String(newPassword).trim());
    
    // Find user
    for (var i = 1; i < data.length; i++) {
      if (String(data[i][idCol]).trim() === String(userId).trim()) {
        var currentPass = String(data[i][passCol]).trim();
        if (currentPass === oldClean || currentPass === oldHash) {
          // Simpan password baru terenkripsi SHA-256
          sheet.getRange(i + 1, passCol + 1).setValue(newHash);
          invalidateCache("INITIAL_DATA");
          return { success: true, message: "Password berhasil diubah secara aman!" };
        } else {
          return { success: false, message: "Password lama tidak sesuai!" };
        }
      }
    }
    
    return { success: false, message: "User tidak ditemukan!" };
  } catch (err) {
    return { success: false, message: err.toString() };
  }
}

function savePengaturan(keyName, valueText) {
  try {
    var ss = getSpreadsheet();
    var sheet = ss.getSheetByName("PENGATURAN");
    if (!sheet) return { success: false, message: "Sheet PENGATURAN tidak ditemukan" };
    
    var data = sheet.getDataRange().getValues();
    var headers = data[0];
    var keyCol = headers.indexOf("Key_Name");
    var valCol = headers.indexOf("Value_Text");
    
    if (keyCol === -1 || valCol === -1) return { success: false, message: "Kolom PENGATURAN tidak valid" };
    
    var found = false;
    for (var i = 1; i < data.length; i++) {
      if (String(data[i][keyCol]).trim() === String(keyName).trim()) {
        sheet.getRange(i + 1, valCol + 1).setValue(valueText);
        found = true;
        break;
      }
    }
    
    if (!found) {
      var newId = "PRM-" + Math.floor(1000 + Math.random() * 9000);
      sheet.appendRow([newId, keyName, valueText]);
    }
    
    invalidateCache("INITIAL_DATA");
    return { success: true, message: "Pengaturan berhasil disimpan!" };
  } catch (err) {
    return { success: false, message: err.toString() };
  }
}

function savePengaturanMulti(items) {
  try {
    var ss = getSpreadsheet();
    var sheet = ss.getSheetByName("PENGATURAN");
    if (!sheet) return { success: false, message: "Sheet PENGATURAN tidak ditemukan" };
    
    var data = sheet.getDataRange().getValues();
    var headers = data[0];
    var keyCol = headers.indexOf("Key_Name");
    var valCol = headers.indexOf("Value_Text");
    
    if (keyCol === -1 || valCol === -1) return { success: false, message: "Kolom PENGATURAN tidak valid" };
    
    for (var k in items) {
      var keyName = String(k).trim();
      var valueText = String(items[k]);
      var found = false;
      for (var i = 1; i < data.length; i++) {
        if (String(data[i][keyCol]).trim() === keyName) {
          sheet.getRange(i + 1, valCol + 1).setValue(valueText);
          data[i][valCol] = valueText;
          found = true;
          break;
        }
      }
      if (!found) {
        var newId = "PRM-" + Math.floor(1000 + Math.random() * 9000);
        sheet.appendRow([newId, keyName, valueText]);
      }
    }
    
    invalidateCache("INITIAL_DATA");
    return { success: true, message: "Informasi kontak dan laboratorium berhasil diperbarui!" };
  } catch (err) {
    return { success: false, message: err.toString() };
  }
}

/**
 * Simpan pengaturan tampilan web (CMS) dari tab "Tampilan Web" di dashboard admin.
 * Berbeda dari savePengaturanMulti: key divalidasi, nilai dibersihkan dan dibatasi
 * panjangnya, ditulis sebagai teks murni (anti formula injection), dan seluruh
 * penulisan dikunci agar dua simpan bersamaan tidak saling menimpa.
 * Nilai kosong ("") berarti "pakai bawaan" di frontend.
 */
function saveCmsSettings(items) {
  var lock = LockService.getScriptLock();
  try {
    if (!items || typeof items !== "object") return { success: false, message: "Data pengaturan tidak valid." };
    lock.waitLock(15000);

    var ss = getSpreadsheet();
    var sheet = ss ? ss.getSheetByName("PENGATURAN") : null;
    if (!sheet) return { success: false, message: "Sheet PENGATURAN tidak ditemukan" };

    var data = sheet.getDataRange().getValues();
    var headers = data[0].map(function (h) { return String(h).trim(); });
    var idCol = headers.indexOf("Param_ID");
    var keyCol = headers.indexOf("Key_Name");
    var valCol = headers.indexOf("Value_Text");
    if (keyCol === -1 || valCol === -1) return { success: false, message: "Kolom PENGATURAN tidak valid" };

    var rowByKey = {};
    for (var i = 1; i < data.length; i++) {
      rowByKey[String(data[i][keyCol]).trim()] = i + 1;
    }

    var newRows = [];
    var updated = 0;
    var skipped = [];
    Object.keys(items).forEach(function (k) {
      var keyName = String(k).trim();
      if (!/^[A-Z][A-Z0-9_]{1,59}$/.test(keyName)) {
        skipped.push(keyName);
        return;
      }
      var val = String(items[k] === null || items[k] === undefined ? "" : items[k])
        .replace(/[\u0000-\u0008\u000B\u000C\u000E-\u001F]/g, "")
        .slice(0, 4000);

      if (rowByKey[keyName]) {
        sheet.getRange(rowByKey[keyName], valCol + 1).setNumberFormat("@").setValue(val);
        updated++;
      } else {
        var row = [];
        for (var c = 0; c < headers.length; c++) row.push("");
        if (idCol !== -1) row[idCol] = "PRM-" + Math.floor(1000 + Math.random() * 9000);
        row[keyCol] = keyName;
        row[valCol] = val;
        newRows.push(row);
      }
    });

    if (newRows.length > 0) {
      var startRow = sheet.getLastRow() + 1;
      var range = sheet.getRange(startRow, 1, newRows.length, headers.length);
      range.setNumberFormat("@");
      range.setValues(newRows);
    }

    invalidateCache("INITIAL_DATA");
    var total = updated + newRows.length;
    var msg = "Tampilan web berhasil disimpan (" + total + " pengaturan diperbarui).";
    if (skipped.length > 0) msg += " " + skipped.length + " key tidak valid dilewati.";
    return { success: true, message: msg, updated: updated, added: newRows.length, skipped: skipped };
  } catch (err) {
    return { success: false, message: err.toString() };
  } finally {
    try { lock.releaseLock(); } catch (e) {}
  }
}

/**
 * Helper internal: menyimpan pilihan baru (Role / Jabatan_Bidang) yang diketik Admin
 * ke sheet PENGATURAN agar otomatis muncul di daftar pilihan seterusnya.
 */
function appendCustomUserOption_(ss, keyName, rawVal, keteranganText) {
  var val = String(rawVal || "").trim();
  if (!val || val === "-") return [];
  var pSheet = ss.getSheetByName("PENGATURAN");
  if (!pSheet) return [val];

  var pData = pSheet.getDataRange().getValues();
  if (!pData || pData.length === 0) return [val];
  var pHeaders = pData[0].map(function (h) { return String(h).trim(); });
  var pIdCol = pHeaders.indexOf("Param_ID");
  var pKeyCol = pHeaders.indexOf("Key_Name");
  var pValCol = pHeaders.indexOf("Value_Text");
  var pKetCol = pHeaders.indexOf("Keterangan");
  if (pKeyCol === -1 || pValCol === -1) return [val];

  var foundRow = -1;
  var currentList = [];
  for (var i = 1; i < pData.length; i++) {
    if (String(pData[i][pKeyCol]).trim() === keyName) {
      foundRow = i + 1;
      var rawStored = String(pData[i][pValCol] || "").trim();
      if (rawStored) {
        try {
          var parsed = JSON.parse(rawStored);
          if (Array.isArray(parsed)) currentList = parsed;
        } catch (e) {
          currentList = rawStored.split("||").map(function (s) { return s.trim(); }).filter(Boolean);
        }
      }
      break;
    }
  }

  var exists = currentList.some(function (item) {
    return String(item || "").trim().toLowerCase() === val.toLowerCase();
  });
  if (!exists) {
    currentList.push(val);
    var serialized = JSON.stringify(currentList);
    if (foundRow !== -1) {
      pSheet.getRange(foundRow, pValCol + 1).setNumberFormat("@").setValue(serialized);
    } else {
      var newRow = [];
      for (var c = 0; c < pHeaders.length; c++) newRow.push("");
      if (pIdCol !== -1) newRow[pIdCol] = "PRM-" + Math.floor(1000 + Math.random() * 9000);
      newRow[pKeyCol] = keyName;
      newRow[pValCol] = serialized;
      if (pKetCol !== -1 && keteranganText) newRow[pKetCol] = keteranganText;
      var nextRow = pSheet.getLastRow() + 1;
      pSheet.getRange(nextRow, 1, 1, pHeaders.length).setNumberFormat("@").setValues([newRow]);
    }
  }
  return currentList;
}

/**
 * Tambah atau perbarui pengguna dari menu Manajemen User Admin.
 * Mendukung ubah cepat Role / Jabatan_Bidang / Status maupun form lengkap Tambah & Edit User.
 */
function saveOrUpdateUser(payload) {
  var lock = LockService.getScriptLock();
  try {
    if (!payload || typeof payload !== "object") {
      return { success: false, message: "Data pengguna tidak valid." };
    }
    lock.waitLock(15000);

    var ss = getSpreadsheet();
    if (!ss) return { success: false, message: "Database spreadsheet tidak ditemukan." };
    var sheet = ss.getSheetByName("USERS");
    if (!sheet) return { success: false, message: "Sheet USERS tidak ditemukan." };

    var data = sheet.getDataRange().getDisplayValues();
    var headers = data[0].map(function (h) { return String(h).trim(); });

    function ensureCol(colName) {
      var idx = headers.indexOf(colName);
      if (idx === -1) {
        idx = headers.length;
        headers.push(colName);
        sheet.getRange(1, idx + 1)
          .setValue(colName)
          .setFontWeight("bold")
          .setBackground("#1E293B")
          .setFontColor("#F8FAFC");
      }
      return idx;
    }

    var idCol = ensureCol("User_ID");
    var uCol = ensureCol("Username_NIM");
    var pCol = ensureCol("Password");
    var nameCol = ensureCol("Nama_Lengkap");
    var emailCol = ensureCol("Email");
    var roleCol = ensureCol("Role");
    var activeCol = ensureCol("Status_Aktif");
    var divCol = ensureCol("Bidang_Divisi");
    var jabCol = ensureCol("Jabatan_Divisi");
    var jabBidCol = ensureCol("Jabatan_Bidang");

    var targetRow = -1;
    var reqId = String(payload.userId || "").trim();
    if (reqId) {
      for (var i = 1; i < data.length; i++) {
        if (String(data[i][idCol] || "").trim() === reqId) {
          targetRow = i + 1;
          break;
        }
      }
      if (targetRow === -1) {
        return { success: false, message: "Pengguna dengan ID " + reqId + " tidak ditemukan." };
      }
    }

    var existingRow = targetRow !== -1 ? data[targetRow - 1] : [];
    var getExisting = function (colIdx, fallback) {
      return (targetRow !== -1 && colIdx < existingRow.length) ? String(existingRow[colIdx] || "") : (fallback || "");
    };

    var finalUserId = targetRow !== -1 ? getExisting(idCol, reqId) : ("USR-" + Math.floor(1000 + Math.random() * 9000));
    var finalUsername = payload.username !== undefined ? String(payload.username).trim().slice(0, 100) : getExisting(uCol, "");
    var finalNama = payload.nama !== undefined ? String(payload.nama).trim().slice(0, 150) : getExisting(nameCol, "");
    var finalEmail = payload.email !== undefined ? String(payload.email).trim().slice(0, 150) : getExisting(emailCol, "");
    var finalRole = payload.role !== undefined ? String(payload.role).trim().slice(0, 80) : getExisting(roleCol, "Anggota");
    var finalActive = payload.statusAktif !== undefined
      ? (String(payload.statusAktif).toLowerCase() !== "false" && Boolean(payload.statusAktif))
      : (String(getExisting(activeCol, "true")).toLowerCase() !== "false");

    if (!finalUsername || !finalNama) {
      return { success: false, message: "NPM / Username dan Nama Lengkap wajib diisi." };
    }
    if (!finalRole) finalRole = "Anggota";

    if (targetRow !== -1 && String(getExisting(uCol, "")).toLowerCase() === "admin") {
      finalActive = true;
    }

    for (var r = 1; r < data.length; r++) {
      if ((r + 1) !== targetRow && String(data[r][uCol] || "").trim().toLowerCase() === finalUsername.toLowerCase()) {
        return { success: false, message: "NPM / Username '" + finalUsername + "' sudah digunakan oleh pengguna lain." };
      }
    }

    var finalDivisi = payload.bidangDivisi !== undefined ? String(payload.bidangDivisi).trim().slice(0, 120) : getExisting(divCol, "-");
    var finalJabatan = payload.jabatanDivisi !== undefined ? String(payload.jabatanDivisi).trim().slice(0, 120) : getExisting(jabCol, "-");
    var finalJabBid = payload.jabatanBidang !== undefined ? String(payload.jabatanBidang).trim().slice(0, 160) : getExisting(jabBidCol, "");

    if (payload.jabatanBidang !== undefined) {
      if (finalJabBid.indexOf("/") !== -1) {
        var parts = finalJabBid.split("/");
        var leftJab = String(parts[0] || "").trim();
        var rightBid = String(parts.slice(1).join("/") || "").trim();
        if (leftJab) finalJabatan = leftJab;
        if (rightBid) finalDivisi = rightBid;
      } else if (finalJabBid) {
        finalJabatan = finalJabBid;
      }
    }

    var rawNewPass = payload.newPassword !== undefined ? String(payload.newPassword).trim() : "";
    var finalPass = "";
    if (targetRow !== -1) {
      var rawPassSheet = sheet.getRange(targetRow, pCol + 1).getDisplayValue();
      finalPass = rawNewPass ? hashPassword(rawNewPass) : rawPassSheet;
    } else {
      finalPass = hashPassword(rawNewPass || "das12345");
      if (!finalEmail) finalEmail = "mhs" + finalUsername + "@student.unirow.ac.id";
    }

    var outRow = [];
    for (var c = 0; c < headers.length; c++) {
      outRow.push(targetRow !== -1 && c < existingRow.length ? existingRow[c] : "");
    }
    outRow[idCol] = finalUserId;
    outRow[uCol] = finalUsername;
    outRow[pCol] = finalPass;
    outRow[nameCol] = finalNama;
    outRow[emailCol] = finalEmail;
    outRow[roleCol] = finalRole;
    outRow[activeCol] = finalActive ? "TRUE" : "FALSE";
    outRow[divCol] = finalDivisi || "-";
    outRow[jabCol] = finalJabatan || "-";
    outRow[jabBidCol] = finalJabBid;

    var writeRowIdx = targetRow !== -1 ? targetRow : (sheet.getLastRow() + 1);
    var writeRange = sheet.getRange(writeRowIdx, 1, 1, headers.length);
    writeRange.setNumberFormat("@");
    writeRange.setValues([outRow]);

    var roleOpts = appendCustomUserOption_(ss, "USER_ROLE_OPTIONS", finalRole, "Daftar opsi Role kustom pada Manajemen User.");
    var jbOpts = appendCustomUserOption_(ss, "USER_JABATAN_BIDANG_OPTIONS", finalJabBid, "Daftar opsi Jabatan/Bidang kustom pada Manajemen User.");

    invalidateCache("INITIAL_DATA");

    return {
      success: true,
      message: targetRow !== -1 ? ("Data pengguna " + finalNama + " berhasil diperbarui.") : ("Pengguna baru " + finalNama + " berhasil ditambahkan."),
      user: {
        User_ID: finalUserId,
        Username_NIM: finalUsername,
        Nama_Lengkap: finalNama,
        Role: finalRole,
        Status_Aktif: finalActive,
        Bidang_Divisi: finalDivisi || "-",
        Jabatan_Divisi: finalJabatan || "-",
        Jabatan_Bidang: finalJabBid
      },
      roleOptions: roleOpts,
      jabatanBidangOptions: jbOpts
    };
  } catch (err) {
    return { success: false, message: "Gagal menyimpan pengguna: " + err.toString() };
  } finally {
    try { lock.releaseLock(); } catch (e) {}
  }
}

/**
 * Hapus akun pengguna dari sheet USERS melalui Manajemen User Admin.
 */
function deleteUserAccount(userId) {
  var lock = LockService.getScriptLock();
  try {
    var cleanId = String(userId || "").trim();
    if (!cleanId) return { success: false, message: "User ID tidak valid." };
    lock.waitLock(15000);

    var ss = getSpreadsheet();
    if (!ss) return { success: false, message: "Database spreadsheet tidak ditemukan." };
    var sheet = ss.getSheetByName("USERS");
    if (!sheet) return { success: false, message: "Sheet USERS tidak ditemukan." };

    var data = sheet.getDataRange().getDisplayValues();
    var headers = data[0].map(function (h) { return String(h).trim(); });
    var idCol = headers.indexOf("User_ID");
    var uCol = headers.indexOf("Username_NIM");
    var nameCol = headers.indexOf("Nama_Lengkap");
    if (idCol === -1) return { success: false, message: "Kolom User_ID tidak ditemukan." };

    for (var i = 1; i < data.length; i++) {
      if (String(data[i][idCol] || "").trim() === cleanId) {
        var uname = uCol !== -1 ? String(data[i][uCol] || "").trim().toLowerCase() : "";
        if (uname === "admin") {
          return { success: false, message: "Akun Administrator Utama tidak boleh dihapus." };
        }
        var deletedName = nameCol !== -1 ? data[i][nameCol] : cleanId;
        sheet.deleteRow(i + 1);
        invalidateCache("INITIAL_DATA");
        return { success: true, message: "Pengguna " + deletedName + " berhasil dihapus." };
      }
    }
    return { success: false, message: "Pengguna tidak ditemukan." };
  } catch (err) {
    return { success: false, message: "Gagal menghapus pengguna: " + err.toString() };
  } finally {
    try { lock.releaseLock(); } catch (e) {}
  }
}

function registerPendaftar(payload) {
  try {
    var ss = getSpreadsheet();

    // Validasi status pendaftaran
    var setSheet = ss.getSheetByName("PENGATURAN");
    if (setSheet) {
      var sData = setSheet.getDataRange().getValues();
      for (var s = 1; s < sData.length; s++) {
        if (String(sData[s][1]).trim() === "STATUS_PENDAFTARAN") {
          var statusVal = String(sData[s][2]).trim().toUpperCase();
          if (statusVal === "TUTUP") {
            return {
              success: false,
              message: "Mohon maaf, pendaftaran calon asisten saat ini sedang DITUTUP."
            };
          }
          break;
        }
      }
    }

    var uSheet = ss.getSheetByName("USERS");
    var pSheet = ss.getSheetByName("PENDAFTAR");

    var users = uSheet.getDataRange().getDisplayValues();
    for (var i = 1; i < users.length; i++) {
      if (String(users[i][1]).trim() === String(payload.npm).trim()) {
        return { success: false, message: "NPM sudah terdaftar! Silakan login." };
      }
    }

    var uId = "USR-" + Math.floor(1000 + Math.random() * 9000);
    var pId = "PDF-" + Math.floor(1000 + Math.random() * 9000);
    var hashedPass = hashPassword(payload.password);

    var newUserData = [uId, payload.npm, hashedPass, payload.nama, payload.email, "Pendaftar", true, "Praktikan / Calon Asisten", "Pendaftar"];
    var newPendaftarData = [
      pId, uId, payload.npm, payload.nama, payload.nama.split(" ")[0], "Laki-laki", "Tuban, 01 Jan 2005",
      "-", "-", "-", "-", "-", "-", 3, "Teknik Industri Unirow", 3.00, "1. Fisika", "2. Ergonomi",
      "-", "-", "-", "-", "-", "-", 
      "#", "#", "#", "#", "#", 
      "Draft", "QR-IELA-" + payload.npm, 
      "#"
    ];

    uSheet.appendRow(newUserData);
    pSheet.appendRow(newPendaftarData);

    invalidateCache("INITIAL_DATA");

    return {
      success: true,
      message: "Registrasi NPM " + payload.npm + " berhasil! Silakan login.",
      userObj: { User_ID: uId, Username_NIM: payload.npm, Nama_Lengkap: payload.nama, Email: payload.email, Role: "Pendaftar", Status_Aktif: true, Bidang_Divisi: "Praktikan / Calon Asisten", Jabatan_Divisi: "Pendaftar" },
      pendaftarObj: { Pendaftar_ID: pId, User_ID: uId, NIM: payload.npm, Nama: payload.nama, Status_Pendaftaran: "Draft", IPK: "3.00", Bidang_Pilihan_1: "1. Fisika" }
    };
  } catch (err) {
    return { success: false, message: err.toString() };
  }
}

function importUsersBatch(usersArray) {
  try {
    var ss = getSpreadsheet();
    var sheet = ss.getSheetByName("USERS");
    if (!sheet) return { success: false, message: "Sheet USERS tidak ditemukan!" };

    var data = sheet.getDataRange().getDisplayValues();
    var existingUsersMap = {};

    for (var i = 1; i < data.length; i++) {
      var username = String(data[i][1]).trim();
      if (username) existingUsersMap[username] = i + 1;
    }

    var updatedCount = 0;
    var insertedCount = 0;

    usersArray.forEach(function(u) {
      var npm = String(u.npm || u.Username_NIM || u.username || '').trim();
      if (!npm) return;

      var nama = u.nama || u.Nama_Lengkap || npm;
      var email = u.email || u.Email || (npm + "@student.unirow.ac.id");
      var role = u.role || u.Role || "Anggota";
      var password = u.password || u.Password || "das12345";
      var hashedPass = hashPassword(password);
      var bidang = u.bidang || u.Bidang_Divisi || "-";
      var jabatan = u.jabatan || u.Jabatan_Divisi || "Anggota Sub-Lab";

      if (existingUsersMap[npm]) {
        var rowIdx = existingUsersMap[npm];
        sheet.getRange(rowIdx, 4, 1, 6).setValues([[
          nama, email, role, true, bidang, jabatan
        ]]);
        updatedCount++;
      } else {
        var uId = "USR-" + Math.floor(1000 + Math.random() * 9000);
        sheet.appendRow([uId, npm, hashedPass, nama, email, role, true, bidang, jabatan]);
        insertedCount++;
      }
    });

    invalidateCache("INITIAL_DATA");

    return {
      success: true,
      message: "Import Berhasil! " + insertedCount + " anggota baru ditambahkan, " + updatedCount + " diperbarui."
    };
  } catch (err) {
    return { success: false, message: err.toString() };
  }
}

function submitFormPendaftaran(payload) {
  try {
    var ss = getSpreadsheet();
    var pSheet = ss.getSheetByName("PENDAFTAR");
    var data = pSheet.getDataRange().getDisplayValues();

    var headers = data[0];
    var colStatusIdx = findHeaderColumnIndex(headers, ["Status_Pendaftaran", "Status", "StatusPendaftaran"], 29);
    var colPIdIdx = findHeaderColumnIndex(headers, ["Pendaftar_ID", "ID_Pendaftar", "ID"], 0);
    var colNimIdx = findHeaderColumnIndex(headers, ["NIM", "Username_NIM", "NPM"], 2);

    var cleanPayloadNpm = String(payload.NIM || "").replace(/[^0-9]/g, "");
    var cleanPayloadPId = String(payload.Pendaftar_ID || "").trim().toLowerCase();

    // 1. CEK APAKAH STATUS PENDAFTARAN SEDANG DITUTUP
    var regStatus = "BUKA";
    var settSheet = ss.getSheetByName("PENGATURAN");
    if (settSheet) {
      var sData = settSheet.getDataRange().getDisplayValues();
      for (var s = 1; s < sData.length; s++) {
        if (String(sData[s][1]).trim().toUpperCase() === "STATUS_PENDAFTARAN" && sData[s][2]) {
          regStatus = String(sData[s][2]).trim().toUpperCase();
          break;
        }
      }
    }

    if (regStatus === "TUTUP") {
      return { 
        success: false, 
        message: "Mohon maaf, periode pendaftaran telah resmi DITUTUP. Pengiriman formulir dan pengubahan berkas sudah tidak diperkenankan." 
      };
    }

    var targetRowIndex = -1;
    for (var i = 1; i < data.length; i++) {
      var rowPId = String(data[i][colPIdIdx] || "").trim().toLowerCase();
      var rowNim = String(data[i][colNimIdx] || "").replace(/[^0-9]/g, "");

      if ((cleanPayloadPId && cleanPayloadPId !== "undefined" && rowPId === cleanPayloadPId) ||
          (cleanPayloadNpm && rowNim === cleanPayloadNpm)) {
        targetRowIndex = i + 1;
        break;
      }

      if (cleanPayloadNpm && cleanPayloadNpm.length >= 6) {
        for (var c = 0; c < Math.min(data[i].length, 6); c++) {
          if (String(data[i][c]).replace(/[^0-9]/g, "") === cleanPayloadNpm) {
            targetRowIndex = i + 1;
            break;
          }
        }
        if (targetRowIndex !== -1) break;
      }
    }

    if (targetRowIndex === -1) return { success: false, message: "Data pendaftar dengan NPM " + payload.NIM + " tidak ditemukan!" };

    // 2. CEK APAKAH PESERTA SUDAH PERNAH SUBMIT
    var currentStatus = String(data[targetRowIndex - 1][colStatusIdx] || "Draft").trim().toLowerCase();
    if (currentStatus !== "draft" && currentStatus !== "") {
      return {
        success: false,
        message: "Formulir Anda sudah berstatus '" + data[targetRowIndex - 1][colStatusIdx] + "' dan telah dikunci permanen. Pengeditan tidak dapat dilakukan."
      };
    }

    var folderName = "[" + payload.NIM + "] - " + payload.Nama;
    var mainFolder;
    var folders = DriveApp.getFoldersByName("IELA_RECRUITMENT_2026_UPLOADS");
    if (folders.hasNext()) {
      mainFolder = folders.next();
    } else {
      mainFolder = DriveApp.createFolder("IELA_RECRUITMENT_2026_UPLOADS");
    }

    var subFolder;
    var subFolders = mainFolder.getFoldersByName(folderName);
    if (subFolders.hasNext()) {
      subFolder = subFolders.next();
    } else {
      subFolder = mainFolder.createFolder(folderName);
    }

    try {
      mainFolder.setSharing(DriveApp.Access.ANYONE_WITH_LINK, DriveApp.Permission.VIEW);
      subFolder.setSharing(DriveApp.Access.ANYONE_WITH_LINK, DriveApp.Permission.VIEW);
    } catch (shareErr) {}

    function saveBase64File(base64Str, prefixName) {
      if (!base64Str || base64Str === "#" || base64Str.length < 50) return null;
      try {
        var splitStr = base64Str.split(",");
        var contentType = splitStr[0].match(/:(.*?);/)[1];
        var decoded = Utilities.base64Decode(splitStr[1]);
        var blob = Utilities.newBlob(decoded, contentType, prefixName + "_" + payload.NIM);
        var file = subFolder.createFile(blob);
        file.setSharing(DriveApp.Access.ANYONE_WITH_LINK, DriveApp.Permission.VIEW);
        return file.getUrl();
      } catch (e) {
        return null;
      }
    }

    var urlFoto = saveBase64File(payload.File_Foto_Base64, "FOTO") || data[targetRowIndex - 1][24];
    var urlKHS = saveBase64File(payload.File_KHS_Base64, "KHS") || data[targetRowIndex - 1][25];
    var urlCV = saveBase64File(payload.File_CV_Base64, "CV") || data[targetRowIndex - 1][26];
    var urlSertifikat = saveBase64File(payload.File_Sertifikat_Base64, "SERTIFIKAT") || data[targetRowIndex - 1][27];
    var urlResume = saveBase64File(payload.File_Resume_Base64, "RESUME") || data[targetRowIndex - 1][28];
    var oldJurnal = (data[targetRowIndex - 1].length > 31) ? data[targetRowIndex - 1][31] : "#";
    var urlJurnal = saveBase64File(payload.File_Jurnal_Base64, "JURNAL_REFERENSI") || oldJurnal;

    var existingRow = data[targetRowIndex - 1];
    var updatedRow = [
      existingRow[0], existingRow[1], payload.NIM, payload.Nama,
      payload.Nama_Panggilan || existingRow[4], payload.Jenis_Kelamin || existingRow[5],
      payload.TTL || existingRow[6], payload.Alamat_Asal || existingRow[7],
      payload.Alamat_Sekarang || existingRow[8], payload.No_HP || existingRow[9],
      payload.Hobby || existingRow[10], payload.Cita_Cita || existingRow[11],
      payload.Motto_Hidup || existingRow[12], payload.Semester || existingRow[13],
      payload.Prodi || existingRow[14], payload.IPK || existingRow[15],
      payload.Bidang_Pilihan_1 || existingRow[16], payload.Bidang_Pilihan_2 || existingRow[17],
      payload.Keterampilan || existingRow[18], payload.Motivasi || existingRow[19],
      payload.Target_IELA || existingRow[20], payload.Riwayat_Organisasi || existingRow[21],
      payload.Pelatihan_Diikuti || existingRow[22], payload.Buku_Diresume || existingRow[23],
      urlFoto, urlKHS, urlCV, urlSertifikat, urlResume,
      "Submitted", existingRow[30] || ("QR-IELA-" + payload.NIM), 
      urlJurnal
    ];

    pSheet.getRange(targetRowIndex, 1, 1, updatedRow.length).setValues([updatedRow]);
    // Pastikan kolom Status_Pendaftaran secara eksplisit diisi "Submitted" di kolom header yang tepat
    pSheet.getRange(targetRowIndex, colStatusIdx + 1).setValue("Submitted");
    invalidateCache("INITIAL_DATA");

    // Otomatis kirim email notifikasi Submitted ke pendaftar
    var targetEmail = "";
    var uSheet = ss.getSheetByName("USERS");
    if (uSheet) {
      var uData = uSheet.getDataRange().getDisplayValues();
      var uHeaders = uData[0];
      var uNimIdx = findHeaderColumnIndex(uHeaders, ["Username_NIM", "NIM", "NPM"], 1);
      var uEmailIdx = findHeaderColumnIndex(uHeaders, ["Email", "Email_Address"], 4);
      for (var j = 1; j < uData.length; j++) {
        var uNim = String(uData[j][uNimIdx] || "").replace(/[^0-9]/g, "");
        if (cleanPayloadNpm && uNim === cleanPayloadNpm) {
          targetEmail = uData[j][uEmailIdx];
          break;
        } else if (String(uData[j][0]).trim() === String(existingRow[1]).trim()) {
          targetEmail = uData[j][uEmailIdx];
          break;
        }
      }
    }

    var emailSentMsg = "";
    if (targetEmail && targetEmail.indexOf("@") !== -1) {
      try {
        var subject = "[IELA UNIROW] Update Status Seleksi Asisten Lab 2027-2028 - Submitted";
        var htmlBody = buildStatusEmailHtml(payload.Nama, payload.NIM, "Submitted", "Formulir pendaftaran dan berkas lampiran Anda telah berhasil disubmit.");
        MailApp.sendEmail({
          to: targetEmail,
          subject: subject,
          htmlBody: htmlBody
        });
        emailSentMsg = " Email konfirmasi telah dikirim ke " + targetEmail;
      } catch (mailErr) {
        Logger.log("Gagal kirim email submit: " + mailErr.toString());
      }
    }

    var updatedPendaftarObj = {
      Pendaftar_ID: existingRow[0], User_ID: existingRow[1], NIM: payload.NIM, Nama: payload.Nama,
      Nama_Panggilan: payload.Nama_Panggilan || existingRow[4], Jenis_Kelamin: payload.Jenis_Kelamin || existingRow[5],
      TTL: payload.TTL || existingRow[6], Alamat_Asal: payload.Alamat_Asal || existingRow[7],
      Alamat_Sekarang: payload.Alamat_Sekarang || existingRow[8], No_HP: payload.No_HP || existingRow[9],
      Hobby: payload.Hobby || existingRow[10], Cita_Cita: payload.Cita_Cita || existingRow[11],
      Motto_Hidup: payload.Motto_Hidup || existingRow[12], Semester: payload.Semester || existingRow[13],
      Prodi: payload.Prodi || existingRow[14], IPK: payload.IPK || existingRow[15],
      Bidang_Pilihan_1: payload.Bidang_Pilihan_1 || existingRow[16], Bidang_Pilihan_2: payload.Bidang_Pilihan_2 || existingRow[17],
      Keterampilan: payload.Keterampilan || existingRow[18], Motivasi: payload.Motivasi || existingRow[19],
      Target_IELA: payload.Target_IELA || existingRow[20], Riwayat_Organisasi: payload.Riwayat_Organisasi || existingRow[21],
      Pelatihan_Diikuti: payload.Pelatihan_Diikuti || existingRow[22], Buku_Diresume: payload.Buku_Diresume || existingRow[23],
      URL_Foto: urlFoto, URL_KHS: urlKHS, URL_CV: urlCV, URL_Sertifikat: urlSertifikat, URL_Resume: urlResume,
      Status_Pendaftaran: "Submitted", QR_Code_ID: existingRow[30] || ("QR-IELA-" + payload.NIM),
      URL_Jurnal_Referensi: urlJurnal
    };

    return { 
      success: true, 
      message: "Formulir & Berkas Berhasil Tersimpan ke Drive!" + (emailSentMsg ? " (" + emailSentMsg + ")" : ""), 
      updatedPendaftar: updatedPendaftarObj 
    };
  } catch (err) {
    return { success: false, message: err.toString() };
  }
}

function savePenilaian(payload) {
  try {
    var ss = getSpreadsheet();
    var sheet = ss.getSheetByName("PENILAIAN_REKAP");
    if (!sheet) {
      sheet = ss.insertSheet("PENILAIAN_REKAP");
      sheet.appendRow(["Penilaian_ID", "Pendaftar_ID", "User_ID_Penilai", "Skor_Pengetahuan", "Skor_Keterampilan", "Skor_Kedisiplinan", "Skor_Attitude", "Nilai_Bobot_Total", "Catatan_Evaluasi", "Tanggal_Penilaian"]);
    }

    var id = "EVL-" + Math.floor(10000 + Math.random() * 90000);
    var total = (Number(payload.skorPengetahuan) * 0.25) + (Number(payload.skorKeterampilan) * 0.35) + (Number(payload.skorKedisiplinan) * 0.20) + (Number(payload.skorAttitude) * 0.20);
    total = Number(total.toFixed(2));
    var dateStr = Utilities.formatDate(new Date(), Session.getScriptTimeZone(), 'yyyy-MM-dd HH:mm');

    var data = sheet.getDataRange().getDisplayValues();
    var updated = false;

    for (var i = 1; i < data.length; i++) {
      if (String(data[i][1]).trim() === String(payload.pendaftarId).trim() && String(data[i][2]).trim() === String(payload.userIdPenilai).trim()) {
        sheet.getRange(i + 1, 4, 1, 7).setValues([[
          payload.skorPengetahuan, payload.skorKeterampilan, payload.skorKedisiplinan, payload.skorAttitude, total, payload.catatan, dateStr
        ]]);
        updated = true;
        id = data[i][0];
        break;
      }
    }

    if (!updated) {
      sheet.appendRow([id, payload.pendaftarId, payload.userIdPenilai, payload.skorPengetahuan, payload.skorKeterampilan, payload.skorKedisiplinan, payload.skorAttitude, total, payload.catatan, dateStr]);
    }

    invalidateCache("INITIAL_DATA");

    return { 
      success: true, 
      message: "Penilaian Wawancara Berhasil Disimpan!",
      evalObj: { 
          Penilaian_ID: id, 
          Pendaftar_ID: payload.pendaftarId, 
          User_ID_Penilai: payload.userIdPenilai, 
          Skor_Pengetahuan: payload.skorPengetahuan, 
          Skor_Keterampilan: payload.skorKeterampilan,
          Skor_Kedisiplinan: payload.skorKedisiplinan, 
          Skor_Attitude: payload.skorAttitude, 
          Nilai_Bobot_Total: total, 
          Catatan_Evaluasi: payload.catatan, 
          Tanggal_Penilaian: dateStr 
      }
    };
  } catch (err) {
    return { success: false, message: err.toString() };
  }
}

function buildStatusEmailHtml(targetNama, npm, status, customNote) {
  var sLower = String(status || "").toLowerCase();
  var today = new Date();
  var months = ["Januari", "Februari", "Maret", "April", "Mei", "Juni", "Juli", "Agustus", "September", "Oktober", "November", "Desember"];
  var dateStr = today.getDate() + " " + months[today.getMonth()] + " " + today.getFullYear();
  var refYear = today.getFullYear();

  var isLolosFinal = sLower.includes("lolos asisten") || sLower.includes("lolos lab") || sLower.includes("diterima") || sLower.includes("lolos iela") || sLower.includes("iela") || sLower === "lolos";
  var isLolosBerkas = sLower.includes("lolos seleksi berkas") || sLower.includes("lolos berkas");
  var isTidakLolos = sLower.includes("tidak lolos") || sLower.includes("gagal") || sLower.includes("ditolak");
  var isWawancara = sLower.includes("wawancara");
  var isSubmitted = sLower.includes("submitted");

  var config = {
    refNumber: "B/042/IELA-UNIROW/SELEKSI/" + refYear,
    perihal: "Pemberitahuan Penetapan Hasil Seleksi Asisten Laboratorium Periode 2027/2028",
    color: "#10b981",
    accentBg: "rgba(16, 185, 129, 0.12)",
    badgeBorder: "#10b981",
    badgeText: "#34d399",
    categoryLabel: "SURAT KEPUTUSAN RESMI",
    statusTitle: "DINYATAKAN LOLOS SELEKSI (DITERIMA)",
    statusSubtitle: "Sebagai Asisten Laboratorium Teknik Industri (IELA) Periode Kepengurusan 2027/2028",
    openingText: "Sehubungan dengan telah dilaksanakannya seluruh rangkaian tahapan Seleksi Calon Asisten Laboratorium Teknik Industri (IELA) Universitas PGRI Ronggolawe Tuban tahun akademik 2027/2028, meliputi seleksi administrasi berkas, uji kompetensi, dan wawancara panelis, dengan ini Panitia Seleksi bersama Koordinator Laboratorium menetapkan bahwa:",
    instructions: [
      "Menghadiri agenda <strong>Pembekalan & First Gathering Asisten Laboratorium</strong> sesuai jadwal dan tata tertib yang diumumkan melalui portal resmi IELA.",
      "Mengikuti proses orientasi kerja, pengenalan inventaris instrumen, dan penempatan pembagian sub-laboratorium resmi.",
      "Melakukan konfirmasi kesediaan dan penandatanganan <strong>Pakta Integritas serta Surat Perjanjian Komitmen Asisten</strong>."
    ],
    closingText: "Demikian surat pemberitahuan penetapan ini kami sampaikan secara resmi untuk dapat dipergunakan sebagaimana mestinya. Atas perhatian, dedikasi, dan kerja sama Saudara/i, kami sampaikan terima kasih."
  };

  if (isTidakLolos) {
    config.perihal = "Pemberitahuan Hasil Seleksi Calon Asisten Laboratorium Periode 2027/2028";
    config.color = "#ef4444";
    config.accentBg = "rgba(239, 68, 68, 0.12)";
    config.badgeBorder = "#ef4444";
    config.badgeText = "#f87171";
    config.categoryLabel = "SURAT PEMBERITAHUAN RESMI";
    config.statusTitle = "BELUM MEMENUHI KUOTA KELULUSAN";
    config.statusSubtitle = "Calon Asisten Laboratorium Teknik Industri (IELA) Periode 2027/2028";
    config.openingText = "Sehubungan dengan telah diselesaikannya seluruh rangkaian tahapan Seleksi Calon Asisten Laboratorium Teknik Industri (IELA) Universitas PGRI Ronggolawe Tuban tahun akademik 2027/2028, Panitia Seleksi menyampaikan penghargaan dan terima kasih yang setinggi-tingginya atas partisipasi dan dedikasi yang Saudara/i tunjukkan.";
    config.instructions = [
      "Berdasarkan hasil rapat pleno pertimbangan dewan penguji dan keterbatasan kuota asisten pada periode ini, panitia memberitahukan bahwa Saudara/i <strong>belum dapat ditetapkan</strong> sebagai asisten laboratorium untuk kepengurusan 2027/2028.",
      "Keputusan panitia seleksi bersifat mutlak, independen, dan telah melalui proses penilaian objektif secara komprehensif.",
      "Saudara/i tetap dipersilakan untuk aktif berkontribusi dalam kegiatan praktikum, penelitian terpadu, dan berpartisipasi pada periode seleksi di masa mendatang."
    ];
  } else if (isLolosBerkas) {
    config.perihal = "Pemberitahuan Hasil Verifikasi Berkas Administrasi Seleksi Asisten IELA";
    config.color = "#06b6d4";
    config.accentBg = "rgba(6, 182, 212, 0.12)";
    config.badgeBorder = "#06b6d4";
    config.badgeText = "#22d3ee";
    config.categoryLabel = "HASIL VERIFIKASI ADMINISTRASI";
    config.statusTitle = "DINYATAKAN LOLOS SELEKSI BERKAS";
    config.statusSubtitle = "Berhak Melanjutkan ke Tahapan Uji Wawancara & Evaluasi Praktikum";
    config.openingText = "Berdasarkan hasil verifikasi dokumen persyaratan administrasi yang telah Saudara/i unggah melalui portal resmi IELA, Panitia Rekrutmen memberitahukan bahwa berkas Saudara/i telah memenuhi seluruh kriteria kelayakan formal.";
    config.instructions = [
      "Mempersiapkan resume jurnal dan dokumen pendukung sesuai bidang laboratorium yang dipilih.",
      "Memantau jadwal giliran sesi wawancara dan tata tertib pelaksanaan melalui portal resmi IELA.",
      "Hadir tepat waktu sesuai jadwal yang telah ditentukan dengan mengenakan pakaian formal rapi."
    ];
  } else if (isWawancara) {
    config.perihal = "Undangan Pelaksanaan Wawancara Seleksi Asisten Laboratorium IELA";
    config.color = "#8b5cf6";
    config.accentBg = "rgba(139, 92, 246, 0.12)";
    config.badgeBorder = "#8b5cf6";
    config.badgeText = "#a78bfa";
    config.categoryLabel = "UNDANGAN SELEKSI RESMI";
    config.statusTitle = "JADWAL WAWANCARA DITETAPKAN";
    config.statusSubtitle = "Tahap Uji Kompetensi & Wawancara Panel Asisten Laboratorium";
    config.openingText = "Melalui surat ini, Panitia Seleksi Calon Asisten Laboratorium Teknik Industri (IELA) Unirow mengundang Saudara/i untuk hadir mengikuti tahapan uji wawancara dan penilaian komparatif.";
    config.instructions = [
      "Memeriksa detail waktu, lokasi, dan panel penilai pada menu Antrean Wawancara portal IELA.",
      "Membawa berkas cetak portofolio atau resume jurnal yang telah ditentukan panitia.",
      "Konfirmasi kehadiran kepada sekretariat panitia seleksi laboratorium."
    ];
  } else if (isSubmitted) {
    config.perihal = "Tanda Terima Pendaftaran Seleksi Calon Asisten Laboratorium IELA";
    config.color = "#3b82f6";
    config.accentBg = "rgba(59, 130, 246, 0.12)";
    config.badgeBorder = "#3b82f6";
    config.badgeText = "#60a5fa";
    config.categoryLabel = "BUKTI PENDAFTARAN RESMI";
    config.statusTitle = "BERKAS PENDAFTARAN DITERIMA (SUBMITTED)";
    config.statusSubtitle = "Menunggu Proses Peninjauan & Verifikasi Dokumen oleh Panitia";
    config.openingText = "Sistem Informasi Rekrutmen Laboratorium IELA telah menerima pengajuan data formulir dan dokumen persyaratan pendaftaran calon asisten dari Saudara/i.";
    config.instructions = [
      "Dokumen pendaftaran saat ini sedang dalam proses verifikasi administratif oleh panitia.",
      "Pastikan nomor kontak WhatsApp aktif untuk menerima instruksi koordinasi berkas.",
      "Informasi pengumuman kelolosan berkas akan dipublikasikan secara serentak di portal resmi."
    ];
  }

  var instructionListHtml = config.instructions.map(function(item) {
    return "<li style='margin-bottom:8px; padding-left:4px;'>" + item + "</li>";
  }).join("");

  var noteHtml = "";
  if (customNote && String(customNote).trim().length > 0) {
    noteHtml = 
      "<div style='margin:20px 0; padding:14px 18px; background-color:#0b1120; border-left:4px solid #64748b; border-radius:6px; font-size:12px; color:#cbd5e1; line-height:1.6;'>" +
        "<strong style='color:#f8fafc; font-size:12px; display:block; margin-bottom:4px;'>Catatan Tambahan Panitia Seleksi:</strong>" +
        customNote +
      "</div>";
  }

  var html = "<!DOCTYPE html><html><head><meta charset='UTF-8'></head><body style='margin:0; padding:24px 12px; background-color:#070a12; font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif; color:#e2e8f0; line-height:1.5;'>" +
    "<div style='max-width:620px; margin:0 auto; background-color:#0f172a; border:1px solid #1e293b; border-radius:14px; overflow:hidden; box-shadow:0 20px 40px rgba(0,0,0,0.6);'>" +
    
    // Top colored indicator
    "<div style='height:4px; background:" + config.color + "; width:100%;'></div>" +

    // KOP RESMI LEMBAGA
    "<div style='padding:24px 28px 20px 28px; background-color:#090d16; border-bottom:2px solid #1e293b;'>" +
      "<table style='width:100%; border-collapse:collapse;'>" +
        "<tr>" +
          "<td style='vertical-align:middle; width:64px; padding-right:16px;'>" +
            "<img src='https://i.ibb.co/B5pjdF4v/Whats-App-Image-2026-09-30-at-18-36-50-1.jpg' alt='Logo IELA' width='54' height='54' style='display:block; width:54px; height:54px; object-fit:contain; border-radius:8px; background:#0f172a; padding:2px; border:1px solid #334155;' />" +
          "</td>" +
          "<td style='vertical-align:middle;'>" +
            "<div style='font-size:10px; font-weight:700; color:#94a3b8; text-transform:uppercase; letter-spacing:1px;'>Universitas PGRI Ronggolawe Tuban</div>" +
            "<div style='font-size:11px; font-weight:700; color:#cbd5e1; text-transform:uppercase; letter-spacing:0.5px;'>Fakultas Teknik &bull; Program Studi Teknik Industri</div>" +
            "<h1 style='margin:3px 0 0 0; font-size:15px; font-weight:900; color:#ffffff; letter-spacing:0.5px;'>LABORATORIUM TEKNIK INDUSTRI (IELA)</h1>" +
            "<div style='font-size:9.5px; color:#64748b; margin-top:3px;'>Gedung Lab Terpadu Lt. 2, Jl. Manunggal No. 61, Tuban &bull; Email: ielateknikindustri@gmail.com</div>" +
          "</td>" +
        "</tr>" +
      "</table>" +
    "</div>" +

    // METADATA SURAT RESMI
    "<div style='padding:16px 28px; background-color:#0d1322; border-bottom:1px solid #1e293b; font-size:11.5px; color:#94a3b8;'>" +
      "<table style='width:100%; border-collapse:collapse;'>" +
        "<tr>" +
          "<td style='width:70px; padding:2px 0; color:#64748b;'>Nomor</td>" +
          "<td style='width:12px; padding:2px 0;'>:</td>" +
          "<td style='padding:2px 0; font-family:monospace; color:#cbd5e1; font-weight:700;'>" + config.refNumber + "</td>" +
          "<td style='text-align:right; padding:2px 0; color:#94a3b8;'>" + dateStr + "</td>" +
        "</tr>" +
        "<tr>" +
          "<td style='padding:2px 0; color:#64748b;'>Lampiran</td>" +
          "<td style='padding:2px 0;'>:</td>" +
          "<td style='padding:2px 0; color:#cbd5e1;'>1 (Satu) Berkas Elektronik</td>" +
          "<td style='text-align:right; padding:2px 0;'><span style='display:inline-block; padding:2px 8px; border-radius:4px; font-size:9.5px; font-weight:800; background:" + config.accentBg + "; color:" + config.badgeText + "; border:1px solid " + config.badgeBorder + "; letter-spacing:0.5px;'>" + config.categoryLabel + "</span></td>" +
        "</tr>" +
        "<tr>" +
          "<td style='padding:2px 0; color:#64748b;'>Perihal</td>" +
          "<td style='padding:2px 0;'>:</td>" +
          "<td colspan='2' style='padding:2px 0; font-weight:700; color:#f1f5f9;'>" + config.perihal + "</td>" +
        "</tr>" +
      "</table>" +
    "</div>" +

    // ISI SURAT FORMAL
    "<div style='padding:28px 28px 20px 28px;'>" +
      
      // Tujuan Surat
      "<div style='margin-bottom:20px; font-size:13px; color:#cbd5e1; line-height:1.6;'>" +
        "Kepada Yth.<br>" +
        "<strong style='font-size:15px; color:#ffffff; letter-spacing:0.3px;'>" + targetNama + "</strong><br>" +
        "<span style='font-size:12px; color:#94a3b8;'>NIM / NPM : <strong style='color:#f8fafc; font-family:monospace;'>" + npm + "</strong></span><br>" +
        "<span style='font-size:12px; color:#94a3b8;'>Program Studi S1 Teknik Industri &ndash; Universitas PGRI Ronggolawe</span><br>" +
        "<span style='font-size:12px; color:#94a3b8;'>Di Tempat</span>" +
      "</div>" +

      // Salam Pembuka & Paragraf Pengantar
      "<p style='margin:0 0 12px 0; font-size:13px; color:#cbd5e1;'>Dengan hormat,</p>" +
      "<p style='margin:0 0 16px 0; font-size:12.5px; line-height:1.7; color:#cbd5e1; text-align:justify;'>" +
        config.openingText +
      "</p>" +

      // KOTAK STATUS KEPUTUSAN FORMAL
      "<div style='margin:20px 0; padding:18px 22px; background-color:#0b1120; border-left:5px solid " + config.color + "; border-radius:8px; border-top:1px solid #1e293b; border-right:1px solid #1e293b; border-bottom:1px solid #1e293b;'>" +
        "<div style='font-size:10px; font-weight:800; text-transform:uppercase; color:#64748b; letter-spacing:1px; margin-bottom:4px;'>Keputusan Panitia Seleksi:</div>" +
        "<div style='font-size:17px; font-weight:900; color:" + config.badgeText + "; letter-spacing:0.5px;'>" + config.statusTitle + "</div>" +
        "<div style='font-size:11.5px; color:#94a3b8; margin-top:3px;'>" + config.statusSubtitle + "</div>" +
      "</div>" +

      // INSTRUKSI / PETUNJUK TINDAK LANJUT
      "<p style='margin:16px 0 8px 0; font-size:12.5px; font-weight:700; color:#f1f5f9;'>Ketentuan dan Petunjuk Tindak Lanjut:</p>" +
      "<ol style='margin:0 0 18px 0; padding-left:20px; font-size:12.5px; line-height:1.7; color:#cbd5e1; text-align:justify;'>" +
        instructionListHtml +
      "</ol>" +

      noteHtml +

      // Kalimat Penutup
      "<p style='margin:20px 0 24px 0; font-size:12.5px; line-height:1.7; color:#cbd5e1; text-align:justify;'>" +
        config.closingText +
      "</p>" +

      // TANDA TANGAN & PENGESAHAN LEMBAGA
      "<table style='width:100%; border-collapse:collapse; margin-top:24px; padding-top:16px; border-top:1px solid #1e293b;'>" +
        "<tr>" +
          "<td style='width:50%;'></td>" +
          "<td style='width:50%; text-align:left; font-size:12px; color:#cbd5e1;'>" +
            "<div>Tuban, " + dateStr + "</div>" +
            "<div style='font-weight:700; color:#ffffff; margin-top:2px;'>Panitia Rekrutmen &amp; Seleksi Asisten</div>" +
            "<div style='color:#94a3b8;'>Laboratorium Teknik Industri (IELA)</div>" +
            "<div style='color:#94a3b8;'>Universitas PGRI Ronggolawe Tuban</div>" +
            "<div style='margin-top:24px; font-weight:800; color:#f8fafc; border-bottom:1px solid #334155; display:inline-block; padding-bottom:2px;'>Koordinator Laboratorium IELA</div>" +
            "<div style='font-size:10px; color:#64748b; margin-top:2px;'>NIDN / Kode Instruktur: IELA-UNIROW</div>" +
          "</td>" +
        "</tr>" +
      "</table>" +

    "</div>" +

    // FOOTER DINAS
    "<div style='padding:16px 28px; background-color:#070a12; border-top:1px solid #1e293b; font-size:10.5px; color:#64748b; line-height:1.5; text-align:center;'>" +
      "Surat pemberitahuan ini diterbitkan secara sah dan otomatis melalui <strong>Sistem Informasi Rekrutmen Laboratorium Teknik Industri (IELA) UNIROW Tuban</strong>." +
      "<div style='margin-top:4px; color:#475569;'>Dokumen elektronik ini tidak memerlukan tanda tangan basah fisik. Verifikasi keaslian dapat dilakukan melalui portal resmi IELA.</div>" +
    "</div>" +

    "</div></body></html>";

  return html;
}

function initSelectionSheets(ss) {
  try {
    if (!ss) ss = getSpreadsheet();
    if (!ss) return;

    var pSheet = ss.getSheetByName("PENDAFTAR");
    if (!pSheet) return;
    var pData = pSheet.getDataRange().getDisplayValues();
    if (pData.length < 1) return;

    var headers = pData[0];
    var colStatusIdx = findHeaderColumnIndex(headers, ["Status_Pendaftaran", "Status", "StatusPendaftaran"], 29);
    var colNimIdx = findHeaderColumnIndex(headers, ["NIM", "Username_NIM", "NPM"], 2);

    // 1. Pastikan tab LOLOS_BERKAS ada
    var berkasSheet = ss.getSheetByName("LOLOS_BERKAS");
    if (!berkasSheet) {
      berkasSheet = ss.insertSheet("LOLOS_BERKAS");
      berkasSheet.getRange(1, 1, 1, headers.length).setValues([headers]);
      berkasSheet.getRange(1, 1, 1, headers.length).setFontWeight("bold").setBackground("#0891B2").setFontColor("#FFFFFF");
      berkasSheet.setFrozenRows(1);
    }

    // 2. Pastikan tab CALON_IELA ada
    var ielaSheet = ss.getSheetByName("CALON_IELA");
    if (!ielaSheet) {
      ielaSheet = ss.insertSheet("CALON_IELA");
      ielaSheet.getRange(1, 1, 1, headers.length).setValues([headers]);
      ielaSheet.getRange(1, 1, 1, headers.length).setFontWeight("bold").setBackground("#059669").setFontColor("#FFFFFF");
      ielaSheet.setFrozenRows(1);
    }

    // 3. Pindai PENDAFTAR dan otomatis salin peserta yang sudah berstatus Lolos Berkas / Lolos IELA
    var bData = berkasSheet.getDataRange().getDisplayValues();
    var bNims = {};
    for (var bi = 1; bi < bData.length; bi++) {
      var bn = String(bData[bi][colNimIdx] || "").replace(/[^0-9]/g, "");
      if (bn) bNims[bn] = true;
    }

    var iData = ielaSheet.getDataRange().getDisplayValues();
    var iNims = {};
    for (var ii = 1; ii < iData.length; ii++) {
      var in_ = String(iData[ii][colNimIdx] || "").replace(/[^0-9]/g, "");
      if (in_) iNims[in_] = true;
    }

    for (var r = 1; r < pData.length; r++) {
      var row = pData[r];
      var nim = String(row[colNimIdx] || "").replace(/[^0-9]/g, "");
      var status = String(row[colStatusIdx] || "").toLowerCase().trim();

      if (status.includes("berkas") && !status.includes("tidak")) {
        if (!bNims[nim]) {
          berkasSheet.appendRow(row);
          bNims[nim] = true;
        }
      } else if ((status.includes("asisten") || status.includes("iela") || status.includes("lolos")) && !status.includes("tidak") && !status.includes("berkas")) {
        if (!iNims[nim]) {
          ielaSheet.appendRow(row);
          iNims[nim] = true;
        }
      }
    }
  } catch (err) {
    Logger.log("initSelectionSheets error: " + err.toString());
  }
}

function getOrInitSubSheet(ss, sheetName) {
  var sheet = ss.getSheetByName(sheetName);
  if (!sheet) {
    sheet = ss.insertSheet(sheetName);
    var pSheet = ss.getSheetByName("PENDAFTAR");
    if (pSheet && pSheet.getLastColumn() > 0) {
      var headers = pSheet.getRange(1, 1, 1, pSheet.getLastColumn()).getValues();
      sheet.getRange(1, 1, 1, headers[0].length).setValues(headers);
      sheet.getRange(1, 1, 1, headers[0].length).setFontWeight("bold");
      try {
        sheet.getRange(1, 1, 1, headers[0].length).setBackground("#1e293b").setFontColor("#f8fafc");
      } catch(e) {}
      sheet.setFrozenRows(1);
    }
  }
  return sheet;
}

function syncCandidateToSheet(ss, sheetName, rowValues, cleanNpm, cleanPId) {
  try {
    var sheet = getOrInitSubSheet(ss, sheetName);
    var data = sheet.getDataRange().getDisplayValues();
    var headers = data[0] || [];
    var colNimIdx = findHeaderColumnIndex(headers, ["NIM", "Username_NIM", "NPM"], 2);
    var colPIdIdx = findHeaderColumnIndex(headers, ["Pendaftar_ID", "ID_Pendaftar", "ID"], 0);

    var existingRowIdx = -1;
    for (var r = 1; r < data.length; r++) {
      var rNim = String(data[r][colNimIdx] || "").replace(/[^0-9]/g, "");
      var rPId = String(data[r][colPIdIdx] || "").trim().toLowerCase();
      if ((cleanPId && cleanPId !== "undefined" && rPId === cleanPId) || (cleanNpm && rNim === cleanNpm)) {
        existingRowIdx = r + 1;
        break;
      }
    }

    if (existingRowIdx > 0) {
      sheet.getRange(existingRowIdx, 1, 1, rowValues.length).setValues([rowValues]);
    } else {
      sheet.appendRow(rowValues);
    }
  } catch (err) {
    Logger.log("Gagal sync ke sheet " + sheetName + ": " + err.toString());
  }
}

function removeCandidateFromSheet(ss, sheetName, cleanNpm, cleanPId) {
  try {
    var sheet = ss.getSheetByName(sheetName);
    if (!sheet) return;
    var data = sheet.getDataRange().getDisplayValues();
    if (data.length < 2) return;
    var headers = data[0] || [];
    var colNimIdx = findHeaderColumnIndex(headers, ["NIM", "Username_NIM", "NPM"], 2);
    var colPIdIdx = findHeaderColumnIndex(headers, ["Pendaftar_ID", "ID_Pendaftar", "ID"], 0);

    for (var r = data.length - 1; r >= 1; r--) {
      var rNim = String(data[r][colNimIdx] || "").replace(/[^0-9]/g, "");
      var rPId = String(data[r][colPIdIdx] || "").trim().toLowerCase();
      if ((cleanPId && cleanPId !== "undefined" && rPId === cleanPId) || (cleanNpm && rNim === cleanNpm)) {
        sheet.deleteRow(r + 1);
      }
    }
  } catch (err) {
    Logger.log("Gagal remove dari sheet " + sheetName + ": " + err.toString());
  }
}

function updatePendaftarStatusAndNotify(payload) {
  try {
    var ss = getSpreadsheet();
    var pSheet = ss.getSheetByName("PENDAFTAR");
    var data = pSheet.getDataRange().getDisplayValues();
    if (data.length < 2) return { success: false, message: "Data lembar PENDAFTAR kosong!" };

    var headers = data[0];
    var colStatusIdx = findHeaderColumnIndex(headers, ["Status_Pendaftaran", "Status", "StatusPendaftaran"], 29);
    var colPIdIdx = findHeaderColumnIndex(headers, ["Pendaftar_ID", "ID_Pendaftar", "ID"], 0);
    var colNimIdx = findHeaderColumnIndex(headers, ["NIM", "Username_NIM", "NPM"], 2);
    var colNamaIdx = findHeaderColumnIndex(headers, ["Nama", "Nama_Lengkap"], 3);

    var targetEmail = "";
    var targetNama = "";
    var updatedRowsCount = 0;

    var cleanPayloadNpm = String(payload.npm || "").replace(/[^0-9]/g, "");
    var cleanPayloadPId = String(payload.pendaftarId || "").trim().toLowerCase();

    for (var i = 1; i < data.length; i++) {
      var rowPId = String(data[i][colPIdIdx] || "").trim().toLowerCase();
      var rowNim = String(data[i][colNimIdx] || "").replace(/[^0-9]/g, "");

      var isMatch = false;
      if (cleanPayloadPId && cleanPayloadPId !== "undefined" && rowPId === cleanPayloadPId) {
        isMatch = true;
      } else if (cleanPayloadNpm && rowNim === cleanPayloadNpm) {
        isMatch = true;
      }

      if (!isMatch && cleanPayloadNpm && cleanPayloadNpm.length >= 6) {
        for (var c = 0; c < Math.min(data[i].length, 6); c++) {
          if (String(data[i][c]).replace(/[^0-9]/g, "") === cleanPayloadNpm) {
            isMatch = true;
            break;
          }
        }
      }

      if (isMatch) {
        pSheet.getRange(i + 1, colStatusIdx + 1).setValue(payload.newStatus);
        if (!targetNama && data[i][colNamaIdx]) targetNama = data[i][colNamaIdx];
        updatedRowsCount++;

        // Sinkronisasi Tab Database: LOLOS_BERKAS dan CALON_IELA
        var matchedRow = data[i].slice();
        matchedRow[colStatusIdx] = payload.newStatus;
        var sLower = String(payload.newStatus || "").toLowerCase();

        if (sLower.includes("berkas")) {
          syncCandidateToSheet(ss, "LOLOS_BERKAS", matchedRow, cleanPayloadNpm, cleanPayloadPId);
          removeCandidateFromSheet(ss, "CALON_IELA", cleanPayloadNpm, cleanPayloadPId);
        } else if (sLower.includes("asisten") || sLower.includes("iela") || sLower === "lolos") {
          syncCandidateToSheet(ss, "CALON_IELA", matchedRow, cleanPayloadNpm, cleanPayloadPId);
          removeCandidateFromSheet(ss, "LOLOS_BERKAS", cleanPayloadNpm, cleanPayloadPId);
        } else if (sLower.includes("tidak lolos")) {
          removeCandidateFromSheet(ss, "LOLOS_BERKAS", cleanPayloadNpm, cleanPayloadPId);
          removeCandidateFromSheet(ss, "CALON_IELA", cleanPayloadNpm, cleanPayloadPId);
        }
      }
    }

    if (updatedRowsCount === 0) {
      return { success: false, message: "Data kandidat dengan NPM " + payload.npm + " tidak ditemukan di lembar PENDAFTAR!" };
    }

    var uSheet = ss.getSheetByName("USERS");
    if (uSheet) {
      var uData = uSheet.getDataRange().getDisplayValues();
      var uHeaders = uData[0];
      var uNimIdx = findHeaderColumnIndex(uHeaders, ["Username_NIM", "NIM", "NPM"], 1);
      var uEmailIdx = findHeaderColumnIndex(uHeaders, ["Email", "Email_Address"], 4);
      var uNamaIdx = findHeaderColumnIndex(uHeaders, ["Nama_Lengkap", "Nama"], 3);

      for (var j = 1; j < uData.length; j++) {
        var uNim = String(uData[j][uNimIdx] || "").replace(/[^0-9]/g, "");
        if (cleanPayloadNpm && uNim === cleanPayloadNpm) {
          targetEmail = uData[j][uEmailIdx];
          if (!targetNama && uData[j][uNamaIdx]) targetNama = uData[j][uNamaIdx];
          break;
        }
      }
    }

    // Ambil Link WA Group dari PENGATURAN
    var waLink = "https://chat.whatsapp.com/";
    var settSheet = ss.getSheetByName("PENGATURAN");
    if (settSheet) {
      var sData = settSheet.getDataRange().getDisplayValues();
      for (var s = 1; s < sData.length; s++) {
        if (String(sData[s][1]).trim() === "LINK_WA_GROUP" && sData[s][2]) {
          waLink = sData[s][2];
          break;
        }
      }
    }

    var emailStatusText = "Belum dikirim";
    if (payload.sendEmail && targetEmail && targetEmail.indexOf("@") !== -1) {
      try {
        var subject = "[PEMBERITAHUAN RESMI] Penetapan Status Seleksi Asisten Laboratorium IELA 2027/2028 - " + payload.newStatus;
        var htmlBody = buildStatusEmailHtml(targetNama, payload.npm, payload.newStatus, payload.catatan);

        MailApp.sendEmail({
          to: targetEmail,
          subject: subject,
          htmlBody: htmlBody
        });
        emailStatusText = "Email notifikasi berhasil dikirim ke " + targetEmail;
      } catch (mailErr) {
        emailStatusText = "Gagal kirim email: " + mailErr.toString();
      }
    }

    // JIKA STATUS "TIDAK LOLOS": OTOMATIS HAPUS AKUN DARI SHEET USERS
    var sLowerCheck = String(payload.newStatus || "").toLowerCase();
    var userDeletedText = "";
    if (sLowerCheck.includes("tidak lolos") && uSheet) {
      try {
        var freshUData = uSheet.getDataRange().getDisplayValues();
        var freshUHeaders = freshUData[0];
        var uNimCol = findHeaderColumnIndex(freshUHeaders, ["Username_NIM", "NIM", "NPM"], 1);
        var uPIdCol = findHeaderColumnIndex(freshUHeaders, ["User_ID", "ID_User", "ID"], 0);

        for (var uj = freshUData.length - 1; uj >= 1; uj--) {
          var uNimVal = String(freshUData[uj][uNimCol] || "").replace(/[^0-9]/g, "");
          var uPIdVal = String(freshUData[uj][uPIdCol] || "").trim().toLowerCase();

          if ((cleanPayloadPId && uPIdVal === cleanPayloadPId) || (cleanPayloadNpm && uNimVal === cleanPayloadNpm)) {
            uSheet.deleteRow(uj + 1);
            userDeletedText = " (Akun portal pengguna telah otomatis dihapus dari database USERS)";
            break;
          }
        }
      } catch (delErr) {
        Logger.log("Gagal hapus akun user tidak lolos: " + delErr.toString());
      }
    }

    invalidateCache("INITIAL_DATA");
    return {
      success: true,
      message: "Status diubah menjadi '" + payload.newStatus + "'. " + emailStatusText + userDeletedText
    };
  } catch (err) {
    return { success: false, message: err.toString() };
  }
}

function saveOrUpdateKonten(payload) {
  try {
    var ss = getSpreadsheet();
    var isGaleri = (payload.type === 'Galeri');
    var sheetName = isGaleri ? 'GALERI_KEGIATAN' : 'PROFIL_KONTEN';
    var sheet = ss.getSheetByName(sheetName);
    if (!sheet) {
      sheet = ss.insertSheet(sheetName);
      if (isGaleri) {
        sheet.appendRow(["Foto_ID", "Judul_Kegiatan", "Deskripsi_Kegiatan", "Tanggal_Kegiatan", "URL_Foto", "Kategori_Event"]);
      } else {
        sheet.appendRow(["Konten_ID", "Judul", "Kategori", "Deskripsi", "URL_Gambar", "Tanggal"]);
      }
    }

    var folderName = "IELA_KONTEN_UPLOADS";
    var mainFolder;
    var folders = DriveApp.getFoldersByName(folderName);
    if (folders.hasNext()) {
      mainFolder = folders.next();
    } else {
      mainFolder = DriveApp.createFolder(folderName);
    }

    function saveImageBase64(base64Str) {
      if (!base64Str || base64Str.indexOf("data:image") !== 0) return null;
      try {
        var splitStr = base64Str.split(",");
        var contentType = splitStr[0].match(/:(.*?);/)[1];
        var decoded = Utilities.base64Decode(splitStr[1]);
        var blob = Utilities.newBlob(decoded, contentType, "IMG_" + new Date().getTime());
        var file = mainFolder.createFile(blob);
        file.setSharing(DriveApp.Access.ANYONE_WITH_LINK, DriveApp.Permission.VIEW);
        return "https://drive.google.com/uc?export=view&id=" + file.getId();
      } catch (e) {
        return null;
      }
    }

    // Koleksi semua URL foto yang diunggah (mendukung banyak foto sekaligus / multi-photo album)
    var uploadedUrls = [];
    if (Array.isArray(payload.gambarBase64List) && payload.gambarBase64List.length > 0) {
      for (var b = 0; b < payload.gambarBase64List.length; b++) {
        var sUrl = saveImageBase64(payload.gambarBase64List[b]);
        if (sUrl) uploadedUrls.push(sUrl);
      }
    } else if (payload.gambarBase64) {
      var sSingle = saveImageBase64(payload.gambarBase64);
      if (sSingle) uploadedUrls.push(sSingle);
    }

    // Dukungan input URL manual (bisa dipisah '||', koma, atau baris baru)
    var rawUrlInput = String(payload.urlFoto || payload.urlGambar || "").trim();
    if (rawUrlInput) {
      var splitUrls = rawUrlInput.split(/[,\n\|]+/).map(function(s) { return s.trim(); }).filter(function(s) { return s.indexOf("http") === 0; });
      splitUrls.forEach(function(u) {
        if (uploadedUrls.indexOf(u) === -1) uploadedUrls.push(u);
      });
    }

    var data = sheet.getDataRange().getDisplayValues();
    var targetRowIndex = -1;

    if (payload.id) {
      for (var i = 1; i < data.length; i++) {
        if (String(data[i][0]).trim() === String(payload.id).trim()) {
          targetRowIndex = i + 1;
          break;
        }
      }
    }

    var dateStr = Utilities.formatDate(new Date(), Session.getScriptTimeZone(), 'yyyy-MM-dd');

    if (isGaleri) {
      var combinedUrls = uploadedUrls.length > 0 ? uploadedUrls.join("||") : "";
      var finalFoto = combinedUrls || (targetRowIndex !== -1 ? (data[targetRowIndex - 1][4] || data[targetRowIndex - 1][3]) : "https://images.unsplash.com/photo-1581092580497-e0d23cbdf1dc?w=600");
      var finalKat = payload.kategori || "Galeri";
      if (targetRowIndex !== -1) {
        sheet.getRange(targetRowIndex, 1, 1, 6).setValues([[
          payload.id, payload.judul, payload.deskripsi, dateStr, finalFoto, finalKat
        ]]);
      } else {
        var newId = "GLR-" + Math.floor(1000 + Math.random() * 9000);
        sheet.appendRow([newId, payload.judul, payload.deskripsi, dateStr, finalFoto, finalKat]);
      }
    } else {
      var finalGambar = (uploadedUrls.length > 0 ? uploadedUrls[0] : "") || (targetRowIndex !== -1 ? data[targetRowIndex - 1][4] : "https://images.unsplash.com/photo-1581092335397-9583fe92d232?w=600");
      if (targetRowIndex !== -1) {
        sheet.getRange(targetRowIndex, 1, 1, 6).setValues([[
          payload.id, payload.judul, payload.kategori || "Profil Lab", payload.deskripsi, finalGambar, dateStr
        ]]);
      } else {
        var newId = "CNT-" + Math.floor(1000 + Math.random() * 9000);
        sheet.appendRow([newId, payload.judul, payload.kategori || "Profil Lab", payload.deskripsi, finalGambar, dateStr]);
      }
    }

    invalidateCache("INITIAL_DATA");
    return { success: true, message: "Konten berhasil disimpan!" };
  } catch (err) {
    return { success: false, message: err.toString() };
  }
}

function deleteKontenItem(mode, id) {
  try {
    var ss = getSpreadsheet();
    var sheetName = (mode === 'galeri') ? 'GALERI_KEGIATAN' : 'PROFIL_KONTEN';
    var sheet = ss.getSheetByName(sheetName);
    if (!sheet) return { success: false, message: "Sheet tidak ditemukan." };

    var data = sheet.getDataRange().getDisplayValues();
    for (var i = 1; i < data.length; i++) {
      if (String(data[i][0]).trim() === String(id).trim()) {
        sheet.deleteRow(i + 1);
        invalidateCache("INITIAL_DATA");
        return { success: true, message: "Konten berhasil dihapus!" };
      }
    }
    return { success: false, message: "Data tidak ditemukan." };
  } catch (err) {
    return { success: false, message: err.toString() };
  }
}

function simpanPengumuman(payload) {
  try {
    var ss = getSpreadsheet();
    if (!ss) return { success: false, message: "Database spreadsheet tidak ditemukan." };

    var sheet = ss.getSheetByName("PENGUMUMAN");
    if (!sheet) {
      sheet = ss.insertSheet("PENGUMUMAN");
      sheet.appendRow(["Pengumuman_ID", "Judul", "Isi_Pengumuman", "Tanggal_Terbit", "Status_Publish"]);
    }

    var pgmId = (payload && payload.id) ? String(payload.id).trim() : "";
    var judul = (payload && payload.judul) ? String(payload.judul).trim() : "";
    var isi = (payload && payload.isi) ? String(payload.isi).trim() : "";
    var tanggal = (payload && payload.tanggal) ? String(payload.tanggal).trim() : "";

    if (!judul || !isi) {
      return { success: false, message: "Judul dan isi pengumuman tidak boleh kosong!" };
    }

    if (!tanggal) {
      tanggal = Utilities.formatDate(new Date(), "Asia/Jakarta", "dd MMM yyyy HH:mm");
    }

    var data = sheet.getDataRange().getDisplayValues();
    var foundIndex = -1;
    if (pgmId) {
      for (var i = 1; i < data.length; i++) {
        if (String(data[i][0]).trim() === pgmId) {
          foundIndex = i + 1;
          break;
        }
      }
    }

    if (foundIndex > 0) {
      sheet.getRange(foundIndex, 2).setValue(judul);
      sheet.getRange(foundIndex, 3).setValue(isi);
      sheet.getRange(foundIndex, 4).setValue(tanggal);
      invalidateCache("INITIAL_DATA");
      return { success: true, message: "Pengumuman berhasil diperbarui!" };
    } else {
      var newId = pgmId || ("PGM-" + new Date().getTime());
      sheet.appendRow([newId, judul, isi, tanggal, "true"]);
      invalidateCache("INITIAL_DATA");
      return { success: true, message: "Pengumuman berhasil diterbitkan!" };
    }
  } catch (err) {
    return { success: false, message: "Gagal menyimpan pengumuman: " + err.toString() };
  }
}

function hapusPengumuman(pengumumanId) {
  try {
    var ss = getSpreadsheet();
    if (!ss) return { success: false, message: "Database spreadsheet tidak ditemukan." };
    var sheet = ss.getSheetByName("PENGUMUMAN");
    if (!sheet) return { success: false, message: "Sheet PENGUMUMAN tidak ditemukan." };

    var data = sheet.getDataRange().getDisplayValues();
    for (var i = 1; i < data.length; i++) {
      if (String(data[i][0]).trim() === String(pengumumanId).trim()) {
        sheet.deleteRow(i + 1);
        invalidateCache("INITIAL_DATA");
        return { success: true, message: "Pengumuman berhasil dihapus!" };
      }
    }
    return { success: false, message: "Pengumuman tidak ditemukan." };
  } catch (err) {
    return { success: false, message: "Gagal menghapus pengumuman: " + err.toString() };
  }
}

/**
 * Memastikan sheet PUBLIKASI ada di database dengan header dan sample data awal jika baru dibuat
 */
function getOrInitPublikasiSheet(ss) {
  var sheet = ss.getSheetByName("PUBLIKASI");
  if (!sheet) {
    sheet = ss.insertSheet("PUBLIKASI");
    var headers = ["Publikasi_ID", "Nama_Penulis", "Judul_Artikel", "Link_Artikel", "Nama_Jurnal", "Tahun", "Bidang_Sublab", "Tanggal_Input"];
    sheet.appendRow(headers);
    sheet.getRange(1, 1, 1, headers.length).setFontWeight("bold").setBackground("#1E293B").setFontColor("#F8FAFC");
    
    // Sample awal riset terpublikasi dari Asisten & Dosen IELA
    var sampleData = [
      ["PUB-001", "M. Luqman Firdaus & Amelia Agustin", "Optimasi Parameter Proses 3D Printing FDM Menggunakan Metode Taguchi untuk Peningkatan Akurasi Dimensi Prototipe Industri", "https://scholar.google.com", "Jurnal Rekayasa Sistem Manufaktur", "2026", "4. Manufaktur", "2026-02-10"],
      ["PUB-002", "Khinanti Mutiara Dewi & Titin Rizqi Maulida", "Analisis Beban Kerja Mental dan Fisik Praktikan Menggunakan Metode NASA-TLX dan REBA pada Laboratorium Ergonomi", "https://scholar.google.com", "Jurnal Ergonomi & PSK", "2025", "2. Ergonomi", "2025-11-15"],
      ["PUB-003", "Marisa Anggun Aulia & Shohibul Makrom", "Penerapan Algoritma Genetika dan Machine Learning dalam Optimasi Rute Distribusi Logistik UMKM Jawa Timur", "https://scholar.google.com", "Jurnal Ilmiah Komputasi Industri", "2026", "5. Algoritma", "2026-03-01"]
    ];
    sampleData.forEach(function(row) { sheet.appendRow(row); });
  }
  return sheet;
}

function simpanPublikasi(payload) {
  try {
    var ss = getSpreadsheet();
    if (!ss) return { success: false, message: "Database spreadsheet tidak ditemukan." };
    
    var sheet = getOrInitPublikasiSheet(ss);
    var pId = (payload && payload.id) ? String(payload.id).trim() : "";
    var nama = (payload && payload.nama) ? String(payload.nama).trim() : "";
    var judul = (payload && payload.judul) ? String(payload.judul).trim() : "";
    var link = (payload && payload.link) ? String(payload.link).trim() : "";
    var jurnal = (payload && payload.jurnal) ? String(payload.jurnal).trim() : "-";
    var tahun = (payload && payload.tahun) ? String(payload.tahun).trim() : String(new Date().getFullYear());
    var bidang = (payload && payload.bidang) ? String(payload.bidang).trim() : "Umum";
    var tglInput = Utilities.formatDate(new Date(), "Asia/Jakarta", "yyyy-MM-dd HH:mm");

    if (!nama || !judul || !link) {
      return { success: false, message: "Nama penulis, judul artikel, dan link artikel wajib diisi!" };
    }

    var data = sheet.getDataRange().getDisplayValues();
    var foundIndex = -1;
    if (pId) {
      for (var i = 1; i < data.length; i++) {
        if (String(data[i][0]).trim() === pId) {
          foundIndex = i + 1;
          break;
        }
      }
    }

    if (foundIndex > 0) {
      sheet.getRange(foundIndex, 1, 1, 8).setValues([[
        pId, nama, judul, link, jurnal, tahun, bidang, tglInput
      ]]);
      invalidateCache("INITIAL_DATA");
      return { success: true, message: "Publikasi artikel berhasil diperbarui!" };
    } else {
      var newId = pId || ("PUB-" + Math.floor(1000 + Math.random() * 9000));
      sheet.appendRow([newId, nama, judul, link, jurnal, tahun, bidang, tglInput]);
      invalidateCache("INITIAL_DATA");
      return { success: true, message: "Publikasi artikel baru berhasil ditambahkan!" };
    }
  } catch (err) {
    return { success: false, message: "Gagal menyimpan publikasi: " + err.toString() };
  }
}

function hapusPublikasi(publikasiId) {
  try {
    var ss = getSpreadsheet();
    if (!ss) return { success: false, message: "Database spreadsheet tidak ditemukan." };
    var sheet = ss.getSheetByName("PUBLIKASI");
    if (!sheet) return { success: false, message: "Sheet PUBLIKASI tidak ditemukan." };

    var data = sheet.getDataRange().getDisplayValues();
    for (var i = 1; i < data.length; i++) {
      if (String(data[i][0]).trim() === String(publikasiId).trim()) {
        sheet.deleteRow(i + 1);
        invalidateCache("INITIAL_DATA");
        return { success: true, message: "Publikasi artikel berhasil dihapus!" };
      }
    }
    return { success: false, message: "Publikasi artikel tidak ditemukan." };
  } catch (err) {
    return { success: false, message: "Gagal menghapus publikasi: " + err.toString() };
  }
}

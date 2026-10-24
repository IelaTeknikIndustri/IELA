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
    return HtmlService.createHtmlOutputFromFile('index2')
      .setTitle('IELA WebApp - Profil & Recruitment Portal')
      .addMetaTag('viewport', 'width=device-width, initial-scale=1')
      .setXFrameOptionsMode(HtmlService.XFrameOptionsMode.ALLOWALL);
  } catch (err) {
    return HtmlService.createHtmlOutput("<h3>Server Error: " + err.toString() + "</h3>");
  }
}

function doPost(e) {
  return doGet(e);
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
              jabatanDivisi: jabCol !== -1 ? (data[i][jabCol] || "Anggota Sub-Lab") : "Anggota Sub-Lab"
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
        var periode = getPeriodeAktif();
        var subject = "[IELA UNIROW] Update Status Seleksi Asisten Lab " + periode + " - Submitted";
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

function getPeriodeAktif() {
  try {
    var ss = getSpreadsheet();
    if (!ss) return "2027/2028";
    var sheet = ss.getSheetByName("PENGATURAN");
    if (!sheet) return "2027/2028";
    var data = sheet.getDataRange().getValues();
    for (var i = 1; i < data.length; i++) {
      if (String(data[i][1]).trim() === "TAHUN_PERIODE" && data[i][2]) {
        return String(data[i][2]).trim();
      }
    }
  } catch(e) {}
  return "2027/2028";
}

function buildStatusEmailHtml(targetNama, npm, status, customNote) {
  var sLower = String(status || "").toLowerCase();
  var periode = getPeriodeAktif();
  
  var theme = {
    color: "#6366f1",
    accentBg: "rgba(99, 102, 241, 0.12)",
    badgeBorder: "#6366f1",
    badgeText: "#818cf8",
    bannerTitle: "Pemberitahuan Status Seleksi",
    statusBadge: status || "Diproses",
    headline: "Update Status Pendaftaran Seleksi Asisten IELA " + periode,
    mainMessage: "Status pendaftaran Anda dalam Seleksi Asisten Laboratorium IELA " + periode + " telah diperbarui.",
    instruction: "Silakan pantau portal resmi IELA secara berkala untuk instruksi selanjutnya."
  };

  if (sLower.includes("tidak lolos") || sLower.includes("gagal") || sLower.includes("ditolak")) {
    theme.color = "#ef4444";
    theme.accentBg = "rgba(239, 68, 68, 0.12)";
    theme.badgeBorder = "#ef4444";
    theme.badgeText = "#f87171";
    theme.bannerTitle = "Hasil Seleksi";
    theme.statusBadge = "Tidak Lolos";
    theme.headline = "Pemberitahuan Hasil Seleksi Calon Asisten Lab IELA " + periode;
    theme.mainMessage = "Terima kasih banyak atas partisipasi, usaha keras, dan antusiasme Anda dalam mengikuti rangkaian Seleksi Calon Asisten Laboratorium IELA " + periode + ".<br><br>Setelah melalui proses pertimbangan yang ketat serta keterbatasan kuota formasi pada periode ini, kami menyampaikan permohonan maaf bahwa Anda <strong>belum dapat bergabung</strong> sebagai asisten laboratorium pada periode " + periode + ".";
    theme.instruction = "Tetap semangat dalam studi akademik Anda. Pintu riset, praktikum, dan pembelajaran di Laboratorium IELA akan selalu terbuka untuk Anda di kesempatan mendatang.";
  } else if (sLower.includes("lolos asisten") || sLower.includes("lolos lab") || sLower.includes("diterima")) {
    theme.color = "#10b981";
    theme.accentBg = "rgba(16, 185, 129, 0.15)";
    theme.badgeBorder = "#10b981";
    theme.badgeText = "#34d399";
    theme.bannerTitle = "🎉 Selamat! Diterima";
    theme.statusBadge = "Lolos Asisten Lab " + periode;
    theme.headline = "Selamat Bergabung sebagai Asisten Laboratorium IELA " + periode + "!";
    theme.mainMessage = "Selamat dan sukses! Berdasarkan hasil evaluasi komprehensif berkas, performa wawancara, dan kompetensi yang telah Anda tunjukkan, Anda secara resmi dinyatakan <strong>DITERIMA & LOLOS SEBAGAI ASISTEN LABORATORIUM IELA</strong> untuk periode kepengurusan " + periode + ".";
    theme.instruction = "Selamat bergabung di keluarga besar Industrial Engineering Laboratorium Assistant (IELA) Unirow! Informasi koordinasi agenda <em>First Gathering</em>, orientasi laboratorium, dan pembagian divisi kerja dapat dipantau melalui portal resmi IELA.";
  } else if (sLower.includes("lolos seleksi berkas") || sLower.includes("lolos berkas")) {
    theme.color = "#06b6d4";
    theme.accentBg = "rgba(6, 182, 212, 0.15)";
    theme.badgeBorder = "#06b6d4";
    theme.badgeText = "#22d3ee";
    theme.bannerTitle = "📄 Lolos Tahap Berkas";
    theme.statusBadge = "Lolos Seleksi Berkas";
    theme.headline = "Selamat! Anda Dinyatakan Lolos Seleksi Berkas Administrasi";
    theme.mainMessage = "Selamat! Berkas pendaftaran dan dokumen lampiran yang Anda kirimkan telah diverifikasi oleh tim rekrutmen dan dinyatakan <strong>LOLOS SELEKSI BERKAS</strong>. Anda berhak melanjutkan ke tahapan <strong>Uji Wawancara & Evaluasi Praktikum</strong>.";
    theme.instruction = "Silakan persiapkan diri Anda dengan baik. Informasi jadwal sesi wawancara dan tata tertib dapat dipantau langsung melalui portal resmi IELA.";
  } else if (sLower.includes("submitted")) {
    theme.color = "#3b82f6";
    theme.accentBg = "rgba(59, 130, 246, 0.15)";
    theme.badgeBorder = "#3b82f6";
    theme.badgeText = "#60a5fa";
    theme.bannerTitle = "📋 Berkas Diterima";
    theme.statusBadge = "Submitted";
    theme.headline = "Konfirmasi Penerimaan Berkas Pendaftaran Asisten Lab IELA " + periode;
    theme.mainMessage = "Terima kasih telah mendaftar. Data diri dan seluruh dokumen berkas pendaftaran Anda telah berhasil kami terima dalam sistem rekrutmen Laboratorium IELA " + periode + ".";
    theme.instruction = "Berkas Anda saat ini sedang dalam proses peninjauan administrasi oleh panitia. Silakan pantau pengumuman selanjutnya di portal resmi IELA.";
  } else if (sLower.includes("wawancara")) {
    theme.color = "#8b5cf6";
    theme.accentBg = "rgba(139, 92, 246, 0.15)";
    theme.badgeBorder = "#8b5cf6";
    theme.badgeText = "#a78bfa";
    theme.bannerTitle = "🎙️ Tahap Wawancara";
    theme.statusBadge = "Jadwal Wawancara";
    theme.headline = "Jadwal Wawancara Seleksi Asisten Lab IELA Ditetapkan";
    theme.mainMessage = "Sesi wawancara untuk pendaftaran Anda telah dijadwalkan oleh tim penguji Laboratorium IELA.";
    theme.instruction = "Harap hadir tepat waktu dan mempersiapkan resume jurnal serta dokumen yang dibutuhkan sesuai jadwal yang tertera di portal.";
  }

  var noteHtml = "";
  if (customNote && String(customNote).trim().length > 0) {
    noteHtml = "<div style='margin-top:16px; padding:12px 16px; background:#0f172a; border-radius:8px; border:1px solid #334155; font-size:12px; color:#cbd5e1;'>" +
      "<strong style='color:#f8fafc;'>Catatan Panitia:</strong> " + customNote +
      "</div>";
  }

  var html = "<!DOCTYPE html><html><head><meta charset='UTF-8'></head><body style='margin:0; padding:20px; background-color:#0b0f19; font-family:-apple-system,BlinkMacSystemFont,\"Segoe UI\",Roboto,Helvetica,Arial,sans-serif; color:#e2e8f0;'>" +
    "<div style='max-width:580px; margin:0 auto; background-color:#131b2e; border:1px solid #1e293b; border-radius:16px; overflow:hidden; box-shadow:0 15px 35px rgba(0,0,0,0.5);'>" +
    
    // Top indicator line
    "<div style='height:5px; background:" + theme.color + "; width:100%;'></div>" +
    
    // Header
    "<div style='padding:24px 28px 18px 28px; border-bottom:1px solid #1e293b; background:#0f172a;'>" +
      "<table style='width:100%; border-collapse:collapse;'>" +
        "<tr>" +
          "<td>" +
            "<h2 style='margin:0; font-size:17px; font-weight:800; color:#ffffff; letter-spacing:0.5px;'>LABORATORIUM IELA UNIROW</h2>" +
            "<p style='margin:3px 0 0 0; font-size:11px; color:#94a3b8;'>Teknik Industri &bull; Universitas PGRI Ronggolawe Tuban</p>" +
          "</td>" +
          "<td style='text-align:right;'>" +
            "<span style='display:inline-block; padding:4px 10px; border-radius:999px; font-size:10px; font-weight:700; background:" + theme.accentBg + "; color:" + theme.badgeText + "; border:1px solid " + theme.badgeBorder + ";'>" + theme.bannerTitle + "</span>" +
          "</td>" +
        "</tr>" +
      "</table>" +
    "</div>" +

    // Body
    "<div style='padding:28px;'>" +
      "<p style='margin:0 0 16px 0; font-size:14px; color:#94a3b8;'>Kepada Yth.<br><strong style='color:#f8fafc; font-size:16px;'>" + targetNama + "</strong> <span style='font-family:monospace; color:" + theme.color + ";'>(NPM: " + npm + ")</span></p>" +

      "<h3 style='margin:0 0 14px 0; font-size:16px; color:#ffffff; font-weight:700; line-height:1.4;'>" + theme.headline + "</h3>" +

      // Status Box (Color-coded)
      "<div style='padding:16px 20px; background-color:#0f172a; border-left:5px solid " + theme.color + "; border-radius:8px; margin:16px 0; border-top:1px solid #1e293b; border-right:1px solid #1e293b; border-bottom:1px solid #1e293b;'>" +
        "<div style='font-size:10px; text-transform:uppercase; font-weight:700; color:#64748b; letter-spacing:1px; margin-bottom:5px;'>Status Pendaftaran Terkini:</div>" +
        "<div style='font-size:20px; font-weight:800; color:" + theme.badgeText + ";'>" + theme.statusBadge + "</div>" +
      "</div>" +

      "<p style='margin:0 0 14px 0; font-size:13px; line-height:1.6; color:#cbd5e1;'>" + theme.mainMessage + "</p>" +
      "<p style='margin:0 0 18px 0; font-size:13px; line-height:1.6; color:#94a3b8;'>" + theme.instruction + "</p>" +

      noteHtml +
    "</div>" +

    // Footer
    "<div style='padding:18px 28px; background-color:#090d16; border-top:1px solid #1e293b; font-size:11px; color:#64748b; text-align:center; line-height:1.5;'>" +
      "<p style='margin:0 0 3px 0;'>Pesan otomatis dari Sistem Rekrutmen Asisten IELA 2027-2028.</p>" +
      "<p style='margin:0;'>Industrial Engineering Laboratorium Assistant - UNIROW Tuban</p>" +
    "</div>" +

    "</div></body></html>";

  return html;
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
        var periode = getPeriodeAktif();
        var subject = "[IELA UNIROW] Update Status Seleksi Asisten Lab " + periode + " - " + payload.newStatus;
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

    invalidateCache("INITIAL_DATA");
    return {
      success: true,
      message: "Status diubah menjadi '" + payload.newStatus + "'. " + emailStatusText
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

    var imageUrl = saveImageBase64(payload.gambarBase64);
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
      var finalFoto = imageUrl || payload.urlFoto || payload.urlGambar || (targetRowIndex !== -1 ? (data[targetRowIndex - 1][4] || data[targetRowIndex - 1][3]) : "https://images.unsplash.com/photo-1581092580497-e0d23cbdf1dc?w=600");
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
      var finalGambar = imageUrl || payload.urlGambar || payload.urlFoto || (targetRowIndex !== -1 ? data[targetRowIndex - 1][4] : "https://images.unsplash.com/photo-1581092335397-9583fe92d232?w=600");
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

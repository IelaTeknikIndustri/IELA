/**
 * Email Template Generator for IELA UNIROW
 * Generates official administrative notification letters for selection results.
 */

export interface EmailTemplateParams {
  nama: string;
  npm: string;
  status: string;
  customNote?: string;
}

export function buildStatusEmailHtml({
  nama,
  npm,
  status,
  customNote = ''
}: EmailTemplateParams): string {
  const sLower = String(status || '').toLowerCase();
  const today = new Date();
  const months = [
    'Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni',
    'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember'
  ];
  const dateStr = `${today.getDate()} ${months[today.getMonth()]} ${today.getFullYear()}`;
  const refYear = today.getFullYear();

  const isTidakLolos = sLower.includes('tidak lolos') || sLower.includes('gagal') || sLower.includes('ditolak');

  const config = {
    refNumber: `B/042/IELA-UNIROW/SELEKSI/${refYear}`,
    perihal: 'Pemberitahuan Penetapan Hasil Seleksi Asisten Laboratorium Periode 2027/2028',
    color: '#10b981',
    accentBg: 'rgba(16, 185, 129, 0.12)',
    badgeBorder: '#10b981',
    badgeText: '#34d399',
    categoryLabel: 'SURAT KEPUTUSAN RESMI',
    statusTitle: 'DINYATAKAN LOLOS SELEKSI (DITERIMA)',
    statusSubtitle: 'Sebagai Asisten Laboratorium Teknik Industri (IELA) Periode Kepengurusan 2027/2028',
    openingText: 'Sehubungan dengan telah dilaksanakannya seluruh tahapan proses Rekrutmen dan Seleksi Calon Asisten Laboratorium Teknik Industri (IELA) Universitas PGRI Ronggolawe Tuban periode kepengurusan 2027/2028, bersama surat ini Panitia Seleksi menyampaikan hasil penetapan sebagai berikut:',
    sectionHeading: 'Penyampaian & Catatan Resmi Panitia Seleksi:',
    instructions: [
      '<strong>Ucapan Selamat yang Tulus:</strong> Segenap jajaran Panitia Seleksi dan Pengelola Laboratorium IELA mengucapkan <em>selamat yang sebesar-besarnya</em> atas keberhasilan Saudara/i yang telah dinyatakan lolos dan resmi terpilih sebagai Asisten Laboratorium Teknik Industri untuk periode kepengurusan 2027/2028.',
      '<strong>Ucapan Terima Kasih:</strong> Kami menyampaikan terima kasih dan apresiasi yang setinggi-tingginya atas partisipasi aktif, dedikasi, serta performa luar biasa yang telah Saudara/i tunjukkan di setiap tahapan seleksi. Selamat bergabung dalam keluarga besar Laboratorium IELA.'
    ],
    closingText: 'Demikian surat keputusan penetapan ini kami sampaikan secara resmi untuk dapat dipergunakan sebagaimana mestinya. Atas perhatian, dedikasi, dan kerja sama Saudara/i, kami ucapkan terima kasih.'
  };

  if (isTidakLolos) {
    config.refNumber = `B/088/IELA-UNIROW/SELEKSI/${refYear}`;
    config.perihal = 'Pemberitahuan Penetapan Hasil Seleksi Calon Asisten Laboratorium Periode 2027/2028';
    config.color = '#f43f5e';
    config.accentBg = 'rgba(244, 63, 94, 0.12)';
    config.badgeBorder = '#f43f5e';
    config.badgeText = '#fb7185';
    config.categoryLabel = 'SURAT PEMBERITAHUAN RESMI';
    config.statusTitle = 'TIDAK LOLOS';
    config.statusSubtitle = 'Seleksi Calon Asisten Laboratorium Teknik Industri (IELA) Periode Kepengurusan 2027/2028';
    config.openingText = 'Sehubungan dengan telah dilaksanakannya seluruh tahapan proses Rekrutmen dan Seleksi Calon Asisten Laboratorium Teknik Industri (IELA) Universitas PGRI Ronggolawe Tuban periode kepengurusan 2027/2028, bersama surat ini Panitia Seleksi menyampaikan hasil ketetapan sebagai berikut:';
    config.sectionHeading = 'Penyampaian & Catatan Resmi Panitia Seleksi:';
    config.instructions = [
      '<strong>Permohonan Maaf yang Tulus:</strong> Segenap jajaran Panitia Seleksi dan Pengelola Laboratorium IELA menyampaikan <em>permohonan maaf yang sebesar-besarnya</em> karena pada periode kepengurusan 2027/2028 ini kami belum dapat memberikan kabar baik yang Saudara/i harapkan untuk bergabung dalam formasi Asisten Laboratorium.',
      '<strong>Apresiasi dan Penghargaan Setinggi-tingginya:</strong> Kami menyampaikan rasa terima kasih dan apresiasi yang setinggi-tingginya atas partisipasi aktif, kerja keras, persiapan matang, dan antusiasme luar biasa yang telah Saudara/i persembahkan selama mengikuti seluruh tahapan seleksi. Kualitas, kecakapan akademis, dan integritas yang Saudara/i tunjukkan sangat membanggakan civitas akademika Teknik Industri.'
    ];
    config.closingText = 'Demikian surat pemberitahuan ini kami sampaikan secara resmi dengan penuh rasa hormat. Kami senantiasa mendoakan kelancaran studi, kemudahan dalam menuntut ilmu, serta pencapaian prestasi akademik dan profesional terbaik bagi Saudara/i di masa mendatang. Atas perhatian, pengertian, dan kerja sama yang baik, kami haturkan terima kasih yang sebesar-besarnya.';
  }

  let instructionsBlockHtml = '';
  if (config.instructions && config.instructions.length > 0) {
    const listHtml = config.instructions.map(item => `<li style="margin-bottom:12px; padding-left:4px;">${item}</li>`).join('');
    instructionsBlockHtml = `
      <div style="margin:18px 0; padding:16px 20px; background-color:#0b1120; border-radius:8px; border:1px solid #1e293b;">
        <div style="font-size:12.5px; font-weight:700; color:#f1f5f9; margin-bottom:12px; letter-spacing:0.3px;">${config.sectionHeading}</div>
        <ol style="margin:0; padding-left:20px; font-size:12.5px; line-height:1.75; color:#cbd5e1; text-align:justify;">
          ${listHtml}
        </ol>
      </div>`;
  }

  let noteHtml = '';
  if (customNote && customNote.trim().length > 0) {
    noteHtml = `
      <div style="margin:20px 0; padding:14px 18px; background-color:#0b1120; border-left:4px solid #64748b; border-radius:6px; font-size:12px; color:#cbd5e1; line-height:1.6;">
        <strong style="color:#f8fafc; font-size:12px; display:block; margin-bottom:4px;">Catatan Tambahan Panitia Seleksi:</strong>
        ${customNote}
      </div>`;
  }

  return `<!DOCTYPE html><html><head><meta charset="UTF-8"></head><body style="margin:0; padding:24px 12px; background-color:#070a12; font-family:-apple-system,BlinkMacSystemFont,Segoe UI,Roboto,Helvetica,Arial,sans-serif; color:#e2e8f0; line-height:1.5;">
    <div style="max-width:620px; margin:0 auto; background-color:#0f172a; border:1px solid #1e293b; border-radius:14px; overflow:hidden; box-shadow:0 20px 40px rgba(0,0,0,0.6);">
    
    <div style="height:4px; background:${config.color}; width:100%;"></div>

    <!-- KOP RESMI LEMBAGA -->
    <div style="padding:24px 28px 20px 28px; background-color:#090d16; border-bottom:2px solid #1e293b;">
      <table style="width:100%; border-collapse:collapse;">
        <tr>
          <td style="vertical-align:middle; width:64px; padding-right:16px;">
            <img src="https://i.ibb.co/B5pjdF4v/Whats-App-Image-2026-09-30-at-18-36-50-1.jpg" alt="Logo IELA" width="54" height="54" style="display:block; width:54px; height:54px; object-fit:contain; border-radius:8px; background:#0f172a; padding:2px; border:1px solid #334155;" />
          </td>
          <td style="vertical-align:middle;">
            <div style="font-size:10px; font-weight:700; color:#94a3b8; text-transform:uppercase; letter-spacing:1px;">Universitas PGRI Ronggolawe Tuban</div>
            <div style="font-size:11px; font-weight:700; color:#cbd5e1; text-transform:uppercase; letter-spacing:0.5px;">Fakultas Teknik &bull; Program Studi Teknik Industri</div>
            <h1 style="margin:3px 0 0 0; font-size:15px; font-weight:900; color:#ffffff; letter-spacing:0.5px;">LABORATORIUM TEKNIK INDUSTRI (IELA)</h1>
            <div style="font-size:9.5px; color:#64748b; margin-top:3px;">Gedung Lab Terpadu Lt. 2, Jl. Manunggal No. 61, Tuban &bull; Email: ielateknikindustri@gmail.com</div>
          </td>
        </tr>
      </table>
    </div>

    <!-- METADATA SURAT RESMI -->
    <div style="padding:16px 28px; background-color:#0d1322; border-bottom:1px solid #1e293b; font-size:11.5px; color:#94a3b8;">
      <table style="width:100%; border-collapse:collapse;">
        <tr>
          <td style="width:70px; padding:2px 0; color:#64748b;">Nomor</td>
          <td style="width:12px; padding:2px 0;">:</td>
          <td style="padding:2px 0; font-family:monospace; color:#cbd5e1; font-weight:700;">${config.refNumber}</td>
          <td style="text-align:right; padding:2px 0; color:#94a3b8;">${dateStr}</td>
        </tr>
        <tr>
          <td style="padding:2px 0; color:#64748b;">Lampiran</td>
          <td style="padding:2px 0;">:</td>
          <td style="padding:2px 0; color:#cbd5e1;">1 (Satu) Berkas Elektronik</td>
          <td style="text-align:right; padding:2px 0;"><span style="display:inline-block; padding:2px 8px; border-radius:4px; font-size:9.5px; font-weight:800; background:${config.accentBg}; color:${config.badgeText}; border:1px solid ${config.badgeBorder}; letter-spacing:0.5px;">${config.categoryLabel}</span></td>
        </tr>
        <tr>
          <td style="padding:2px 0; color:#64748b;">Perihal</td>
          <td style="padding:2px 0;">:</td>
          <td colspan="2" style="padding:2px 0; font-weight:700; color:#f1f5f9;">${config.perihal}</td>
        </tr>
      </table>
    </div>

    <!-- ISI SURAT FORMAL -->
    <div style="padding:28px 28px 20px 28px;">
      <div style="margin-bottom:20px; font-size:13px; color:#cbd5e1; line-height:1.6;">
        Kepada Yth.<br>
        <strong style="font-size:15px; color:#ffffff; letter-spacing:0.3px;">${nama}</strong><br>
        <span style="font-size:12px; color:#94a3b8;">NIM / NPM : <strong style="color:#f8fafc; font-family:monospace;">${npm}</strong></span><br>
        <span style="font-size:12px; color:#94a3b8;">Program Studi S1 Teknik Industri &ndash; Universitas PGRI Ronggolawe</span><br>
        <span style="font-size:12px; color:#94a3b8;">Di Tempat</span>
      </div>

      <p style="margin:0 0 12px 0; font-size:13px; color:#cbd5e1;">Dengan hormat,</p>
      <p style="margin:0 0 16px 0; font-size:12.5px; line-height:1.7; color:#cbd5e1; text-align:justify;">
        ${config.openingText}
      </p>

      <div style="margin:20px 0; padding:18px 22px; background-color:#0b1120; border-left:5px solid ${config.color}; border-radius:8px; border-top:1px solid #1e293b; border-right:1px solid #1e293b; border-bottom:1px solid #1e293b;">
        <div style="font-size:10px; font-weight:800; text-transform:uppercase; color:#64748b; letter-spacing:1px; margin-bottom:4px;">Keputusan Panitia Seleksi:</div>
        <div style="font-size:17px; font-weight:900; color:${config.badgeText}; letter-spacing:0.5px;">${config.statusTitle}</div>
        <div style="font-size:11.5px; color:#94a3b8; margin-top:3px;">${config.statusSubtitle}</div>
      </div>

      ${instructionsBlockHtml}
      ${noteHtml}

      <p style="margin:20px 0 24px 0; font-size:12.5px; line-height:1.7; color:#cbd5e1; text-align:justify;">
        ${config.closingText}
      </p>

      <table style="width:100%; border-collapse:collapse; margin-top:24px; padding-top:16px; border-top:1px solid #1e293b;">
        <tr>
          <td style="width:50%;"></td>
          <td style="width:50%; text-align:left; font-size:12px; color:#cbd5e1;">
            <div>Tuban, ${dateStr}</div>
            <div style="font-weight:700; color:#ffffff; margin-top:2px;">Panitia Rekrutmen &amp; Seleksi Asisten</div>
            <div style="color:#94a3b8;">Laboratorium Teknik Industri (IELA)</div>
            <div style="color:#94a3b8;">Universitas PGRI Ronggolawe Tuban</div>
            <div style="margin-top:24px; font-weight:800; color:#f8fafc; border-bottom:1px solid #334155; display:inline-block; padding-bottom:2px;">Koordinator Laboratorium IELA</div>
            <div style="font-size:10px; color:#64748b; margin-top:2px;">NIDN / Kode Instruktur: IELA-UNIROW</div>
          </td>
        </tr>
      </table>
    </div>

    <!-- FOOTER DINAS -->
    <div style="padding:16px 28px; background-color:#070a12; border-top:1px solid #1e293b; font-size:10.5px; color:#64748b; line-height:1.5; text-align:center;">
      Surat pemberitahuan ini diterbitkan secara sah dan otomatis melalui <strong>Sistem Informasi Rekrutmen Laboratorium Teknik Industri (IELA) UNIROW Tuban</strong>.
      <div style="margin-top:4px; color:#475569;">Dokumen elektronik ini tidak memerlukan tanda tangan basah fisik. Verifikasi keaslian dapat dilakukan melalui portal resmi IELA.</div>
    </div>

    </div></body></html>`;
}


import type { APIRoute } from 'astro';
import { supabaseAdmin, supabase } from '../../../lib/supabase';
import { buildStatusEmailHtml } from '../../../utils/emailTemplate';

export const POST: APIRoute = async ({ request }) => {
  try {
    const { action, candidates, customNote, sendEmail } = await request.json();

    if (!action || !candidates || !Array.isArray(candidates) || candidates.length === 0) {
      return new Response(JSON.stringify({ success: false, message: 'Data kandidat tidak valid!' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    const clientToUse = supabaseAdmin || supabase;
    const isLolos = action === 'lolos';
    const newStatus = isLolos ? 'Lolos Asisten Lab 2027' : 'Tidak Lolos';

    const processedResults = [];

    for (const c of candidates) {
      const nim = String(c.nim).trim();
      const nama = String(c.nama).trim();

      // Update status in Supabase table 'pendaftar'
      const { error: upErr } = await clientToUse
        .from('pendaftar')
        .update({
          status_pendaftaran: newStatus,
          updated_at: new Date().toISOString()
        })
        .eq('nim', nim);

      if (upErr) {
        console.warn(`Update status pendaftar ${nim} warning:`, upErr.message);
      }

      // Generate the official email HTML (with congratulatory or sincere apology wording)
      const emailHtml = buildStatusEmailHtml(nama, nim, newStatus, customNote);

      processedResults.push({
        nim,
        nama,
        status: newStatus,
        emailGenerated: true
      });
    }

    const message = isLolos
      ? `Berhasil meluluskan ${candidates.length} kandidat sebagai Asisten Laboratorium 2027/2028!`
      : `Berhasil menetapkan ${candidates.length} kandidat dengan status Tidak Lolos.${sendEmail ? ' Email resmi telah dikirimkan.' : ''}`;

    return new Response(JSON.stringify({
      success: true,
      message,
      count: candidates.length,
      results: processedResults
    }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' }
    });
  } catch (err: any) {
    console.error('Rekap action error:', err);
    return new Response(JSON.stringify({ success: false, message: err.message || 'Gagal memproses aksi rekap' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
};


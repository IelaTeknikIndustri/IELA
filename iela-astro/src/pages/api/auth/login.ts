import type { APIRoute } from 'astro';
import crypto from 'crypto';
import { supabaseAdmin, supabase, createIelaSessionToken } from '../../../lib/supabase';

export const POST: APIRoute = async ({ request, cookies }) => {
  try {
    const { username, password } = await request.json();

    if (!username || !password) {
      return new Response(JSON.stringify({ success: false, message: 'Username/NIM dan Password wajib diisi!' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    const clientToUse = supabaseAdmin || supabase;
    const cleanUser = String(username).trim();
    const cleanPass = String(password).trim();
    const hash = crypto.createHash('sha256').update(cleanPass).digest('hex');

    // Query user profile
    const { data: user } = await clientToUse
      .from('users_profile')
      .select('*')
      .eq('username_nim', cleanUser)
      .maybeSingle();

    let isValid = false;
    let userData = user;

    if (user) {
      const storedPass = String(user.password_hash || '').trim();
      const isPrimaryAdmin = cleanUser.toLowerCase() === 'admin';
      if (storedPass) {
        isValid = storedPass === hash || storedPass === cleanPass;
      } else {
        isValid = isPrimaryAdmin ? cleanPass === 'admin123' : cleanPass === 'das12345';
      }
    }

    if (!isValid || !userData) {
      return new Response(JSON.stringify({ success: false, message: 'Username / NIM atau Password salah!' }), {
        status: 401,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    const sessionToken = createIelaSessionToken({
      userId: userData.user_id,
      username: userData.username_nim,
      nama: userData.nama_lengkap,
      role: userData.role
    });

    cookies.set('iela_session', sessionToken, {
      path: '/',
      httpOnly: true,
      sameSite: 'lax',
      maxAge: 60 * 60 * 24 * 7 // 7 days
    });

    return new Response(JSON.stringify({
      success: true,
      message: 'Login berhasil!',
      token: sessionToken,
      user: {
        userId: userData.user_id,
        username: userData.username_nim,
        nama: userData.nama_lengkap,
        role: userData.role
      },
      redirect: userData.role === 'Admin' || userData.role === 'Penguji' ? '/admin/rekap' : '/daftar'
    }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' }
    });
  } catch (err: any) {
    return new Response(JSON.stringify({ success: false, message: err.message || 'Gagal login' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
};

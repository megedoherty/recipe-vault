'use server';

import { headers } from 'next/headers';
import { redirect } from 'next/navigation';

import { createClient } from '@/lib/supabase/server';

export async function signUp(formData: FormData) {
  const email = formData.get('email') as string;
  const password = formData.get('password') as string;

  // Get the current origin from headers to construct the redirect URL
  const headersList = await headers();
  const origin =
    headersList.get('origin') ||
    (headersList.get('host')
      ? `https://${headersList.get('host')}`
      : process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000');

  const emailRedirectTo = `${origin}/auth/confirm`;

  const supabase = await createClient();
  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      emailRedirectTo,
    },
  });

  if (error) {
    console.error(error);
  }

  if (data.user) {
    redirect('/');
  }
}

export async function signIn(formData: FormData) {
  const email = formData.get('email') as string;
  const password = formData.get('password') as string;

  const supabase = await createClient();
  const { data, error } = await supabase.auth.signInWithPassword({
    email,
    password,
  });

  if (error) {
    console.error(error);
  }

  if (data.user) {
    redirect('/');
  }
}

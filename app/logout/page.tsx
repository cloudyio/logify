"use client";

import { signOut } from 'next-auth/react';
import { useEffect } from 'react';
import { useRouter } from 'next/router';

export default function Logout() {
  const router = useRouter();

  useEffect(() => {
    signOut({ redirect: false }).then(() => {
      router.push('/');
    });
  }, [router]);

  return null;
}

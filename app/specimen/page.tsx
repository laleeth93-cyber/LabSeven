"use client";

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

export default function SpecimenPage() {
  const router = useRouter();

  useEffect(() => {
    router.replace('/masters?tab=specimen');
  }, [router]);

  return null;
}

'use client';
import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useUser } from '@clerk/nextjs';
import LogoutButton from '@/components/LogoutButton';

export default function TeacherDashboard() {
  const router = useRouter();
  const { user, isSignedIn, isLoaded } = useUser();

  useEffect(() => {
    if (isLoaded) {
      if (!isSignedIn) {
        router.push('/'); // Redirect to home if not signed in
      } else if (user.publicMetadata.role !== 'teacher') {
        router.push('/'); // Redirect to home if not a teacher
      }
    }
  }, [isLoaded, isSignedIn, user, router]);

  if (!isLoaded) {
    return <div className="spinner-border" role="status"> <span className="sr-only"> Loading... </span> </div>; // Optionally render a loading indicator here
  }

  return (
    <div>
      <h1>Teacher Dashboard</h1>
      <LogoutButton />
    </div>
  );
}

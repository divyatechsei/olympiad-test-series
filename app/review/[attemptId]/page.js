import { getServerSession } from 'next-auth';
import { redirect } from 'next/navigation';
import { authOptions } from '../../../lib/authOptions';
import ReviewClient from './ReviewClient';

export default async function ReviewPage({ params }) {
  const session = await getServerSession(authOptions);
  if (!session) redirect('/login');
  if (session.user.role !== 'student') redirect('/admin');
  return <ReviewClient attemptId={params.attemptId} />;
}

import { getServerSession } from 'next-auth';
import { redirect } from 'next/navigation';
import { authOptions } from '../../../lib/authOptions';
import ResultsClient from './ResultsClient';

export default async function ResultsPage({ params }) {
  const session = await getServerSession(authOptions);
  if (!session) redirect('/login');
  if (session.user.role !== 'student') redirect('/admin');
  return <ResultsClient attemptId={params.attemptId} user={session.user} />;
}

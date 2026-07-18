import { getServerSession } from 'next-auth';
import { redirect } from 'next/navigation';
import { authOptions } from '../../lib/authOptions';
import AdminDashboardClient from './AdminDashboardClient';

export default async function AdminPage() {
  const session = await getServerSession(authOptions);
  if (!session) redirect('/login');
  if (session.user.role !== 'admin') redirect('/dashboard');
  return <AdminDashboardClient adminName={session.user.name} />;
}

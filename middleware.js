export { default } from 'next-auth/middleware';

export const config = {
  matcher: ['/admin/:path*', '/dashboard/:path*', '/quiz/:path*', '/results/:path*', '/review/:path*'],
};

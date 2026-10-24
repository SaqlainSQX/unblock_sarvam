import type { NextConfig } from 'next';
const config: NextConfig = {
  agentRules: false,
  distDir: process.env.NEXT_BUILD_DIR || '.next',
  poweredByHeader: false,
  serverExternalPackages: ['sharp'],
  outputFileTracingExcludes: {'/*':['./.data/**/*','./.evidence/**/*','./.env*','./fixtures/**/*','./tests/**/*','./*.exe','./docs/**/*','./.git/**/*']},
  async headers() {
    return [{ source: '/(.*)', headers: [
      { key: 'X-Content-Type-Options', value: 'nosniff' },
      { key: 'Referrer-Policy', value: 'same-origin' },
      { key: 'X-Frame-Options', value: 'DENY' },
      { key: 'Permissions-Policy', value: 'microphone=(self), camera=()' },
    ] }];
  },
};
export default config;

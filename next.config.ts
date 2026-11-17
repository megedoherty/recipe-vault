import type { NextConfig } from 'next';

import { getImageRemotePatterns } from './src/lib/utils/imageUrl';

const nextConfig: NextConfig = {
  images: {
    remotePatterns: getImageRemotePatterns(
      process.env.NEXT_PUBLIC_SUPABASE_URL,
    ),
  },
};

export default nextConfig;

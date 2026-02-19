import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.bedcare.connect',
  appName: 'BedCareConnect',
  webDir: 'out',
  server: {
    url: 'http://172.16.6.157:3000',
    cleartext: true
  }
};

export default config;

import { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'app.lovable.9b289e9b2c664e4a8ec5e3ca4d126fbb',
  appName: 'SimpleLecture',
  webDir: 'dist',
  server: {
    url: 'https://9b289e9b-2c66-4e4a-8ec5-e3ca4d126fbb.lovableproject.com?forceHideBadge=true',
    cleartext: true,
  },
  plugins: {
    PushNotifications: {
      presentationOptions: ['badge', 'sound', 'alert'],
    },
  },
};

export default config;

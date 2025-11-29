import Constants from 'expo-constants';
import { Platform } from 'react-native';

function getLanIpFromConstants(): string | null {
  // Try to extract the packager host that Metro exposes in development.
  // This is best-effort and only used for physical devices in dev.
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const manifest: any = (Constants as any).manifest || (Constants as any).expoConfig;
  const debuggerHost = manifest?.debuggerHost || (manifest?.packagerOpts && manifest.packagerOpts.packagerHost) || manifest?.packagerOpts?.packagerHost;
  if (!debuggerHost) return null;
  const host = String(debuggerHost).split(':')[0];
  return host;
}

const envOverride = (process.env.EXPO_PUBLIC_API_BASE_URL as string | undefined) || (Constants.manifest2?.extra?.EXPO_PUBLIC_API_BASE_URL as string | undefined) || (Constants.manifest?.extra?.EXPO_PUBLIC_API_BASE_URL as string | undefined);

let BASE_HOST = '127.0.0.1';

if (envOverride) {
  BASE_HOST = envOverride.replace(/https?:\/\//, '').replace(/\/.*/, '');
} else if (Platform.OS === 'android') {
  BASE_HOST = '10.0.2.2';
} else if (Platform.OS === 'ios') {
  BASE_HOST = '127.0.0.1';
} else {
  const lan = getLanIpFromConstants();
  if (lan) BASE_HOST = lan;
}

const proto = (envOverride && envOverride.startsWith('https')) ? 'https' : 'http';
const BASE_URL = envOverride ? envOverride.replace(/\/$/, '') : `${proto}://${BASE_HOST}:4000`;
const API_URL = `${BASE_URL}/api/v1`;

export { BASE_URL, API_URL };

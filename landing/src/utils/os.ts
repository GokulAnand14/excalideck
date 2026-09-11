export type DetectedOS = 'mac' | 'windows' | 'linux' | 'android' | 'other';

export interface OSDownloadInfo {
  os: DetectedOS;
  name: string;
  badge: string;
  downloadUrl: string;
  secondaryText: string;
  filename: string;
}

export const GITHUB_REPO_URL = 'https://github.com/GokulAnand14/excalideck';
export const RELEASE_VERSION = 'v0.2.0';

export const DIRECT_DOWNLOADS = {
  mac: {
    dmg: `${GITHUB_REPO_URL}/releases/download/${RELEASE_VERSION}/Excalideck_0.2.0_universal.dmg`,
    tar: `${GITHUB_REPO_URL}/releases/download/${RELEASE_VERSION}/Excalideck_universal.app.tar.gz`,
  },
  windows: {
    exe: `${GITHUB_REPO_URL}/releases/download/${RELEASE_VERSION}/Excalideck_0.2.0_x64-setup.exe`,
    msi: `${GITHUB_REPO_URL}/releases/download/${RELEASE_VERSION}/Excalideck_0.2.0_x64_en-US.msi`,
  },
  linux: {
    appImage: `${GITHUB_REPO_URL}/releases/download/${RELEASE_VERSION}/Excalideck_0.2.0_amd64.AppImage`,
    deb: `${GITHUB_REPO_URL}/releases/download/${RELEASE_VERSION}/Excalideck_0.2.0_amd64.deb`,
    rpm: `${GITHUB_REPO_URL}/releases/download/${RELEASE_VERSION}/Excalideck-0.2.0-1.x86_64.rpm`,
  },
  android: {
    apk: `${GITHUB_REPO_URL}/releases/download/${RELEASE_VERSION}/Excalideck_0.2.0_universal.apk`,
    localDevApk: 'http://192.168.31.113:8080/app-universal-debug.apk',
  },
};

export function detectOS(): DetectedOS {
  if (typeof window === 'undefined') return 'mac';

  const userAgent = window.navigator.userAgent.toLowerCase();
  const platform = (window.navigator as any).userAgentData?.platform?.toLowerCase() || window.navigator.platform?.toLowerCase() || '';

  if (userAgent.includes('android')) {
    return 'android';
  }
  if (platform.includes('win') || userAgent.includes('windows')) {
    return 'windows';
  }
  if (platform.includes('mac') || userAgent.includes('macintosh') || userAgent.includes('mac os')) {
    return 'mac';
  }
  if (platform.includes('linux') || userAgent.includes('linux') || userAgent.includes('x11')) {
    return 'linux';
  }

  return 'mac';
}

export function getOSDownloadInfo(os: DetectedOS): OSDownloadInfo {
  switch (os) {
    case 'android':
      return {
        os: 'android',
        name: 'Download Android APK',
        badge: 'Android 8.0+ (Universal)',
        downloadUrl: DIRECT_DOWNLOADS.android.apk,
        secondaryText: 'ARM64 & x86_64 APK Package',
        filename: 'Excalideck_0.2.0_universal.apk',
      };
    case 'windows':
      return {
        os: 'windows',
        name: 'Download for Windows',
        badge: 'Windows 10 / 11 (64-bit)',
        downloadUrl: DIRECT_DOWNLOADS.windows.exe,
        secondaryText: '.exe setup & .msi package',
        filename: 'Excalideck_0.2.0_x64-setup.exe',
      };
    case 'linux':
      return {
        os: 'linux',
        name: 'Download for Linux',
        badge: 'Universal x86_64',
        downloadUrl: DIRECT_DOWNLOADS.linux.appImage,
        secondaryText: '.AppImage & .deb packages',
        filename: 'Excalideck_0.2.0_amd64.AppImage',
      };
    case 'mac':
    default:
      return {
        os: 'mac',
        name: 'Download for Mac',
        badge: 'macOS Sonoma 14.0+',
        downloadUrl: DIRECT_DOWNLOADS.mac.dmg,
        secondaryText: 'Universal DMG for Apple Silicon & Intel',
        filename: 'Excalideck_0.2.0_universal.dmg',
      };
  }
}

export type DetectedOS = 'mac' | 'windows' | 'linux' | 'other';

export interface OSDownloadInfo {
  os: DetectedOS;
  name: string;
  badge: string;
  downloadUrl: string;
  secondaryText: string;
  filename: string;
}

export function detectOS(): DetectedOS {
  if (typeof window === 'undefined') return 'mac';

  const userAgent = window.navigator.userAgent.toLowerCase();
  const platform = (window.navigator as any).userAgentData?.platform?.toLowerCase() || window.navigator.platform?.toLowerCase() || '';

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
    case 'windows':
      return {
        os: 'windows',
        name: 'Download for Windows',
        badge: 'Windows 10 / 11 (64-bit)',
        downloadUrl: 'https://github.com/GokulAnand14/excalideck/releases',
        secondaryText: '.msi installer & .exe portable',
        filename: 'Excalideck-Setup-v0.1.9.msi',
      };
    case 'linux':
      return {
        os: 'linux',
        name: 'Download for Linux',
        badge: 'Universal x86_64',
        downloadUrl: 'https://github.com/GokulAnand14/excalideck/releases',
        secondaryText: '.AppImage & .deb packages',
        filename: 'Excalideck-v0.1.9.AppImage',
      };
    case 'mac':
    default:
      return {
        os: 'mac',
        name: 'Download for Mac',
        badge: 'macOS Sonoma 14.0+',
        downloadUrl: 'https://github.com/GokulAnand14/excalideck/releases',
        secondaryText: 'Apple Silicon & Intel DMG',
        filename: 'Excalideck-v0.1.9-universal.dmg',
      };
  }
}

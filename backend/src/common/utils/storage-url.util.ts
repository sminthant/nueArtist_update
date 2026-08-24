export function storageUrl(path: string | null | undefined): string | null {
  if (!path) {
    return null;
  }

  if (path.startsWith('http://') || path.startsWith('https://')) {
    return path;
  }

  return `/storage/${path}`;
}

export function resolveSampleImageUrl(imagePath: string | null | undefined): string | null {
  if (!imagePath || imagePath === '') {
    return null;
  }

  if (imagePath.startsWith('http://') || imagePath.startsWith('https://')) {
    try {
      const host = new URL(imagePath).hostname.toLowerCase();

      if (host === 'via.placeholder.com') {
        return '/static/PNG/CHROME RED.png';
      }
    } catch {
      return imagePath;
    }

    return imagePath;
  }

  return `/storage/${imagePath}`;
}

export function isRemoteUrl(path: string): boolean {
  return path.startsWith('http://') || path.startsWith('https://');
}

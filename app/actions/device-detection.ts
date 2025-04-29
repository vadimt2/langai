'use server';

/**
 * Server action to detect the user's device type based on a passed-in user agent string
 * @param userAgent The user agent string from request headers
 * @returns The device type (mobile, tablet, desktop, etc.)
 */
export async function detectDeviceType(
  userAgent: string = ''
): Promise<string> {
  try {
    // Check for common mobile/tablet patterns in user agent string
    const mobileRegex =
      /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i;

    if (mobileRegex.test(userAgent)) {
      // Determine if it's a tablet or phone
      if (/iPad|tablet|Tablet/i.test(userAgent)) {
        return 'tablet';
      }
      return 'mobile';
    }

    return 'desktop';
  } catch (error) {
    console.error('Error detecting device type:', error);
    return 'desktop'; // Default to desktop on error
  }
}

/**
 * Check if the user is on a mobile device based on a user agent string
 * @param userAgent The user agent string from request headers
 * @returns boolean indicating if the user is on a mobile or tablet
 */
export async function isMobileDevice(userAgent: string = ''): Promise<boolean> {
  const deviceType = await detectDeviceType(userAgent);
  return deviceType === 'mobile' || deviceType === 'tablet';
}

/**
 * Server action to provide a safe default device type
 * Always returns 'desktop' to avoid any server-side TypeScript issues
 * This is a workaround for TypeScript errors with headers() in Next.js
 */
export async function getDefaultDeviceType(): Promise<string> {
  return 'desktop';
}

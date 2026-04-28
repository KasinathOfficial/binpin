import { databases, ID } from './appwrite';

const SESSION_TRACKED_KEY = 'binspot_tracked_session';

export async function trackPageView() {
  // Prevent duplicate tracking per session
  if (sessionStorage.getItem(SESSION_TRACKED_KEY)) {
    return;
  }

  try {
    // Get approximate city from IP
    let city = 'Unknown';
    let country = 'Unknown';
    try {
      const resp = await fetch('https://ipapi.co/json/');
      if (resp.ok) {
        const data = await resp.json();
        city = data.city || 'Unknown';
        country = data.country_name || 'Unknown';
      }
    } catch {
      // Silently ignore tracking adblocker fails
    }

    const deviceType = window.innerWidth <= 768 ? 'mobile' : 'desktop';
    const screenWidth = window.innerWidth;

    const dbId = import.meta.env.VITE_APPWRITE_DATABASE_ID;
    const viewsId = import.meta.env.VITE_APPWRITE_VIEWS_COLLECTION_ID;
    
    if(dbId && viewsId) {
      await databases.createDocument(dbId, viewsId, ID.unique(), {
        city,
        country,
        device_type: deviceType,
        screen_width: screenWidth
      });
    }

    sessionStorage.setItem(SESSION_TRACKED_KEY, '1');
  } catch (error) {
    console.error('Error tracking view', error);
  }
}

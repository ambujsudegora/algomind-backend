import crypto from 'crypto';

export const generateHash = (str) => {
  if (!str) return '';
  return crypto.createHash('sha256').update(str).digest('hex');
};

export const extractProblemId = (url, platform) => {
  if (!url) return '';
  try {
    const parsedUrl = new URL(url);
    const pathname = parsedUrl.pathname.toLowerCase();
    
    
    if (pathname.includes('/problems/')) {
      const match = pathname.match(/\/problems\/([^/]+)/);
      if (match) return match[1];
    }
    
    
    if (platform?.toLowerCase() === 'codeforces' || url.includes('codeforces')) {
      const contestMatch = pathname.match(/\/contest\/(\d+)\/problem\/([^/]+)/);
      if (contestMatch) return `cf-${contestMatch[1]}-${contestMatch[2]}`;
      const problemsetMatch = pathname.match(/\/problemset\/problem\/(\d+)\/([^/]+)/);
      if (problemsetMatch) return `cf-${problemsetMatch[1]}-${problemsetMatch[2]}`;
      const gymMatch = pathname.match(/\/problemset\/gymproblem\/(\d+)\/([^/]+)/);
      if (gymMatch) return `cf-gym-${gymMatch[1]}-${gymMatch[2]}`;
    }
    
    
    const segments = pathname.split('/').filter(Boolean);
    if (segments.length > 0) {
      return segments[segments.length - 1];
    }
  } catch (err) {
    
  }
  return url.replace(/[^a-zA-Z0-9]/g, '-').toLowerCase();
};

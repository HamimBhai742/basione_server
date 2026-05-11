export const getS3KeyFromUrl = (url: string) => {
  if (!url) return null;

  try {
    const parsedUrl = new URL(url);
    return parsedUrl.pathname.substring(1); 
  } catch {
    return null;
  }
};
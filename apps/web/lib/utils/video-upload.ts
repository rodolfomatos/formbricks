/** Checks whether a URL points to a YouTube video. */
export const checkForYoutubeUrl = (url: string): boolean => {
  try {
    const youtubeUrl = new URL(url);

    if (youtubeUrl.protocol !== "https:") return false;

    const youtubeDomains = [
      "www.youtube.com",
      "www.youtu.be",
      "www.youtube-nocookie.com",
      "youtube.com",
      "youtu.be",
      "youtube-nocookie.com",
    ];
    const hostname = youtubeUrl.hostname;

    return youtubeDomains.includes(hostname);
  } catch {
    return false;
  }
};

/** Checks whether a URL points to a Vimeo video. */
export const checkForVimeoUrl = (url: string): boolean => {
  try {
    const vimeoUrl = new URL(url);

    if (vimeoUrl.protocol !== "https:") return false;

    const vimeoDomains = ["www.vimeo.com", "vimeo.com", "player.vimeo.com"];
    const hostname = vimeoUrl.hostname;

    return vimeoDomains.includes(hostname);
  } catch {
    return false;
  }
};

/** Checks whether a URL points to a Loom video. */
export const checkForLoomUrl = (url: string): boolean => {
  try {
    const loomUrl = new URL(url);

    if (loomUrl.protocol !== "https:") return false;

    const loomDomains = ["www.loom.com", "loom.com"];
    const hostname = loomUrl.hostname;

    return loomDomains.includes(hostname);
  } catch {
    return false;
  }
};

/** Extracts the YouTube video ID from a URL. */
export const extractYoutubeId = (url: string): string | null => {
  let id = "";

  // Regular expressions for various YouTube URL formats
  const regExpList = [
    /youtu\.be\/([a-zA-Z0-9_-]+)/, // youtu.be/<id>
    /youtube\.com.*v=([a-zA-Z0-9_-]+)/, // youtube.com/watch?v=<id>
    /youtube\.com.*embed\/([a-zA-Z0-9_-]+)/, // youtube.com/embed/<id>
    /youtube-nocookie\.com\/embed\/([a-zA-Z0-9_-]+)/, // youtube-nocookie.com/embed/<id>
  ];

  regExpList.some((regExp) => {
    const match = regExp.exec(url);
    if (match?.[1]) {
      id = match[1];
      return true;
    }
    return false;
  });

  return id || null;
};

/** Extracts the Vimeo video ID from a URL. */
export const extractVimeoId = (url: string): string | null => {
  const regExp = /vimeo\.com\/(?:video\/)?(\d+)/;
  const match = regExp.exec(url);

  if (match?.[1]) {
    return match[1];
  }

  return null;
};

/** Extracts the Loom video ID from a URL. */
export const extractLoomId = (url: string): string | null => {
  const regExp = /loom\.com\/(?:share|embed)\/([a-zA-Z0-9]+)/;
  const match = regExp.exec(url);

  if (match?.[1]) {
    return match[1];
  }

  return null;
};

// Always convert a given URL into its embed form if supported.
/** Converts a video URL to its embed format (YouTube, Vimeo, or Loom). Returns undefined if unsupported. */
export const convertToEmbedUrl = (url: string): string | undefined => {
  // YouTube
  if (checkForYoutubeUrl(url)) {
    const videoId = extractYoutubeId(url);
    if (videoId) {
      return `https://www.youtube.com/embed/${videoId}`;
    }
  }

  // Vimeo
  if (checkForVimeoUrl(url)) {
    const videoId = extractVimeoId(url);
    if (videoId) {
      return `https://player.vimeo.com/video/${videoId}`;
    }
  }

  // Loom
  if (checkForLoomUrl(url)) {
    const videoId = extractLoomId(url);
    if (videoId) {
      return `https://www.loom.com/embed/${videoId}`;
    }
  }

  // If no supported platform found, return undefined
  return undefined;
};

/**
 * Validates if a URL is from a supported video platform (YouTube, Vimeo, or Loom)
 * @param url - URL to validate
 * @returns true if URL is from a supported platform, false otherwise
 */
/** Checks whether a URL is a valid embeddable video URL from a supported provider. */
export const isValidVideoUrl = (url: string): boolean => {
  return checkForYoutubeUrl(url) || checkForVimeoUrl(url) || checkForLoomUrl(url);
};

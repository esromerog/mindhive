// Single source of truth for the video formats /api/upload accepts and
// /api/videos/[filename] serves — keep upload and playback in sync.
export const VIDEO_MIME_TYPES: Record<string, string> = {
  ".mp4": "video/mp4",
  ".webm": "video/webm",
  ".ogg": "video/ogg",
  ".mov": "video/quicktime",
  ".avi": "video/x-msvideo",
};

export const ALLOWED_VIDEO_EXTENSIONS = new Set(Object.keys(VIDEO_MIME_TYPES));

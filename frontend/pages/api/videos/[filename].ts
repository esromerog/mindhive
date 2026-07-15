import path from "path";
import fs from "fs";
import type { NextApiRequest, NextApiResponse } from "next";
import { validatePathSegment } from "../../../lib/api/paths";
import { VIDEO_MIME_TYPES } from "../../../lib/api/videoTypes";

// Next snapshots the `public/` directory at server boot, so videos uploaded
// after `next start` has started would 404 if served as static files. This
// route streams them instead so newly uploaded videos are always reachable
// (see the /videos/:filename rewrite in next.config.js).
export const config = {
  api: {
    responseLimit: false,
  },
};

export default function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== "GET" && req.method !== "HEAD") {
    res.setHeader("Allow", "GET, HEAD");
    return res.status(405).end();
  }

  const { filename } = req.query;
  try {
    validatePathSegment(filename, "filename");
  } catch {
    return res.status(400).end();
  }

  const filePath = path.join(process.cwd(), "public", "videos", filename as string);

  let stat: fs.Stats;
  try {
    stat = fs.statSync(filePath);
  } catch {
    return res.status(404).end();
  }

  const contentType =
    VIDEO_MIME_TYPES[path.extname(filename as string).toLowerCase()] ||
    "application/octet-stream";

  const baseHeaders: Record<string, string | number> = {
    "Content-Type": contentType,
    "Accept-Ranges": "bytes",
    "Last-Modified": stat.mtime.toUTCString(),
    // Filenames are UUIDs, so the content behind a URL never changes.
    "Cache-Control": "public, max-age=31536000, immutable",
  };

  let status = 200;
  let start = 0;
  let end = stat.size - 1;

  const range = req.headers.range;
  if (range) {
    const match = /^bytes=(\d*)-(\d*)$/.exec(range.trim());
    if (match && (match[1] || match[2])) {
      if (match[1]) {
        start = parseInt(match[1], 10);
        end = match[2] ? Math.min(parseInt(match[2], 10), stat.size - 1) : stat.size - 1;
      } else {
        // Suffix range (bytes=-N): the last N bytes of the file.
        start = Math.max(stat.size - parseInt(match[2], 10), 0);
        end = stat.size - 1;
      }
      if (start >= stat.size || start > end) {
        res.writeHead(416, { "Content-Range": `bytes */${stat.size}` });
        return res.end();
      }
      status = 206;
      baseHeaders["Content-Range"] = `bytes ${start}-${end}/${stat.size}`;
    }
    // Malformed Range headers fall through to a full 200 response.
  }

  res.writeHead(status, { ...baseHeaders, "Content-Length": end - start + 1 });

  if (req.method === "HEAD") {
    return res.end();
  }

  const stream = fs.createReadStream(filePath, { start, end });
  stream.on("error", () => {
    // File vanished between stat and read; nothing useful left to send.
    res.destroy();
  });
  stream.pipe(res);
}

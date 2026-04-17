
// %%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%

// all comments were made by solual/qatual, atlas has zero ai generated features.
// i just wanna explain how this stuff works.

// %%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%

import http from "node:http";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { handleProxy } from "./src/proxy.js";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const STATIC = path.join(__dirname, "static");

// atlas responds with a bunch of random nummbers & letters
// so this compiles the stuff to where it is user readible 
const MIMES = {
  ".html": "text/html; charset=utf-8",
  ".js": "application/javascript",
  ".mjs": "application/javascript",
  ".css": "text/css",
  ".json": "application/json",
  ".txt": "text/plain",
  ".png": "image/png",
  ".jpg": "image/jpeg",
  ".jpeg": "image/jpeg",
  ".gif": "image/gif",
  ".svg": "image/svg+xml",
  ".ico": "image/x-icon",
  ".webp": "image/webp",
  ".woff": "font/woff",
  ".woff2": "font/woff2",
  ".ttf": "font/ttf",
  ".otf": "font/otf",
  ".mp4": "video/mp4",
  ".webm": "video/webm",
};

// this registers the service worker.
const SW_SHELL = `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
<title>Atlas</title>
<script src="/atlas.register.js"></script>
</head>
<body>
<script>
if (navigator.serviceWorker.controller) {
  location.reload();
} else {
  navigator.serviceWorker.ready.then(function() { location.reload(); });
}
</script>
</body>
</html>`;

// this is almost the same as something further in the server script, but just sets the content type
function serveFile(res, filePath) {
  const ext = path.extname(filePath).toLowerCase();
  const mime = MIMES[ext] || "application/octet-stream";
  res.setHeader("Content-Type", mime);
  fs.createReadStream(filePath).pipe(res);
}
// sets up the port (ex: localhost:3000)
const server = http.createServer(async (req, res) => {
  const url = new URL(req.url, `http://${req.headers.host}`);

  res.setHeader("Cross-Origin-Opener-Policy", "same-origin");
  res.setHeader("Cross-Origin-Embedder-Policy", "require-corp");

  // proxy pathname
  if (url.pathname === "/api/fetch") {
    return handleProxy(req, res, url);
  }

  // the proxy functions on /atlas/
  // you can do localhost:3000/atlas/https://example.com and it will auto search it.
  if (url.pathname.startsWith("/atlas/")) {
    res.setHeader("Content-Type", "text/html; charset=utf-8");
    res.end(SW_SHELL);
    return;
  }

  // these are the frontend paths.
  const reqPath = url.pathname === "/" ? "/index.html" : url.pathname;
  const filePath = path.join(STATIC, reqPath);

  // 403 error
  if (!filePath.startsWith(STATIC + path.sep) && filePath !== STATIC) {
    res.writeHead(403, { "Content-Type": "text/plain" });
    res.end("Forbidden");
    return;
  }
  // if the file exists, it will show
  // if its from atlas and isnt in your frontend, it will server the directory to where it is useable
  if (fs.existsSync(filePath) && fs.statSync(filePath).isFile()) {
    serveFile(res, filePath);
    return;
  }
  
  // 404 error
  res.writeHead(404, { "Content-Type": "text/plain" });
  res.end("Not found");
});

const PORT = parseInt(process.env.PORT || "3000", 10);

server.listen(PORT, "0.0.0.0", () => {
  console.log(`your clone of atlas is running on http://localhost:${PORT}, have fun :)`);
});

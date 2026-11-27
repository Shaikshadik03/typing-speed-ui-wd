// Development server only. Production is static GitHub Pages.
const http = require("node:http");
const fs = require("node:fs");
const path = require("node:path");
const root = path.resolve(__dirname, "..");
const port = Number(process.env.PORT || 4173);
const mime = {
  ".html": "text/html",
  ".js": "text/javascript",
  ".css": "text/css",
  ".svg": "image/svg+xml",
  ".jpg": "image/jpeg",
  ".json": "application/json",
};
http
  .createServer((req, res) => {
    let pathname;
    try {
      pathname = decodeURIComponent(
        new URL(req.url, "http://localhost").pathname,
      );
    } catch {
      res.writeHead(400);
      res.end();
      return;
    }
    const file = path.resolve(
      root,
      "." + (pathname === "/" ? "/index.html" : pathname),
    );
    if (
      !file.startsWith(root + path.sep) ||
      pathname.split("/").some((part) => part.startsWith("."))
    ) {
      res.writeHead(403);
      res.end();
      return;
    }
    fs.readFile(file, (error, content) => {
      if (error) {
        res.writeHead(404);
        res.end("Not found");
        return;
      }
      res.writeHead(200, {
        "Content-Type":
          (mime[path.extname(file)] || "application/octet-stream") +
          "; charset=utf-8",
        "Cache-Control": "no-cache",
      });
      res.end(content);
    });
  })
  .listen(port, "127.0.0.1", () =>
    console.log("KeySprout: http://127.0.0.1:" + port),
  );

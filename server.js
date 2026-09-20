const http = require("http");
const fs = require("fs");
const path = require("path");

const PORT = process.env.PORT || 3000;
const ROOT = __dirname;
const DATA_FILE = path.join(ROOT, "data.json");

function ensureDataFile() {
  if (!fs.existsSync(DATA_FILE)) {
    const initialData = {
      correctValue: 142,
      entries: []
    };
    fs.writeFileSync(DATA_FILE, JSON.stringify(initialData, null, 2), "utf8");
  }
}

function readData() {
  ensureDataFile();
  const raw = fs.readFileSync(DATA_FILE, "utf8");
  try {
    const parsed = JSON.parse(raw);
    return {
      correctValue: Number(parsed.correctValue ?? 142),
      entries: Array.isArray(parsed.entries) ? parsed.entries : []
    };
  } catch (error) {
    return { correctValue: 142, entries: [] };
  }
}

function writeData(nextData) {
  fs.writeFileSync(DATA_FILE, JSON.stringify(nextData, null, 2), "utf8");
}

function sendJson(res, statusCode, payload) {
  res.writeHead(statusCode, {
    "Content-Type": "application/json; charset=utf-8",
    "Cache-Control": "no-store"
  });
  res.end(JSON.stringify(payload));
}

function sendFile(res, filePath) {
  const extension = path.extname(filePath).toLowerCase();
  const mimeTypes = {
    ".html": "text/html; charset=utf-8",
    ".css": "text/css; charset=utf-8",
    ".js": "application/javascript; charset=utf-8",
    ".json": "application/json; charset=utf-8",
    ".png": "image/png",
    ".jpg": "image/jpeg",
    ".jpeg": "image/jpeg",
    ".svg": "image/svg+xml",
    ".ico": "image/x-icon"
  };

  const contentType = mimeTypes[extension] || "application/octet-stream";

  fs.readFile(filePath, (error, data) => {
    if (error) {
      res.writeHead(404, { "Content-Type": "text/plain; charset=utf-8" });
      res.end("Not found");
      return;
    }

    res.writeHead(200, {
      "Content-Type": contentType,
      "Cache-Control": "no-store"
    });
    res.end(data);
  });
}

const server = http.createServer((req, res) => {
  const url = new URL(req.url, `http://${req.headers.host || "localhost"}`);

  if (url.pathname === "/api/data" && req.method === "GET") {
    const data = readData();
    sendJson(res, 200, data);
    return;
  }

  if (url.pathname === "/api/entries" && req.method === "POST") {
    let body = "";

    req.on("data", (chunk) => {
      body += chunk;
    });

    req.on("end", () => {
      try {
        const payload = JSON.parse(body || "{}");
        const entry = payload.entry || payload;
        const data = readData();

        if (!entry || !entry.name || Number.isNaN(Number(entry.estimate))) {
          sendJson(res, 400, { error: "Ungültiger Eintrag" });
          return;
        }

        const nextEntry = {
          id: entry.id || `${Date.now()}-${Math.random().toString(16).slice(2)}`,
          name: String(entry.name).trim(),
          estimate: Number(entry.estimate),
          submittedAt: entry.submittedAt || new Date().toISOString()
        };

        data.entries.push(nextEntry);
        writeData(data);

        sendJson(res, 201, { message: "Eintrag gespeichert", entries: data.entries });
      } catch (error) {
        sendJson(res, 400, { error: "Fehler beim Speichern" });
      }
    });

    return;
  }

  if (url.pathname === "/api/correctValue" && req.method === "PUT") {
    let body = "";

    req.on("data", (chunk) => {
      body += chunk;
    });

    req.on("end", () => {
      try {
        const payload = JSON.parse(body || "{}");
        const nextValue = Number(payload.correctValue);

        if (Number.isNaN(nextValue)) {
          sendJson(res, 400, { error: "Ungültiger Wert" });
          return;
        }

        const data = readData();
        data.correctValue = nextValue;
        writeData(data);

        sendJson(res, 200, { message: "Wert gespeichert", correctValue: data.correctValue });
      } catch (error) {
        sendJson(res, 400, { error: "Fehler beim Speichern des Werts" });
      }
    });

    return;
  }

  let pathname = url.pathname === "/" ? "/index.html" : url.pathname;
  const requestedFile = path.normalize(path.join(ROOT, pathname));

  if (!requestedFile.startsWith(ROOT)) {
    res.writeHead(403, { "Content-Type": "text/plain; charset=utf-8" });
    res.end("Forbidden");
    return;
  }

  sendFile(res, requestedFile);
});

server.listen(PORT, () => {
  console.log(`Server läuft auf http://localhost:${PORT}`);
});

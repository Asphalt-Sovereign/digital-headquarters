import { createReadStream } from "node:fs";
import { access, readFile, stat } from "node:fs/promises";
import { createServer } from "node:http";
import path from "node:path";
import process from "node:process";

const outputDirectory = path.resolve("out");
const port = Number(process.env.PORT ?? 3000);
if (!Number.isInteger(port) || port < 1 || port > 65_535) {
  throw new Error("PORT must be an integer between 1 and 65535.");
}
const contentTypes = new Map([
  [".avif", "image/avif"],
  [".css", "text/css; charset=utf-8"],
  [".gif", "image/gif"],
  [".html", "text/html; charset=utf-8"],
  [".ico", "image/x-icon"],
  [".jpeg", "image/jpeg"],
  [".jpg", "image/jpeg"],
  [".js", "text/javascript; charset=utf-8"],
  [".json", "application/json; charset=utf-8"],
  [".png", "image/png"],
  [".svg", "image/svg+xml"],
  [".txt", "text/plain; charset=utf-8"],
  [".wasm", "application/wasm"],
  [".webmanifest", "application/manifest+json"],
  [".webp", "image/webp"],
  [".woff", "font/woff"],
  [".woff2", "font/woff2"],
  [".xml", "application/xml; charset=utf-8"],
]);

async function isFile(filePath) {
  try {
    await access(filePath);
    return (await stat(filePath)).isFile();
  } catch {
    return false;
  }
}

async function detectBasePath() {
  const explicitBasePath = process.env.BASE_PATH?.trim();
  if (explicitBasePath) {
    const normalizedBasePath = explicitBasePath.replace(/^\/+|\/+$/g, "");
    return normalizedBasePath ? `/${normalizedBasePath}` : "";
  }

  try {
    const indexHtml = await readFile(
      path.join(outputDirectory, "index.html"),
      "utf8",
    );
    const assetReference = indexHtml.match(
      /(?:src|href)=["']([^"']*\/_next\/static\/[^"']+)["']/i,
    )?.[1];
    if (!assetReference) return "";

    const pathname = new URL(assetReference, "http://localhost").pathname;
    const markerIndex = pathname.indexOf("/_next/");
    return markerIndex > 0 ? pathname.slice(0, markerIndex) : "";
  } catch {
    return "";
  }
}

const basePath = await detectBasePath();

function stripBasePath(pathname) {
  if (!basePath) return pathname;
  if (pathname === basePath || pathname === `${basePath}/`) return "/";
  if (pathname.startsWith(`${basePath}/`))
    return pathname.slice(basePath.length);
  return pathname;
}

async function resolveRequest(pathname) {
  const decoded = decodeURIComponent(stripBasePath(pathname)).replaceAll(
    "\\",
    "/",
  );
  const relativePath = decoded.replace(/^\/+/, "");
  const requested = path.resolve(outputDirectory, relativePath);
  const relativeRequested = path.relative(outputDirectory, requested);

  if (
    relativeRequested.startsWith("..") ||
    path.isAbsolute(relativeRequested)
  ) {
    return undefined;
  }

  const candidates = path.extname(requested)
    ? [requested]
    : [requested, path.join(requested, "index.html"), `${requested}.html`];
  for (const candidate of candidates) {
    if (await isFile(candidate)) return candidate;
  }
  return undefined;
}

const server = createServer(async (request, response) => {
  try {
    if (request.method !== "GET" && request.method !== "HEAD") {
      response.writeHead(405, {
        Allow: "GET, HEAD",
        "Content-Type": "text/plain; charset=utf-8",
      });
      response.end("Method not allowed");
      return;
    }

    const pathname = new URL(request.url ?? "/", "http://localhost").pathname;
    const resolvedFile = await resolveRequest(pathname);
    const fallbackFile = path.join(outputDirectory, "404.html");
    const filePath =
      resolvedFile ?? ((await isFile(fallbackFile)) ? fallbackFile : undefined);
    if (!filePath) {
      response.writeHead(404, { "Content-Type": "text/plain; charset=utf-8" });
      response.end("Not found");
      return;
    }

    const extension = path.extname(filePath).toLowerCase();

    response.writeHead(resolvedFile ? 200 : 404, {
      "Content-Type": contentTypes.get(extension) ?? "application/octet-stream",
      "Cache-Control": stripBasePath(pathname).startsWith("/_next/static/")
        ? "public, max-age=31536000, immutable"
        : "no-cache",
      "X-Content-Type-Options": "nosniff",
    });
    if (request.method === "HEAD") {
      response.end();
      return;
    }
    createReadStream(filePath).pipe(response);
  } catch {
    response.writeHead(500, { "Content-Type": "text/plain; charset=utf-8" });
    response.end("Internal preview server error");
  }
});

server.listen(port, "127.0.0.1", () => {
  const previewPath = basePath ? `${basePath}/` : "/";
  console.log(
    `Static preview available at http://localhost:${port}${previewPath}`,
  );
});

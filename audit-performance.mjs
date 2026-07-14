import { readFile, readdir, stat } from "node:fs/promises";
import path from "node:path";
import process from "node:process";
import { gzipSync } from "node:zlib";

const outputDirectory = path.resolve("out");
const kibibyte = 1024;
const budgets = {
  htmlGzip: readBudget("PERF_MAX_HTML_GZIP_KIB", 40),
  pageJavaScriptGzip: readBudget("PERF_MAX_PAGE_JS_GZIP_KIB", 250),
  pageStylesGzip: readBudget("PERF_MAX_PAGE_CSS_GZIP_KIB", 50),
  singleJavaScriptGzip: readBudget("PERF_MAX_SINGLE_JS_GZIP_KIB", 100),
  singleImage: readBudget("PERF_MAX_IMAGE_KIB", 300),
};

function readBudget(name, fallback) {
  const value = process.env[name];
  if (value === undefined) return fallback * kibibyte;

  const number = Number(value);
  if (!Number.isFinite(number) || number <= 0) {
    throw new Error(`${name} must be a positive number of KiB.`);
  }
  return number * kibibyte;
}

async function walk(directory) {
  const entries = await readdir(directory, { withFileTypes: true });
  const files = await Promise.all(
    entries.map((entry) => {
      const entryPath = path.join(directory, entry.name);
      return entry.isDirectory() ? walk(entryPath) : entryPath;
    }),
  );
  return files.flat();
}

function formatBytes(bytes) {
  return `${(bytes / kibibyte).toFixed(1)} KiB`;
}

function localAssetPath(reference) {
  if (
    !reference ||
    /^(?:https?:|data:|blob:|mailto:|tel:|#)/i.test(reference)
  ) {
    return undefined;
  }

  let pathname;
  try {
    pathname = decodeURIComponent(reference.split("#")[0].split("?")[0]);
  } catch {
    return undefined;
  }

  const nextAssetMarker = pathname.indexOf("/_next/");
  if (nextAssetMarker >= 0) pathname = pathname.slice(nextAssetMarker);

  const relativePath = pathname.replace(/^\/+/, "");
  const candidate = path.resolve(outputDirectory, relativePath);
  const relativeCandidate = path.relative(outputDirectory, candidate);
  if (
    !relativeCandidate ||
    relativeCandidate.startsWith("..") ||
    path.isAbsolute(relativeCandidate)
  ) {
    return undefined;
  }
  return candidate;
}

function collectReferences(html, pattern) {
  return [
    ...new Set(
      [...html.matchAll(pattern)].map((match) => match[1]).filter(Boolean),
    ),
  ];
}

async function compressedSize(filePath, cache) {
  if (cache.has(filePath)) return cache.get(filePath);
  const content = await readFile(filePath);
  const size = gzipSync(content, { level: 9 }).byteLength;
  cache.set(filePath, size);
  return size;
}

let files;
try {
  files = await walk(outputDirectory);
} catch {
  throw new Error("Static export not found. Run `npm run build` first.");
}

const htmlFiles = files.filter((file) => file.endsWith(".html"));
if (htmlFiles.length === 0) {
  throw new Error("Static export contains no HTML files.");
}

const errors = [];
const gzipCache = new Map();
let largestHtml = { file: "", bytes: 0 };
let largestPageJavaScript = { file: "", bytes: 0 };
let largestPageStyles = { file: "", bytes: 0 };

for (const file of htmlFiles) {
  const htmlBuffer = await readFile(file);
  const html = htmlBuffer.toString("utf8");
  const relativeFile = path.relative(outputDirectory, file);
  const htmlGzipBytes = gzipSync(htmlBuffer, { level: 9 }).byteLength;

  if (htmlGzipBytes > largestHtml.bytes) {
    largestHtml = { file: relativeFile, bytes: htmlGzipBytes };
  }
  if (htmlGzipBytes > budgets.htmlGzip) {
    errors.push(
      `${relativeFile}: compressed HTML is ${formatBytes(htmlGzipBytes)} (budget ${formatBytes(budgets.htmlGzip)})`,
    );
  }

  const scriptReferences = collectReferences(
    html,
    /<script\b[^>]*\bsrc=["']([^"']+)["'][^>]*>/gi,
  );
  const styleReferences = collectReferences(
    html,
    /<link\b(?=[^>]*\brel=["']stylesheet["'])[^>]*\bhref=["']([^"']+)["'][^>]*>/gi,
  );

  if (scriptReferences.some((reference) => /^https?:/i.test(reference))) {
    errors.push(`${relativeFile}: external runtime scripts are not permitted`);
  }

  let pageJavaScriptBytes = 0;
  for (const reference of scriptReferences) {
    const assetPath = localAssetPath(reference);
    if (!assetPath) continue;
    try {
      pageJavaScriptBytes += await compressedSize(assetPath, gzipCache);
    } catch {
      errors.push(
        `${relativeFile}: JavaScript asset is missing (${reference})`,
      );
    }
  }

  let pageStyleBytes = 0;
  for (const reference of styleReferences) {
    const assetPath = localAssetPath(reference);
    if (!assetPath) continue;
    try {
      pageStyleBytes += await compressedSize(assetPath, gzipCache);
    } catch {
      errors.push(
        `${relativeFile}: stylesheet asset is missing (${reference})`,
      );
    }
  }

  if (pageJavaScriptBytes > largestPageJavaScript.bytes) {
    largestPageJavaScript = { file: relativeFile, bytes: pageJavaScriptBytes };
  }
  if (pageStyleBytes > largestPageStyles.bytes) {
    largestPageStyles = { file: relativeFile, bytes: pageStyleBytes };
  }
  if (pageJavaScriptBytes > budgets.pageJavaScriptGzip) {
    errors.push(
      `${relativeFile}: compressed page JavaScript is ${formatBytes(pageJavaScriptBytes)} (budget ${formatBytes(budgets.pageJavaScriptGzip)})`,
    );
  }
  if (pageStyleBytes > budgets.pageStylesGzip) {
    errors.push(
      `${relativeFile}: compressed page CSS is ${formatBytes(pageStyleBytes)} (budget ${formatBytes(budgets.pageStylesGzip)})`,
    );
  }
}

const imageExtensions = new Set([
  ".avif",
  ".gif",
  ".jpeg",
  ".jpg",
  ".png",
  ".webp",
]);

for (const file of files) {
  const extension = path.extname(file).toLowerCase();
  const relativeFile = path.relative(outputDirectory, file);

  if (extension === ".js") {
    const bytes = await compressedSize(file, gzipCache);
    if (bytes > budgets.singleJavaScriptGzip) {
      errors.push(
        `${relativeFile}: compressed JavaScript is ${formatBytes(bytes)} (budget ${formatBytes(budgets.singleJavaScriptGzip)})`,
      );
    }
  }

  if (imageExtensions.has(extension)) {
    const bytes = (await stat(file)).size;
    if (bytes > budgets.singleImage) {
      errors.push(
        `${relativeFile}: image is ${formatBytes(bytes)} (budget ${formatBytes(budgets.singleImage)})`,
      );
    }
  }
}

if (errors.length > 0) {
  console.error(
    `Static performance audit failed with ${errors.length} issue(s):`,
  );
  console.error(errors.map((error) => `- ${error}`).join("\n"));
  process.exitCode = 1;
} else {
  console.log(
    `Static performance budgets passed for ${htmlFiles.length} HTML files.`,
  );
  console.log(
    `Largest compressed HTML: ${formatBytes(largestHtml.bytes)} (${largestHtml.file}).`,
  );
  console.log(
    `Largest compressed page JavaScript: ${formatBytes(largestPageJavaScript.bytes)} (${largestPageJavaScript.file}).`,
  );
  console.log(
    `Largest compressed page CSS: ${formatBytes(largestPageStyles.bytes)} (${largestPageStyles.file}).`,
  );
}

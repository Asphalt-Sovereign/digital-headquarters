import { access, readdir, readFile } from "node:fs/promises";
import path from "node:path";
import process from "node:process";

const outputDirectory = path.resolve("out");
const repositoryName = process.env.GITHUB_REPOSITORY?.split("/")[1] ?? "";
const basePath =
  process.env.GITHUB_ACTIONS === "true" &&
  repositoryName &&
  !repositoryName.endsWith(".github.io")
    ? `/${repositoryName}`
    : "";

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

async function exists(filePath) {
  try {
    await access(filePath);
    return true;
  } catch {
    return false;
  }
}

function stripBasePath(pathname) {
  if (!basePath) return pathname;
  if (pathname === basePath) return "/";
  if (pathname.startsWith(`${basePath}/`))
    return pathname.slice(basePath.length);
  return pathname;
}

async function resolvesInExport(reference) {
  const cleanReference = reference.split("#")[0]?.split("?")[0] ?? "";
  if (!cleanReference || cleanReference.startsWith("#")) return true;
  if (/^(?:https?:|mailto:|tel:|data:|blob:)/.test(cleanReference)) return true;

  const pathname = stripBasePath(
    decodeURIComponent(
      cleanReference.startsWith("/") ? cleanReference : `/${cleanReference}`,
    ),
  );
  const relativePath = pathname.replace(/^\//, "");
  const candidates = pathname.endsWith("/")
    ? [path.join(outputDirectory, relativePath, "index.html")]
    : [
        path.join(outputDirectory, relativePath),
        path.join(outputDirectory, relativePath, "index.html"),
        path.join(outputDirectory, `${relativePath}.html`),
      ];

  for (const candidate of candidates) {
    if (await exists(candidate)) return true;
  }
  return false;
}

if (!(await exists(path.join(outputDirectory, "index.html")))) {
  throw new Error(
    "Static export is missing out/index.html. Run `npm run build` first.",
  );
}
if (!(await exists(path.join(outputDirectory, ".nojekyll")))) {
  throw new Error("Static export is missing out/.nojekyll.");
}

const htmlFiles = (await walk(outputDirectory)).filter((file) =>
  file.endsWith(".html"),
);
const errors = [];

for (const file of htmlFiles) {
  const html = await readFile(file, "utf8");
  const relativeFile = path.relative(outputDirectory, file);

  const requiredPatterns = [
    [/<html[^>]+lang="en"/i, "English language declaration"],
    [/<title>[^<]+<\/title>/i, "document title"],
    [/<meta[^>]+name="description"[^>]+content="[^"]+"/i, "meta description"],
    [
      /<link[^>]+rel="canonical"[^>]+href="https?:\/\//i,
      "absolute canonical URL",
    ],
    [/<main[^>]+id="main-content"/i, "main landmark"],
    [/<h1(?:\s|>)/i, "level-one heading"],
  ];

  for (const [pattern, label] of requiredPatterns) {
    if (!pattern.test(html)) errors.push(`${relativeFile}: missing ${label}`);
  }

  const ids = [...html.matchAll(/\sid="([^"]+)"/g)].map((match) => match[1]);
  const duplicateIds = [
    ...new Set(ids.filter((id, index) => ids.indexOf(id) !== index)),
  ];
  if (duplicateIds.length) {
    errors.push(`${relativeFile}: duplicate IDs (${duplicateIds.join(", ")})`);
  }

  const resourceTags = html.match(/<(?:a|img|link|script)\b[^>]*>/gi) ?? [];
  for (const tag of resourceTags) {
    const match = tag.match(/\s(?:href|src)="([^"]+)"/i);
    const reference = match?.[1];
    if (!reference) continue;
    if (!(await resolvesInExport(reference))) {
      errors.push(`${relativeFile}: unresolved reference ${reference}`);
    }
    if (/^<script\b/i.test(tag) && /\ssrc="https?:\/\//i.test(tag)) {
      errors.push(`${relativeFile}: external runtime script is not permitted`);
    }
  }
}

if (errors.length) {
  console.error(errors.join("\n"));
  process.exitCode = 1;
} else {
  console.log(
    `Validated ${htmlFiles.length} HTML files and their local references.`,
  );
}

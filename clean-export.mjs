import { access, rm } from "node:fs/promises";
import path from "node:path";
import process from "node:process";

const projectRoot = process.cwd();
const packageManifest = path.join(projectRoot, "package.json");
const generatedDirectories = [".next", "out"];

async function exists(filePath) {
  try {
    await access(filePath);
    return true;
  } catch {
    return false;
  }
}

if (!(await exists(packageManifest))) {
  throw new Error(
    "Unable to find package.json. Run clean-export from the project root.",
  );
}

for (const directory of generatedDirectories) {
  const target = path.resolve(projectRoot, directory);
  const relativeTarget = path.relative(projectRoot, target);

  if (
    !relativeTarget ||
    relativeTarget.startsWith("..") ||
    path.isAbsolute(relativeTarget)
  ) {
    throw new Error(`Refusing to remove unsafe path: ${target}`);
  }

  await rm(target, { force: true, recursive: true });
}

console.log(
  `Removed generated export directories: ${generatedDirectories.join(", ")}.`,
);

import type { NextConfig } from "next";
import { withContentCollections } from "@content-collections/next";

const repositoryName = process.env.GITHUB_REPOSITORY?.split("/")[1] ?? "";
const isUserOrOrganizationSite = repositoryName.endsWith(".github.io");
const inferredBasePath =
  process.env.GITHUB_ACTIONS === "true" &&
  repositoryName &&
  !isUserOrOrganizationSite
    ? `/${repositoryName}`
    : "";
const explicitBasePath = process.env.NEXT_PUBLIC_BASE_PATH;
const basePath =
  explicitBasePath === undefined
    ? inferredBasePath
    : explicitBasePath.replace(/\/$/, "");

const nextConfig: NextConfig = {
  output: "export",
  basePath,
  assetPrefix: basePath || undefined,
  trailingSlash: true,
  images: {
    unoptimized: true,
  },
  poweredByHeader: false,
  reactStrictMode: true,
};

export default withContentCollections(nextConfig) as NextConfig;

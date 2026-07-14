# Deployment guide

Version 1.1 supports two GitHub Pages modes. The distinction matters because GitHub assigns the organization-root URL only to a repository named asphalt-sovereign.github.io. A repository named digital-headquarters normally publishes as a project site.

## Required organization structure

    github.com/Asphalt-Sovereign
    ├── digital-headquarters                 # editable source
    └── asphalt-sovereign.github.io          # generated organization-root export

The second repository is required only for the exact root target:

    https://asphalt-sovereign.github.io

Publishing GitHub Pages directly from digital-headquarters produces:

    https://asphalt-sovereign.github.io/digital-headquarters/

The source and deployment workflows support both paths. They do not present the two GitHub Pages modes as interchangeable.

## Source-repository setup

1. Create the public organization Asphalt-Sovereign if it does not already exist.
2. Create a repository named digital-headquarters.
3. Push this project to its main branch.
4. In Settings → Pages, set Build and deployment → Source to GitHub Actions.
5. Push to main or run Deploy website to GitHub Pages manually.

The standard workflow:

1. Sets the project-site canonical URL and build identifier.
2. Installs the locked dependency graph.
3. Validates Content Collections, JSON cross-references, lint, TypeScript, and formatting.
4. Produces a static export with /digital-headquarters as its base path.
5. Validates internal links, SEO metadata, structured data, and local assets.
6. Enforces the performance budget.
7. Deploys through GitHub's first-party Pages artifact actions.

No secret, backend, paid service, or runtime API is required for this project-site mode.

## Exact organization-root deployment

Complete these one-time steps after the source repository is working:

1. Create a public repository named Asphalt-Sovereign/asphalt-sovereign.github.io.
2. In that repository, configure Pages to deploy from the main branch at the repository root.
3. Create a fine-grained personal access token or GitHub App credential with Contents: Read and write permission only for Asphalt-Sovereign/asphalt-sovereign.github.io.
4. Add it to digital-headquarters as an Actions secret named ORG_PAGES_TOKEN.
5. Add a repository Actions variable named PUBLISH_ORG_ROOT with the value true.
6. Run Publish organization root, or push to main.

The root workflow rebuilds with:

    NEXT_PUBLIC_SITE_URL=https://asphalt-sovereign.github.io
    NEXT_PUBLIC_BASE_PATH=

It validates the same artifact, then mirrors only out/ into the organization Pages repository. Later pushes require no manual deployment step.

Keep branch protection and token scope consistent with this automation. If direct pushes to the destination main branch are prohibited, use a GitHub App or an approved deployment branch rather than weakening organization controls.

## Local preflight

Requirements: Node.js 22 or newer and npm.

    npm ci
    npm run validate
    npm start

The final static artifact is out/. The validation command checks source data, content schemas, formatting, TypeScript, lint, the production build, internal references, SEO primitives, structured data, images, and performance budgets.

## Verify after deployment

Check the deployed URL in a private browser session:

- Home, Mission, Projects, Evidence, Research, Engineering Log, Documentation, Dashboard, Open Source, and Company routes load.
- Dark mode and command search work by keyboard.
- Directly opening a nested route does not return 404.
- robots.txt, sitemap.xml, manifest.webmanifest, icon.svg, and og-card.png resolve.
- Canonical, Open Graph, and Twitter URLs use the deployed origin and correct base path.
- The footer build identifier matches the source commit.
- Repository URLs remain marked unverified until each target exists and is checked.

## Publish company channels

Edit src/data/site.json. Change verification flags only after checking the public organization or profile. Do not use private email addresses, numbers, locations, or unconfirmed social profiles.

Repository publication states live in src/data/repositories.json. Setting verified to true also requires publication to be Published; the data validator rejects inconsistent states.

## Custom domain

1. Verify the domain in the GitHub organization.
2. Configure the domain on the repository serving the final Pages site.
3. Apply the DNS records GitHub provides.
4. Set NEXT_PUBLIC_SITE_URL to the verified HTTPS origin in the relevant workflow.
5. Rebuild and verify canonical URLs, sitemap, robots, manifest, social image, and all nested routes.

## Common failures

### Assets return 404

Confirm the correct workflow built the site. A project-site build requires /digital-headquarters; the root mirror explicitly overrides the base path to empty.

### Root workflow is skipped

Confirm the PUBLISH_ORG_ROOT repository variable is exactly true. The workflow is deliberately inert until the destination repository and scoped credential exist.

### Root workflow cannot push

Confirm ORG_PAGES_TOKEN can write only to Asphalt-Sovereign/asphalt-sovereign.github.io and destination branch rules permit the automation identity.

### Content Collections fails

Fix the named MDX frontmatter field. Do not bypass the schema.

### Data validation fails

Fix the stale or unknown project, evidence, photograph, repository, dashboard, or release cross-reference. Counts are checked against their actual source records.

### Canonical URLs are wrong

Use the provided workflow. A local or custom build must set NEXT_PUBLIC_SITE_URL; the root mirror must also set an explicitly empty NEXT_PUBLIC_BASE_PATH.

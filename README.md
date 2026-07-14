# Asphalt Sovereign — Digital Headquarters

The production website and public engineering record for Asphalt Sovereign, an early-stage Indian automotive engineering startup working on vehicle intelligence, diagnostics, telemetry, alternative-fuel research, and practical technology-neutral mobility.

Version 1.1 preserves the Version 1.0 design, routes, static architecture, and interaction model while adding stronger evidence, lifecycle, content, deployment, SEO, and quality controls.

## Current public boundary

- Company stage: early-stage deep-tech startup
- Current program: Project Omega
- Test platform: 2015 Yamaha R15 V2, identified publicly as TV-001
- Software: OctaneOS interface and data-contract prototype
- Hardware: SAN-V1 observation-only architecture and bench preparation
- Validation: in progress; no alternative-fuel performance, emissions, durability, pilot, customer, or production result is claimed
- GitHub: organization and repository targets are prepared but remain unverified until publication

The operational source is [src/data/dashboard.json](src/data/dashboard.json). Registered claims and limitations are in [src/data/evidence.json](src/data/evidence.json).

## Stack

- Next.js 16 App Router and React 19
- TypeScript strict mode
- Tailwind CSS 4
- Framer Motion with reduced-motion support
- MDX through type-safe Content Collections
- Static export for GitHub Pages
- GitHub Actions for validation and deployment

There is no backend, runtime database, paid API, analytics service, external font, or runtime repository API.

## Run locally

Requirements: Node.js 22 or newer and npm.

    npm ci
    npm run dev

Open http://localhost:3000.

Run the complete release gate:

    npm run validate

Preview the generated static export:

    npm start

## Version 1.1 information architecture

    Home
    ├── Mission
    ├── Projects
    │   └── Lifecycle and evidence-linked case studies
    ├── Evidence Index
    │   ├── Claim-to-evidence chains
    │   └── Authentic-photography requirements
    ├── Research
    │   └── Searchable MDX knowledge records
    ├── Engineering Log
    │   └── Structured weekly MDX records
    ├── Documentation
    │   ├── Architecture
    │   ├── Hardware
    │   ├── Software
    │   ├── Testing
    │   ├── Development
    │   ├── Standards
    │   ├── Safety
    │   └── Future Work
    └── Company
        ├── Rationale
        ├── Timeline
        ├── Team
        ├── Dashboard
        ├── Open Source
        └── Contact

## Editing without code changes

| Public record                                          | Source                         |
| ------------------------------------------------------ | ------------------------------ |
| Company identity and confirmed public links            | src/data/site.json             |
| Release version, build fallback, and update date       | src/data/release.json          |
| Dashboard cards, sprint, tasks, topics, and milestones | src/data/dashboard.json        |
| Project case studies and seven-stage lifecycle         | src/data/projects.json         |
| Claim-to-evidence chains                               | src/data/evidence.json         |
| Photography categories and evidence requirements       | src/data/photography.json      |
| GitHub organization and repository registry            | src/data/repositories.json     |
| Confirmed roles and open organization structure        | src/data/team.json             |
| Engineering logs                                       | content/engineering-logs/*.mdx |
| Research knowledge records                             | content/research/*.mdx         |
| Versioned technical documentation                      | content/docs/*.mdx             |

Content Collections validates MDX frontmatter. The JSON validator checks lifecycle order, evidence, photography, repository and dashboard cross-references, derived counts, publication states, and release-version alignment.

## Project status vocabulary

Every project exposes the same lifecycle:

1. Concept
2. Research
3. Prototype
4. Testing
5. Validation
6. Pilot
7. Production

Exactly one stage is active. Later stages remain pending. Documentation availability, repository publication, and validation state are reported separately so one cannot be mistaken for another.

Evidence states distinguish simulated, bench, vehicle, reviewed, documented, pending, and not-published records. The phrase Validation in Progress does not state that validation has passed.

## Quality gate

The validation pipeline runs:

1. Content Collections and route type generation.
2. Cross-record JSON validation.
3. ESLint with zero warnings.
4. TypeScript strict checking.
5. Static production export.
6. HTML, internal-link, asset, SEO, structured-data, and accessibility-primitive checks.
7. Route JavaScript, CSS, HTML, raster-image, and total-export budgets.
8. Prettier verification.

No Lighthouse score is claimed without a browser measurement against the deployed site. The repository enforces the prerequisites and budgets that are deterministic at build time.

## GitHub Pages deployment

The standard workflow publishes digital-headquarters as:

    https://asphalt-sovereign.github.io/digital-headquarters/

GitHub reserves the exact organization root for a repository named asphalt-sovereign.github.io. Version 1.1 therefore includes an optional, scoped root-mirror workflow that keeps digital-headquarters as the editable source and publishes its verified out/ artifact to:

    https://asphalt-sovereign.github.io

The one-time setup, token scope, repository variable, project-site mode, and root-site mode are documented in [DEPLOYMENT.md](DEPLOYMENT.md).

## Engineering publication rules

- Register material physical, performance, validation, and status claims in the Evidence Index.
- Keep limitations adjacent to the claim they constrain.
- Never substitute stock imagery for workshop, vehicle, prototype, CAD, PCB, logging, team, or research evidence.
- Never present simulated data as bench or vehicle data.
- Do not publish unconfirmed people, profiles, awards, investors, customers, funding, pilots, repositories, or product availability.
- Preserve failed and inconclusive tests.
- Keep source usable without runtime services.

## Contributing and license

See [CONTRIBUTING.md](CONTRIBUTING.md) for evidence, content, accessibility, and review requirements.

Source code is available under the [MIT License](LICENSE). Company names, marks, project evidence, and editorial content retain their stated attribution unless a repository defines another license.

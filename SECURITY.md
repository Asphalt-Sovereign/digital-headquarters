# Security policy

This repository produces a static public website and must not contain secrets, vehicle owner information, private contact details, access tokens, unpublished pitch materials, or sensitive test-location data.

Report a suspected vulnerability through a confirmed private company channel once one is published. Until then, do not publish exploit details in a public issue.

Dependencies are installed from the committed lockfile in CI. Review dependency updates and preserve the static, backend-free architecture unless a separate security design is completed.

The optional organization-root deployment uses `ORG_PAGES_TOKEN`. Scope that credential to **Contents: Read and write** on `Asphalt-Sovereign/asphalt-sovereign.github.io` only. Never place the token in source, workflow text, logs, repository JSON, or a local environment file that can be committed. Prefer a narrowly installed GitHub App where organization policy supports it.

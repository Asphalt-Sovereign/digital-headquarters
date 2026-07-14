import { readFile } from "node:fs/promises";
import path from "node:path";
import process from "node:process";

const dataDirectory = path.resolve("src/data");
const errors = [];

function report(location, message) {
  errors.push(`${location}: ${message}`);
}

function isRecord(value) {
  return value !== null && typeof value === "object" && !Array.isArray(value);
}

function requireRecord(value, location) {
  if (!isRecord(value)) {
    report(location, "must be an object");
    return false;
  }
  return true;
}

function requireArray(value, location, { allowEmpty = false } = {}) {
  if (!Array.isArray(value)) {
    report(location, "must be an array");
    return false;
  }
  if (!allowEmpty && value.length === 0) {
    report(location, "must not be empty");
    return false;
  }
  return true;
}

function requireString(value, location, { allowEmpty = false } = {}) {
  if (typeof value !== "string") {
    report(location, "must be a string");
    return false;
  }
  if (!allowEmpty && value.trim().length === 0) {
    report(location, "must not be empty");
    return false;
  }
  return true;
}

function requireOptionalString(value, location) {
  if (value !== undefined && value !== null) requireString(value, location);
}

function validateDate(value, location) {
  if (!requireString(value, location)) return;
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) {
    report(location, "must use YYYY-MM-DD format");
    return;
  }

  const date = new Date(`${value}T00:00:00.000Z`);
  if (
    Number.isNaN(date.valueOf()) ||
    date.toISOString().slice(0, 10) !== value
  ) {
    report(location, "must be a valid calendar date");
  }
}

function validateUrl(value, location) {
  if (value === undefined || value === null) return;
  if (!requireString(value, location)) return;

  try {
    const url = new URL(value);
    if (url.protocol !== "https:" && url.protocol !== "http:") {
      report(location, "must use http or https");
    }
  } catch {
    report(location, "must be an absolute URL");
  }
}

function validateEmail(value, location) {
  if (value === undefined || value === null) return;
  if (!requireString(value, location)) return;
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)) {
    report(location, "must be a valid email address");
  }
}

function validateUniqueStrings(values, location) {
  if (!Array.isArray(values)) return;
  const seen = new Set();

  values.forEach((value, index) => {
    if (!requireString(value, `${location}[${index}]`)) return;
    const normalized = value.trim().toLowerCase();
    if (seen.has(normalized)) {
      report(`${location}[${index}]`, `duplicates "${value}"`);
    }
    seen.add(normalized);
  });
}

async function loadJson(fileName) {
  const filePath = path.join(dataDirectory, fileName);
  let source;

  try {
    source = await readFile(filePath, "utf8");
  } catch (error) {
    report(fileName, `could not be read (${error.message})`);
    return undefined;
  }

  try {
    return JSON.parse(source);
  } catch (error) {
    report(fileName, `contains invalid JSON (${error.message})`);
    return undefined;
  }
}

function validateSite(site) {
  const file = "site.json";
  if (!requireRecord(site, file)) return;

  requireString(site.name, `${file}.name`);
  requireString(site.description, `${file}.description`);
  requireOptionalString(site.legalName, `${file}.legalName`);
  requireOptionalString(site.founder, `${file}.founder`);
  requireOptionalString(site.founderRole, `${file}.founderRole`);
  requireOptionalString(site.location, `${file}.location`);
  requireOptionalString(site.founded, `${file}.founded`);
  validateEmail(site.email, `${file}.email`);
  validateUrl(site.github, `${file}.github`);
  validateUrl(site.linkedin, `${file}.linkedin`);
  validateUrl(site.resume, `${file}.resume`);
  validateUrl(site.pitchDeck, `${file}.pitchDeck`);
}

function validateDashboard(dashboard) {
  const file = "dashboard.json";
  if (!requireRecord(dashboard, file)) return;

  validateDate(dashboard.lastUpdated, `${file}.lastUpdated`);
  requireString(
    dashboard.companyStage ?? dashboard.stage,
    `${file}.companyStage|stage`,
  );
  requireString(
    dashboard.currentPrototypeVersion ?? dashboard.prototypeVersion,
    `${file}.currentPrototypeVersion|prototypeVersion`,
  );
  requireString(
    dashboard.vehiclePlatform ?? dashboard.testPlatform,
    `${file}.vehiclePlatform|testPlatform`,
  );

  const researchTopics =
    dashboard.currentResearchTopics ??
    dashboard.researchTopics ??
    dashboard.researchAreas;
  if (requireArray(researchTopics, `${file}.researchTopics`)) {
    validateUniqueStrings(researchTopics, `${file}.researchTopics`);
  }

  if (dashboard.openTasks !== undefined) {
    if (
      requireArray(dashboard.openTasks, `${file}.openTasks`, {
        allowEmpty: true,
      })
    ) {
      const labels = [];
      dashboard.openTasks.forEach((task, index) => {
        const location = `${file}.openTasks[${index}]`;
        if (!requireRecord(task, location)) return;
        if (requireString(task.label ?? task.title, `${location}.label`)) {
          labels.push(task.label ?? task.title);
        }
        requireOptionalString(task.area, `${location}.area`);
        requireOptionalString(task.priority, `${location}.priority`);
        requireOptionalString(task.status, `${location}.status`);
      });
      validateUniqueStrings(labels, `${file}.openTasks labels`);
    }
  }

  if (dashboard.roadmap !== undefined) {
    const roadmap = dashboard.roadmap;
    const location = `${file}.roadmap`;
    if (requireRecord(roadmap, location)) {
      if (requireArray(roadmap.items, `${location}.items`)) {
        roadmap.items.forEach((item, index) => {
          const itemLocation = `${location}.items[${index}]`;
          if (!requireRecord(item, itemLocation)) return;
          requireString(item.label ?? item.title, `${itemLocation}.label`);
          requireString(item.status, `${itemLocation}.status`);
        });

        if (
          roadmap.totalMilestones !== undefined &&
          roadmap.totalMilestones !== roadmap.items.length
        ) {
          report(
            `${location}.totalMilestones`,
            `must equal roadmap.items.length (${roadmap.items.length})`,
          );
        }
      }

      if (
        roadmap.completedMilestones !== undefined &&
        (!Number.isInteger(roadmap.completedMilestones) ||
          roadmap.completedMilestones < 0)
      ) {
        report(
          `${location}.completedMilestones`,
          "must be a non-negative integer",
        );
      }
    }
  }

  if (dashboard.repositories !== undefined) {
    const repositories = dashboard.repositories;
    const location = `${file}.repositories`;
    if (Array.isArray(repositories)) {
      validateRepositoryItems(repositories, location);
    } else if (requireRecord(repositories, location)) {
      if (typeof repositories.connected !== "boolean") {
        report(`${location}.connected`, "must be a boolean");
      }
      if (
        requireArray(repositories.items, `${location}.items`, {
          allowEmpty: true,
        })
      ) {
        validateRepositoryItems(repositories.items, `${location}.items`);
      }
    }
  }
}

function validateRepositoryItems(repositories, location) {
  const names = [];
  repositories.forEach((repository, index) => {
    const itemLocation = `${location}[${index}]`;
    if (!requireRecord(repository, itemLocation)) return;
    const name = repository.name ?? repository.title;
    if (requireString(name, `${itemLocation}.name`)) names.push(name);
    requireOptionalString(
      repository.description,
      `${itemLocation}.description`,
    );
    requireOptionalString(repository.visibility, `${itemLocation}.visibility`);
    validateUrl(repository.url ?? repository.htmlUrl, `${itemLocation}.url`);
  });
  validateUniqueStrings(names, `${location} names`);
}

function validateProjects(projects) {
  const file = "projects.json";
  if (!requireArray(projects, file)) return;

  const slugs = [];
  const codes = [];
  const requiredLists = [
    "objectives",
    "progress",
    "architecture",
    "hardware",
    "software",
    "research",
    "challenges",
    "roadmap",
  ];

  projects.forEach((project, index) => {
    const location = `${file}[${index}]`;
    if (!requireRecord(project, location)) return;

    if (requireString(project.slug, `${location}.slug`)) {
      slugs.push(project.slug);
      if (!/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(project.slug)) {
        report(`${location}.slug`, "must be a lowercase URL slug");
      }
    }
    requireString(project.name, `${location}.name`);
    requireString(project.status, `${location}.status`);
    requireString(project.summary, `${location}.summary`);
    requireString(project.overview, `${location}.overview`);
    requireString(project.problem, `${location}.problem`);
    requireString(project.limitations, `${location}.limitations`);

    if (project.code !== undefined) {
      if (requireString(project.code, `${location}.code`))
        codes.push(project.code);
    }

    requiredLists.forEach((key) => {
      if (!requireArray(project[key], `${location}.${key}`)) return;

      project[key].forEach((item, itemIndex) => {
        const itemLocation = `${location}.${key}[${itemIndex}]`;
        if (typeof item === "string") {
          requireString(item, itemLocation);
          return;
        }
        if (!requireRecord(item, itemLocation)) return;
        requireString(
          item.label ?? item.name ?? item.title,
          `${itemLocation}.label`,
        );
        requireOptionalString(item.detail, `${itemLocation}.detail`);
        requireOptionalString(item.status, `${itemLocation}.status`);
      });
    });
  });

  validateUniqueStrings(slugs, `${file} slugs`);
  validateUniqueStrings(codes, `${file} codes`);
}

function validateTeam(team) {
  const file = "team.json";
  if (!requireRecord(team, file)) return;

  if (team.founder !== undefined) {
    const founder = team.founder;
    const location = `${file}.founder`;
    if (requireRecord(founder, location)) {
      requireString(founder.name, `${location}.name`);
      requireString(founder.role, `${location}.role`);
      requireString(founder.bio, `${location}.bio`);
      if (requireArray(founder.skills, `${location}.skills`)) {
        validateUniqueStrings(founder.skills, `${location}.skills`);
      }
      if (
        requireArray(founder.responsibilities, `${location}.responsibilities`)
      ) {
        validateUniqueStrings(
          founder.responsibilities,
          `${location}.responsibilities`,
        );
      }
    }
  }

  if (team.openStructure !== undefined) {
    if (requireArray(team.openStructure, `${file}.openStructure`)) {
      team.openStructure.forEach((entry, index) => {
        const location = `${file}.openStructure[${index}]`;
        if (!requireRecord(entry, location)) return;
        requireString(entry.group, `${location}.group`);
        requireString(entry.status, `${location}.status`);
        requireString(entry.note, `${location}.note`);
      });
    }
  }
}

const [site, dashboard, projects, team] = await Promise.all([
  loadJson("site.json"),
  loadJson("dashboard.json"),
  loadJson("projects.json"),
  loadJson("team.json"),
]);

if (site !== undefined) validateSite(site);
if (dashboard !== undefined) validateDashboard(dashboard);
if (projects !== undefined) validateProjects(projects);
if (team !== undefined) validateTeam(team);

if (errors.length > 0) {
  console.error(`Data validation failed with ${errors.length} issue(s):`);
  console.error(errors.map((error) => `- ${error}`).join("\n"));
  process.exitCode = 1;
} else {
  console.log(
    `Validated 4 data files${Array.isArray(projects) ? ` and ${projects.length} projects` : ""}.`,
  );
}

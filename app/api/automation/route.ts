import { existsSync, mkdirSync, readFileSync, renameSync, rmSync, writeFileSync } from "fs";
import { dirname, isAbsolute, join, relative, resolve } from "path";
import { NextResponse } from "next/server";
import { getAgentDir, loadSkillsFromDir, parseFrontmatter } from "@earendil-works/pi-coding-agent";

export const dynamic = "force-dynamic";

interface AutomationSkill {
  name: string;
  description: string;
  filePath: string;
  baseDir: string;
  source: "manual" | "unknown";
  lastRun: string;
  status: "ready";
}

function skillsRoot(): string {
  return join(getAgentDir(), "skills");
}

function readAutomationMeta(filePath: string): { isAutomation: boolean; source: "manual" | "unknown" } {
  try {
    const raw = readFileSync(filePath, "utf8");
    const { frontmatter } = parseFrontmatter<Record<string, unknown>>(raw);
    return {
      isAutomation: frontmatter["pi-web-automation"] === true,
      source: frontmatter.source === "manual" ? "manual" : "unknown",
    };
  } catch {
    return { isAutomation: false, source: "unknown" };
  }
}

function isInsideSkillsRoot(path: string): boolean {
  const root = resolve(skillsRoot());
  const target = resolve(path);
  const rel = relative(root, target);
  return rel === "" || (!rel.startsWith("..") && !isAbsolute(rel));
}

function getAutomationSkill(filePath: string): AutomationSkill | null {
  if (!filePath || !isInsideSkillsRoot(filePath) || !existsSync(filePath)) return null;
  const { skills } = loadSkillsFromDir({ dir: skillsRoot(), source: "user" });
  const skill = skills.find((item) => item.filePath === filePath);
  if (!skill) return null;
  const meta = readAutomationMeta(skill.filePath);
  if (!meta.isAutomation) return null;
  return {
    name: skill.name,
    description: skill.description,
    filePath: skill.filePath,
    baseDir: skill.baseDir,
    source: meta.source,
    lastRun: "Never",
    status: "ready",
  };
}

function loadAutomationSkills(): AutomationSkill[] {
  const { skills } = loadSkillsFromDir({ dir: skillsRoot(), source: "user" });
  return skills
    .map((skill) => {
      const meta = readAutomationMeta(skill.filePath);
      if (!meta.isAutomation) return null;
      return {
        name: skill.name,
        description: skill.description,
        filePath: skill.filePath,
        baseDir: skill.baseDir,
        source: meta.source,
        lastRun: "Never",
        status: "ready" as const,
      };
    })
    .filter((skill): skill is AutomationSkill => skill !== null)
    .sort((a, b) => a.name.localeCompare(b.name));
}

function validateName(name: string): string | null {
  if (!name) return "Skill name is required";
  if (name.length > 64) return "Skill name must be 64 characters or less";
  if (!/^[a-z0-9-]+$/.test(name)) return "Use lowercase letters, numbers, and hyphens only";
  if (name.startsWith("-") || name.endsWith("-")) return "Skill name cannot start or end with a hyphen";
  if (name.includes("--")) return "Skill name cannot contain consecutive hyphens";
  return null;
}

function yamlString(value: string): string {
  return JSON.stringify(value);
}

function skillContent(name: string, description: string): string {
  return `---\nname: ${yamlString(name)}\ndescription: ${yamlString(description)}\npi-web-automation: true\nsource: manual\n---\n\n# ${name}\n\n${description}\n\n## Workflow\n\nDescribe the steps this automation should perform.\n\n## Notes\n\n- Add workflow details here.\n`;
}

function bodyWithoutFrontmatter(content: string): string {
  if (!content.startsWith("---")) return content;
  const match = content.match(/^---\r?\n[\s\S]*?\r?\n---\r?\n?/);
  return match ? content.slice(match[0].length) : content;
}

function updatedSkillContent(filePath: string, name: string, description: string): string {
  const body = bodyWithoutFrontmatter(readFileSync(filePath, "utf8")).trimStart();
  return `---\nname: ${yamlString(name)}\ndescription: ${yamlString(description)}\npi-web-automation: true\nsource: manual\n---\n\n${body}`;
}

export async function GET() {
  try {
    return NextResponse.json({ skills: loadAutomationSkills(), skillsRoot: skillsRoot() });
  } catch (e) {
    return NextResponse.json({ error: String(e) }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const body = await req.json() as { name?: unknown; description?: unknown; source?: unknown };
    const name = typeof body.name === "string" ? body.name.trim() : "";
    const description = typeof body.description === "string" ? body.description.trim() : "";
    const source = typeof body.source === "string" ? body.source : "blank";

    const nameError = validateName(name);
    if (nameError) return NextResponse.json({ error: nameError }, { status: 400 });
    if (!description) return NextResponse.json({ error: "Description is required" }, { status: 400 });
    if (source !== "blank") return NextResponse.json({ error: "Only blank automation skills are supported for now" }, { status: 400 });

    const root = skillsRoot();
    const dir = join(root, name);
    const filePath = join(dir, "SKILL.md");
    if (existsSync(filePath)) return NextResponse.json({ error: "An automation skill with this name already exists" }, { status: 409 });

    mkdirSync(dir, { recursive: true });
    writeFileSync(filePath, skillContent(name, description), { encoding: "utf8", flag: "wx" });

    const skill: AutomationSkill = {
      name,
      description,
      filePath,
      baseDir: dir,
      source: "manual",
      lastRun: "Never",
      status: "ready",
    };
    return NextResponse.json({ success: true, skill, skillsRoot: root });
  } catch (e) {
    const message = e instanceof Error ? e.message : String(e);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function PATCH(req: Request) {
  try {
    const body = await req.json() as { filePath?: unknown; name?: unknown; description?: unknown };
    const filePath = typeof body.filePath === "string" ? body.filePath : "";
    const name = typeof body.name === "string" ? body.name.trim() : "";
    const description = typeof body.description === "string" ? body.description.trim() : "";

    const existing = getAutomationSkill(filePath);
    if (!existing) return NextResponse.json({ error: "Automation skill not found" }, { status: 404 });

    const nameError = validateName(name);
    if (nameError) return NextResponse.json({ error: nameError }, { status: 400 });
    if (!description) return NextResponse.json({ error: "Description is required" }, { status: 400 });

    let nextDir = existing.baseDir;
    let nextFilePath = existing.filePath;
    if (name !== existing.name) {
      nextDir = join(skillsRoot(), name);
      nextFilePath = join(nextDir, "SKILL.md");
      if (existsSync(nextFilePath)) return NextResponse.json({ error: "An automation skill with this name already exists" }, { status: 409 });
      if (!isInsideSkillsRoot(nextDir)) return NextResponse.json({ error: "Invalid skill path" }, { status: 400 });
      renameSync(existing.baseDir, nextDir);
    }

    writeFileSync(nextFilePath, updatedSkillContent(nextFilePath, name, description), "utf8");
    const skill = getAutomationSkill(nextFilePath);
    if (!skill) return NextResponse.json({ error: "Updated skill could not be loaded" }, { status: 500 });
    return NextResponse.json({ success: true, skill, skillsRoot: skillsRoot() });
  } catch (e) {
    const message = e instanceof Error ? e.message : String(e);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function DELETE(req: Request) {
  try {
    const body = await req.json() as { filePath?: unknown };
    const filePath = typeof body.filePath === "string" ? body.filePath : "";
    const existing = getAutomationSkill(filePath);
    if (!existing) return NextResponse.json({ error: "Automation skill not found" }, { status: 404 });

    const dir = dirname(existing.filePath);
    if (!isInsideSkillsRoot(dir) || resolve(dir) === resolve(skillsRoot())) {
      return NextResponse.json({ error: "Invalid skill path" }, { status: 400 });
    }
    rmSync(dir, { recursive: true, force: true });
    return NextResponse.json({ success: true });
  } catch (e) {
    const message = e instanceof Error ? e.message : String(e);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

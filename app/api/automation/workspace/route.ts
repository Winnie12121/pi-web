import { existsSync, mkdirSync, writeFileSync } from "fs";
import { join } from "path";
import { NextResponse } from "next/server";
import { getAgentDir } from "@earendil-works/pi-coding-agent";

const NAME_RE = /^[a-zA-Z0-9][a-zA-Z0-9 _.-]{0,79}$/;

function slugName(name: string): string {
  return name.trim().replace(/\s+/g, "-");
}

function scaffoldSkill(name: string): string {
  return `---
name: ${name}
description: Reusable automation skill workspace.
pi-web-automation: true
source: manual
---

# ${name}

## Goal
Describe what this automation should accomplish.

## Inputs
- TODO: List required inputs and their expected formats.

## Preconditions
- TODO: List any required account, file, or environment setup.

## Steps
1. TODO: Add the first workflow step.
2. TODO: Add follow-up steps.

## Outputs
- TODO: Describe expected output files or final state.
`;
}

function writeIfMissing(filePath: string, content: string) {
  if (!existsSync(filePath)) {
    writeFileSync(filePath, content, "utf8");
  }
}

export async function POST(req: Request) {
  try {
    const body = await req.json().catch(() => ({})) as { name?: unknown };
    const rawName = typeof body.name === "string" ? body.name : "";
    const name = slugName(rawName);

    if (!name || !NAME_RE.test(name)) {
      return NextResponse.json({ error: "Invalid skill name" }, { status: 400 });
    }

    const cwd = join(getAgentDir(), "skills", name);
    mkdirSync(join(cwd, "scripts"), { recursive: true });
    mkdirSync(join(cwd, "references"), { recursive: true });
    mkdirSync(join(cwd, "outputs"), { recursive: true });

    writeIfMissing(join(cwd, "SKILL.md"), scaffoldSkill(name));
    writeIfMissing(join(cwd, "scripts", "README.md"), "# Scripts\n\nHelper scripts for this automation skill live here.\n");
    writeIfMissing(join(cwd, "references", "locator-notes.md"), "# Locator Notes\n\n- TODO: Add stable selectors, labels, or UI notes for this workflow.\n");
    writeIfMissing(join(cwd, "references", "recorded-steps.md"), "# Recorded Steps\n\n- TODO: Add captured or manually documented workflow steps.\n");
    writeIfMissing(join(cwd, "references", "example-input.md"), "# Example Input\n\n- TODO: Add representative input values for testing this automation.\n");
    writeIfMissing(join(cwd, "outputs", "latest-result.json"), "{\n  \"status\": \"ready\",\n  \"outputs\": []\n}\n");

    globalThis.__piAllowedRootsCache?.roots.add(cwd);
    globalThis.__piAllowedRootsCache?.roots.add(join(getAgentDir(), "skills"));

    return NextResponse.json({ cwd, name });
  } catch (error) {
    return NextResponse.json({ error: String(error) }, { status: 500 });
  }
}

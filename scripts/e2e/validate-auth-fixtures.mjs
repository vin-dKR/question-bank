import fs from "node:fs";
import path from "node:path";

const requiredPersonas = [
    "teacherOwner",
    "instituteAdmin",
    "organizationMember",
    "organizationViewer",
];
const manifestArgument = process.argv[2] ?? process.env.E2E_AUTH_MANIFEST;

if (!manifestArgument) {
    console.error(
        "Set E2E_AUTH_MANIFEST or pass a manifest path. Start from e2e/auth-manifest.example.json.",
    );
    process.exitCode = 1;
} else {
    const manifestPath = path.resolve(manifestArgument);
    const manifest = JSON.parse(fs.readFileSync(manifestPath, "utf8"));
    const errors = [];

    if (manifest.schemaVersion !== 1) errors.push("schemaVersion must be 1");

    for (const personaId of requiredPersonas) {
        const persona = manifest.personas?.[personaId];
        if (!persona) {
            errors.push(`missing personas.${personaId}`);
            continue;
        }

        for (const field of [
            "storageState",
            "kind",
            "organizationRole",
            "homePath",
            "identityText",
            "organizationName",
            "dataset",
        ]) {
            if (!persona[field]) errors.push(`personas.${personaId}.${field} is required`);
        }

        if (persona.storageState) {
            const statePath = path.resolve(path.dirname(manifestPath), persona.storageState);
            if (!fs.existsSync(statePath)) {
                errors.push(`missing storage state: ${statePath}`);
            } else {
                const state = JSON.parse(fs.readFileSync(statePath, "utf8"));
                if (!Array.isArray(state.cookies) || !Array.isArray(state.origins)) {
                    errors.push(`${statePath} is not a Playwright storage-state file`);
                }
            }
        }
    }

    if (errors.length) {
        console.error(errors.map((error) => `- ${error}`).join("\n"));
        process.exitCode = 1;
    } else {
        console.log(`Validated ${requiredPersonas.length} authenticated E2E personas.`);
    }
}

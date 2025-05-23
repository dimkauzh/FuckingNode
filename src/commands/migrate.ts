import { StringUtils } from "@zakahacecosas/string-utils";
import { FULL_NAME } from "../constants.ts";
import { GetDateNow } from "../functions/date.ts";
import { CheckForPath, JoinPaths } from "../functions/filesystem.ts";
import { LogStuff } from "../functions/io.ts";
import { GetProjectEnvironment, NameProject, SpotProject } from "../functions/projects.ts";
import type { MANAGER_JS, ProjectEnvironment } from "../types/platform.ts";
import type { TheMigratorConstructedParams } from "./constructors/command.ts";
import { FkNodeInterop } from "./interop/interop.ts";
import { rename } from "node:fs";

function handler(
    from: MANAGER_JS,
    to: MANAGER_JS,
    env: ProjectEnvironment,
) {
    try {
        if (env.runtime === "golang" || env.runtime === "rust") {
            throw new Error("This shouldn't have happened (internal error) - NonJS environment assigned JS-only task (migrate).");
        }

        LogStuff("Please wait (this will take a while)...", "working");

        LogStuff("Updating dependencies (1/6)...", "working");
        FkNodeInterop.Features.Update({ env, verbose: true });

        LogStuff("Removing node_modules (2/6)...", "working");
        Deno.removeSync(env.hall_of_trash, {
            recursive: true,
        });

        Deno.chdir(env.root);

        // this is not 100% reliable, reading the lockfile is better
        // since straightforward reading it could cause issues (and ngl i'm a bit lazy)
        // even tho the promise was to "read the lockfile" what we'll do is
        // on step 6/6 run "update" to SYNC the lockfile and the pkg file
        // it technically complies our promise, as this command fixes
        // the lockfile being in slightly newer versions
        // and is way easier for me to write

        // i'm a damn genius
        LogStuff("Migrating versions from previous package file (3/6)...", "working");
        LogStuff("A copy will be made (package.json.bak), just in case", "wink");
        if (env.main.path.endsWith("jsonc")) {
            LogStuff(
                "Your deno.jsonc's comments (if any) WON'T be preserved in final package file, but WILL be present in the .bak file. Sorry bro.",
                "bruh",
            );
        }
        const newPackageFile = from === "deno"
            ? FkNodeInterop.Generators.Deno(
                env.main.cpfContent,
                env.main.stdContent,
            )
            : FkNodeInterop.Generators.NodeBun(
                env.main.cpfContent,
                env.main.stdContent,
            );
        Deno.writeTextFileSync(
            JoinPaths(env.root, `${env.main.name}.jsonc.bak`),
            `// This is a backup of your previous project file. We (${FULL_NAME}) overwrote it at ${GetDateNow()}.\n${
                JSON.stringify(env.main.stdContent)
            }`,
        );
        Deno.writeTextFileSync(
            env.main.path,
            JSON.stringify(newPackageFile),
        );

        LogStuff("Making a backup of your previous lockfile (4/6)...", "working");
        if (env.lockfile.name === "bun.lockb" && CheckForPath(JoinPaths(env.root, "bun.lock"))) {
            // handle case where bun.lockb was replaced with bun.lock
            rename(env.lockfile.path, JoinPaths(env.root, "bun.lockb.bak"), (e) => {
                if (e) throw e;
                LogStuff(
                    "Your bun.lockb file will be backed up and replaced with a text-based lockfile (bun.lock).",
                    "bruh",
                );
            });
            Deno.removeSync(env.lockfile.path);
        } else {
            Deno.writeTextFileSync(
                JoinPaths(env.root, `${env.lockfile.name}.bak`),
                Deno.readTextFileSync(env.lockfile.path),
            );
            Deno.removeSync(env.lockfile.path);
        }

        LogStuff("Installing modules with the desired manager (5/6)...", "working");
        FkNodeInterop.Installers.UniJs(env.root, to);

        LogStuff("Updating to ensure lockfile consistency (6/6)...", "working");
        FkNodeInterop.Features.Update({ env, verbose: true });
    } catch (e) {
        LogStuff(`Migration threw an: ${e}`, "error");
    }
}
export default function TheMigrator(params: TheMigratorConstructedParams): void {
    const { projectPath, wantedManager } = params;

    if (!StringUtils.validate(wantedManager)) throw new Error("No target (pnpm, npm, yarn, deno, bun) specified.");

    const desiredManager = StringUtils.normalize(wantedManager);

    const MANAGERS = ["pnpm", "npm", "yarn", "deno", "bun"];
    if (!MANAGERS.includes(StringUtils.normalize(desiredManager))) {
        throw new Error("Target isn't a valid package manager. Only JS environments (NodeJS, Deno, Bun) support migrate.");
    }

    const cwd = Deno.cwd();

    const workingProject = SpotProject(projectPath);
    const workingEnv = GetProjectEnvironment(workingProject);

    if (!MANAGERS.includes(workingEnv.manager)) {
        throw new Error(
            `${workingEnv.manager} is not a runtime we can migrate from. Only JS environments (NodeJS, Deno, Bun) support migrate.`,
        );
    }

    if (!CheckForPath(workingEnv.main.path)) {
        throw new Error(
            "No package.json/deno.json(c) file found, cannot migrate. How will we install your modules without that file?",
        );
    }

    LogStuff(
        `Migrating ${workingProject} to ${desiredManager} has a chance of messing your versions up.\nYour lockfile will be backed up and synced to ensure coherence.`,
        "warn",
    );

    handler(
        workingEnv.manager as MANAGER_JS,
        desiredManager as MANAGER_JS,
        workingEnv,
    );

    LogStuff(`That worked out! Enjoy using ${desiredManager} for ${NameProject(workingEnv.root, "all")}`);

    Deno.chdir(cwd);

    return;
}

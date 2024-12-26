import TheUpdater from "../commands/updater.ts";
import { APP_NAME, DEFAULT_SETTINGS, I_LIKE_JS } from "../constants.ts";
import type { CF_FKNODE_SETTINGS } from "../types/config_files.ts";
import { CheckForPath, JoinPaths } from "./filesystem.ts";
import { LogStuff } from "./io.ts";
import { parse as parseYaml, stringify as stringifyYaml } from "@std/yaml";

/**
 * Returns file paths for all config files the app uses.
 *
 * @export
 * @param {("BASE" | "MOTHERFKRS" | "LOGS" | "UPDATES" | "SETTINGS")} path What path you want.
 * @returns {string} The path as a string.
 */
export async function GetAppPath(
    path: "BASE" | "MOTHERFKRS" | "LOGS" | "UPDATES" | "SETTINGS",
): Promise<string> {
    const appDataPath = Deno.build.os === "windows" 
        ? Deno.env.get("APPDATA") 
        : (Deno.env.get("XDG_CONFIG_HOME") || `${Deno.env.get("HOME")}/.config`);
    if (!appDataPath) {
        console.error(
            `${I_LIKE_JS.MFN} environment error! We tried to find: ${
                Deno.build.os === "windows" ? "APPDATA env variable" : "XDG_CONFIG_HOME and HOME env variables"
            } but failed, meaning config files cannot be created and the CLI can't work. Something seriously went ${I_LIKE_JS.MFLY} wrong. If these aren't the right environment variables for your system's config path (currently using APPDATA on Windows, /home/user/.config on macOS and Linux), please raise an issue on GitHub.`,
        );
        Deno.exit(1);
    }

    const funny = I_LIKE_JS.MFS.toLowerCase().replace("*", "o").replace("*", "u");

    const BASE_DIR = await JoinPaths(appDataPath, APP_NAME.CLI);
    const PROJECTS = await JoinPaths(BASE_DIR, `${APP_NAME.CLI}-${funny}.txt`);
    const LOGS = await JoinPaths(BASE_DIR, `${APP_NAME.CLI}-logs.log`);
    const UPDATES = await JoinPaths(BASE_DIR, `${APP_NAME.CLI}-updates.yaml`);
    const SETTINGS = await JoinPaths(BASE_DIR, `${APP_NAME.CLI}-settings.yaml`);

    switch (path) {
        case "BASE":
            return BASE_DIR;
        case "MOTHERFKRS":
            return PROJECTS;
        case "LOGS":
            return LOGS;
        case "UPDATES":
            return UPDATES;
        case "SETTINGS":
            return SETTINGS;
        default:
            throw new Error("Invalid path requested");
    }
}

/**
 * Check if config files are present, create them otherwise ("Fresh Setup").
 *
 * @export
 * @async
 * @returns {Promise<void>}
 */
export async function FreshSetup(repairSetts?: boolean): Promise<void> {
    try {
        const basePath = await GetAppPath("BASE");
        if (!(await CheckForPath(basePath))) {
            await Deno.mkdir(basePath, { recursive: true });
        }

        const projectPath = await GetAppPath("MOTHERFKRS");
        if (!(await CheckForPath(projectPath))) {
            await Deno.writeTextFile(projectPath, "", {
                create: true,
            });
        }

        const logsPath = await GetAppPath("LOGS");
        if (!(await CheckForPath(logsPath))) {
            await Deno.writeTextFile(logsPath, "", {
                create: true,
            });
        }

        const settingsPath = await GetAppPath("SETTINGS");
        if (!(await CheckForPath(settingsPath))) {
            await Deno.writeTextFile(settingsPath, stringifyYaml(DEFAULT_SETTINGS), {
                create: true,
            });
        }
        if (repairSetts) { // overwrite
            await Deno.writeTextFile(settingsPath, stringifyYaml(DEFAULT_SETTINGS), {
                create: true,
            });
        }

        const updatesPath = await GetAppPath("UPDATES");
        if (!(await CheckForPath(updatesPath))) {
            await TheUpdater({
                silent: true,
                force: true,
                mute: false,
            });
        }

        return;
    } catch (e) {
        await LogStuff(`Some ${I_LIKE_JS.MFN} error happened trying to setup config files: ${e}`, "error");
        Deno.exit(1);
    }
}

/**
 * Returns current user settings.
 *
 * @export
 * @async
 * @returns {Promise<FKNODE_SETTINGS>}
 */
export async function GetSettings(): Promise<CF_FKNODE_SETTINGS> {
    const path = await GetAppPath("SETTINGS");
    const stuff = await parseYaml(await Deno.readTextFile(path));
    return stuff as CF_FKNODE_SETTINGS;
}

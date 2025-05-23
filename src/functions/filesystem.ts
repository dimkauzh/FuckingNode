import { join, normalize } from "@std/path";
import { StringUtils, type UnknownString } from "@zakahacecosas/string-utils";
import { FknError } from "./error.ts";

/**
 * Returns `true` if a given path exists, `false` if otherwise.
 *
 * @export
 * @param {string} path Path to check for
 * @returns {boolean}
 */
export function CheckForPath(path: string): boolean {
    try {
        Deno.statSync(path);
        return true;
    } catch {
        return false;
    }
}

/**
 * Checks for a directory, returns a string depending on the result.
 *
 * @export
 * @param {string} path
 * @returns {"NotDir" | "Valid" | "ValidButNotEmpty" | "NotFound"}
 */
export function CheckForDir(path: string): "NotDir" | "Valid" | "ValidButNotEmpty" | "NotFound" {
    try {
        const info = Deno.statSync(path);
        if (!info.isDirectory) return "NotDir";
        for (const _ of Deno.readDirSync(path)) {
            // If we find a single entry, it's not empty.
            return "ValidButNotEmpty";
        }
        return "Valid";
    } catch (e) {
        if (e instanceof Deno.errors.NotFound) {
            return "NotFound"; // path doesn't exist.
        } else {
            throw e; // unexpected sh*t happened
        }
    }
}

/**
 * Parses a string path, to ensure string cleanness and handle things like relative paths or `--self`.
 *
 * @export
 * @param {UnknownString} target The string to parse.
 * @returns {string} A string with the parsed path.
 */
export function ParsePath(target: UnknownString): string {
    try {
        if (!StringUtils.validate(target)) throw new Error("Target must be (obviously) a string.");

        if (StringUtils.normalize(target) === "--self") {
            return Deno.cwd();
        }

        let workingTarget: string;

        // if (LOCAL_PLATFORM.SYSTEM === "chad") {
        //     let unification = `${parse(target).dir}/${parse(target).name}`;
        //     for (const entry of Deno.readDirSync(parse(target).dir)) {
        //         if (!(StringUtils.normalize(entry.name) === StringUtils.normalize(parse(target).dir))) continue;
        //         unification = `${entry}/${parse(target).name}`;
        //     }

        //     try {
        //         workingTarget = Deno.realPathSync(unification);
        //     } catch {
        //         // fallback
        //         workingTarget = unification;
        //     }
        // } else {
        try {
            workingTarget = Deno.realPathSync(target.trim());
        } catch {
            // fallback
            workingTarget = target.trim();
        }
        // }

        const cleanEntry = normalize(workingTarget);

        if (cleanEntry.endsWith("/") || cleanEntry.endsWith("\\")) return cleanEntry.slice(0, -1);

        return cleanEntry.trim();
    } catch (e) {
        throw new FknError("Internal__UnparsablePath", `Error parsing ${target}: ${e}`);
    }
}

/**
 * Parses a string of a lot of file paths separated by newlines or commas, and returns them as an array of individual paths.
 *
 * @export
 * @param {UnknownString} target The string to parse.
 * @returns {string[]} Your `string[]`.
 */
export function ParsePathList(target: UnknownString): string[] {
    if (!StringUtils.validate(target)) return [];

    return StringUtils
        .sortAlphabetically(
            StringUtils
                .kominator(target, "\n")
                .map((line) => line.trim().replace(/,$/, ""))
                .filter((line) => line.length > 0)
                .map(ParsePath),
        );
}

/**
 * Joins two parts of a file path. If they cannot be found, you'll be given back an unparsed join.
 *
 * @export
 * @param {string} pathA First part, e.g. "./my/beginning".
 * @param {string} pathB Second part, e.g. "my/end.txt".
 * @returns {string} Result, e.g. "./my/beginning/my/end.txt".
 */
export function JoinPaths(pathA: string, pathB: string): string {
    try {
        const firstPart = ParsePath(pathA);
        const secondPath = pathB.trim();
        return join(firstPart, secondPath);
    } catch {
        return join(pathA, pathB);
    }
}

/**
 * Takes an array of paths and removes all of them, with recursive removal enabled.
 *
 * @export
 * @param {string[]} files Array of file paths to remove
 * @returns {void}
 */
export function BulkRemoveFiles(files: string[]): void {
    if (files.length === 0) return;
    files.map((file) => {
        Deno.removeSync(ParsePath(file), {
            recursive: true,
        });
    });
}

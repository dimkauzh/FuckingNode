import { Commander, CommandExists } from "../../functions/cli.ts";
import { FknError } from "../../functions/error.ts";
import { CheckForPath, JoinPaths, ParsePath } from "../../functions/filesystem.ts";
import type { MANAGER_JS } from "../../types/platform.ts";

export const Installers = {
    UniJs: (path: string, manager: MANAGER_JS) => {
        Deno.chdir(ParsePath(path));
        if (!CommandExists(manager)) throw new FknError("Generic__MissingRuntime", `${manager} is not installed!`);
        Commander(manager, ["install"]);
        return;
    },
    Golang: (path: string) => {
        Deno.chdir(ParsePath(path));
        if (!CommandExists("go")) throw new FknError("Generic__MissingRuntime", `go is not installed!`);
        if (CheckForPath(JoinPaths(Deno.cwd(), "vendor"))) {
            Commander("go", ["mod", "vendor"]);
            return;
        }
        Commander("go", ["mod", "tidy"]);
        return;
    },
    Cargo: (path: string) => {
        Deno.chdir(ParsePath(path));
        if (!CommandExists("cargo")) throw new FknError("Generic__MissingRuntime", `cargo is not installed!`);
        Commander("cargo", ["fetch"]);
        Commander("cargo", ["check"]);
        return;
    },
};

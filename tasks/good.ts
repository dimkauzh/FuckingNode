import { walk } from "@std/fs/walk";
import { JoinPaths, ParsePath } from "../src/functions/filesystem.ts";

console.log("we making this good");

const dir = Deno.cwd(); // as the CWD from where you'll run deno task will always be the root of the project

function Run(...args: string[]) {
    const output = new Deno.Command("deno", {
        args,
    }).outputSync();

    const e = new TextDecoder();

    if (!output.success) throw new Error(e.decode(output.stderr) + "\n" + e.decode(output.stdout));
    console.log(args, "went right");
}

async function GetAllTsFiles(): Promise<string[]> {
    const exclude = [ParsePath(JoinPaths(dir, "tests/environment"))];
    const tsFiles: string[] = [];

    for await (
        const entry of walk(dir, {
            includeDirs: false,
            exts: [".ts"],
            skip: [
                ...exclude.map((excluded) => new RegExp(`(^|/)${excluded}(/|$)`)),
                /\.ignore\.ts$/,
            ],
        })
    ) {
        tsFiles.push(entry.path);
    }

    return tsFiles;
}

const toPrepare: string[] = await GetAllTsFiles();

for (const unprepared of toPrepare) Run("check", unprepared); // ensure code is right

Run("fmt"); // ensure code is formatted

Run("upgrade"); // ensure we're on latest

Run("outdated", "--update", "--latest"); // ensure deps are on latest

await Deno.copyFile(
    JoinPaths(dir, "scripts/install.ps1"),
    JoinPaths(dir, "docs/install.ps1"),
); // ensure Windows install is on latest
await Deno.copyFile(
    JoinPaths(dir, "scripts/install.sh"),
    JoinPaths(dir, "docs/install.sh"),
); // ensure macOS and Linux install are on latest

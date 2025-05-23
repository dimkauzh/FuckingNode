import { StringUtils } from "@zakahacecosas/string-utils";
import { ProjectEnvironment } from "../../types/platform.ts";
import { ColorString, LogStuff } from "../../functions/io.ts";
import { parse } from "@std/semver";

export function RecommendedCommunityStandards(env: ProjectEnvironment) {
    // deno-lint-ignore no-explicit-any
    const content = env.main.stdContent as any;

    const isNodeJs = StringUtils.validateAgainst(env.runtime, ["node", "bun"]);
    const isDenoJs = env.runtime === "deno";

    if (isNodeJs) {
        const { version, private: isPrivate, license, author, contributors, description, repository, bugs, type } = content;

        LogStuff(
            isPrivate ? "This is a private project. Running generic checks." : "This is a public project. Running additional package checks.",
            "bulb",
        );

        try {
            parse(version);
            LogStuff("Version follows the SemVer format. Nice!", "tick");
        } catch {
            LogStuff(`${version} is not a valid version! Follow the SemVer specification.`, "error");
        }
        LogStuff(license ? `${license} license, good.` : "No license found. You should specify it!", license ? "tick" : "error");
        LogStuff(
            contributors
                ? `So we've got ${contributors.length} contributor(s), great.`
                : "No contributors found. If none, that's fine, but if someone helps, mention them.",
            contributors ? "tick" : "bruh",
        );
        LogStuff(
            description ? `"${ColorString(description, "italic")}", neat description.` : "No description found. What does your code even do?",
            description ? "tick" : "error",
        );
        LogStuff(
            type === "module"
                ? "This is an ESM project, lovely."
                : `Using CommonJS is not 'wrong', but not ideal. Consider switching to ESM.${
                    type ? "" : "\nNote: The 'type' field was not specified, so Node assumes CJS. If you use ESM, specify type='module'."
                }`,
            type ? "tick" : "bruh",
        );
        if (!isPrivate || author) {
            LogStuff(
                author ? `Made by ${typeof author === "string" ? author : author.name}, nice.` : "No author found. Who made this 'great' code?",
                author ? "tick" : "error",
            );
        }
        if (!isPrivate) {
            LogStuff(
                repository
                    ? `A repository was specified, nice.`
                    : "No repository found. Consider adding a repository URL, else how do we contribute bug fixes?",
                repository ? "tick" : "error",
            );
            LogStuff(
                bugs ? `Known bug-report URL, incredible.` : "You didn't specify where to report bugs. Don't be lazy and accept feedback!",
                bugs ? "tick" : "error",
            );
        }
    } else if (isDenoJs) {
        // this is very basic tbh, a deno.json doesn't have much
        const { lint, fmt, lock, version } = content;

        try {
            parse(version);
            LogStuff("Version follows the SemVer format. Nice!", "tick");
        } catch {
            LogStuff(`${version} is not a valid version! Follow the SemVer specification.`, "error");
        }
        LogStuff(
            lint ? `Found lint configurations. That's good!` : "No lint configurations found.",
            lint ? "tick" : "bruh",
        );
        LogStuff(
            fmt ? `Found formatting configurations. That's good!` : "No formatting configurations found.",
            fmt ? "tick" : "bruh",
        );
        LogStuff(
            lock ? `Found lockfile configurations. That's good!` : "Why did you disable the lockfile!?",
            lock ? "tick" : "bruh",
        );
    } else {
        // in this case we know it's cargo
        const { license, authors, description, repository, edition } = content;

        LogStuff(
            license ? `${license} license, nice.` : "No license found. You should specify one!",
            license ? "tick" : "error",
        );

        LogStuff(
            authors
                ? `Made by ${authors.join(", ")}. Nice to meet ya!`
                : "No authors found. You should at least mention yourself, and of course credit any contributor!",
            authors ? "tick" : "error",
        );

        LogStuff(
            description ? `"${ColorString(description, "italic")}", neat description.` : "No description found. What does your project even do?",
            description ? "tick" : "error",
        );

        LogStuff(
            repository
                ? `A repository was specified, nice.`
                : "No repository found. Consider adding a repository URL, else how do we contribute bug fixes?",
            repository ? "tick" : "error",
        );

        LogStuff(
            edition ? `Rust ${edition} edition` : "No edition found. You should specify the edition you're using (e.g., 2018, 2021).",
            edition ? "tick" : "error",
        );
    }
}

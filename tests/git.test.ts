import { assertEquals } from "@std/assert";
import { Git } from "../src/functions/git.ts";
import { APP_NAME } from "../src/constants.ts";
import { SpotProject } from "../src/functions/projects.ts";

const here = SpotProject(APP_NAME.SCOPE);

Deno.test({
    name: "gets git branches",
    fn: () => {
        assertEquals(
            Git.GetBranches(here),
            {
                current: "v3",
                all: [
                    "v3",
                    "v2",
                    "master",
                    "feature-audit",
                ].sort(),
            },
        );
    },
});

Deno.test({
    name: "gets git latest tag",
    fn: () => {
        assertEquals(
            Git.GetLatestTag(here),
            JSON.parse(Deno.readTextFileSync("./deno.json")).version,
        );
    },
});

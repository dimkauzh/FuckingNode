import type { TheExporterConstructedParams } from "./constructors/command.ts";
import { GetProjectEnvironment, SpotProject } from "../functions/projects.ts";
import { JoinPaths } from "../functions/filesystem.ts";
import { ColorString, LogStuff, StringifyYaml } from "../functions/io.ts";
import { APP_NAME, FULL_NAME, VERSIONING } from "../constants.ts";
import { GetDateNow } from "../functions/date.ts";

export default async function TheExporter(params: TheExporterConstructedParams) {
    const { project } = params;

    const workingProject = await SpotProject(project);
    const env = await GetProjectEnvironment(workingProject);

    const cpfString = params.json === true ? JSON.stringify(env.main.cpfContent, undefined, 2) : StringifyYaml(env.main.cpfContent);

    const outFileName = params.json === true ? "fknode-cpf.jsonc" : "fknode-cpf.yaml";

    const comment =
        `# Generated by ${FULL_NAME}\n# ${APP_NAME.CASED} Common Package File v${VERSIONING.CPF}\n# This has been manually generated at ${GetDateNow()}. Content here isn't synced with your project.`;

    const commentString = params.json === true ? comment.replaceAll("#", "//") : comment;

    await Deno.writeTextFile(
        JoinPaths(env.root, outFileName),
        `${commentString}\n${cpfString}`,
    );

    if (params.cli === true) await LogStuff(cpfString);
    await LogStuff(`${ColorString(outFileName, "bold")} file written successfully`, "tick", "bright-green");
}

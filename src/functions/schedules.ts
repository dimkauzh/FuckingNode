import { Flush } from "../commands/settings.ts";
import TheUpdater from "../commands/updater.ts";
import type { CF_FKNODE_SCHEDULE } from "../types/config_files.ts";
import { GetAppPath, GetSettings } from "./config.ts";
import { GetDateNow, ParseDate } from "./date.ts";
import { parse as parseYaml } from "@std/yaml";
import { StringifyYaml } from "./io.ts";
import { VERSION } from "../constants.ts";

export async function RunScheduledTasks() {
    const { updateFreq, logFlushFreq } = await GetSettings();
    const scheduleFilePath: string = await GetAppPath("SCHEDULE");
    const scheduleFile: CF_FKNODE_SCHEDULE = parseYaml(await Deno.readTextFile(scheduleFilePath)) as CF_FKNODE_SCHEDULE;

    const currentDate: Date = new Date();
    const CalculateDifference = (date: Date) => (currentDate.getTime() - date.getTime()) / (1000 * 60 * 60 * 24);

    const dates = {
        updater: {
            last: scheduleFile.updater.lastCheck,
            diff: CalculateDifference(
                ParseDate(scheduleFile.updater.lastCheck),
            ),
        },
        flusher: {
            last: scheduleFile.flusher.lastFlush,
            diff: CalculateDifference(
                ParseDate(scheduleFile.flusher.lastFlush),
            ),
        },
    };

    if (dates.updater.diff >= updateFreq) {
        const updatedScheduleFile: CF_FKNODE_SCHEDULE = {
            ...scheduleFile,
            updater: {
                lastCheck: GetDateNow(),
                latestVer: VERSION,
            },
        };
        await TheUpdater({
            silent: false,
        });
        await Deno.writeTextFile(scheduleFilePath, StringifyYaml(updatedScheduleFile));
    }

    if (dates.flusher.diff >= logFlushFreq) {
        const updatedScheduleFile: CF_FKNODE_SCHEDULE = {
            ...scheduleFile,
            flusher: {
                lastFlush: GetDateNow(),
            },
        };
        await Flush("logs", true, true);
        await Deno.writeTextFile(scheduleFilePath, StringifyYaml(updatedScheduleFile));
    }
}

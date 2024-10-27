import { Commander } from "../functions/cli.ts";
import { ErrorMessage, LogStuff } from "../functions/io.ts";
import { APP_NAME } from "../constants.ts";

async function CreateSchedule(hour: string, day: string | "*") {
    const workingHour = Number(hour);

    if (workingHour < 0 || workingHour > 23) {
        await LogStuff("Hour must be a valid number between 0 and 23.", "error");
        Deno.exit(1);
    }

    if (day !== "*" && (Number(day) < 0 || Number(day) > 6)) {
        await LogStuff("Day must be a valid number between 0 and 6, or an asterisk.", "error");
        Deno.exit(1);
    }

    try {
        Deno.cron(
            `${APP_NAME.CLI}-cleaner`,
            `0 ${workingHour} ${day === "*" ? "*" : `*/${day}`} * *`,
            async () => {
                await Commander(APP_NAME.CLI, ["clean", "normal"], true);
            },
        );
        await LogStuff("That worked out! Schedule created.", "tick");
        Deno.exit(0);
    } catch (e) {
        await LogStuff(`Error scheduling: ${e}`, "error");
    }
}

export default async function TheSettings(args: string[]) {
    if (!args || args.length === 0) {
        ErrorMessage("NoArgumentPassed");
        Deno.exit(1);
    }

    const command = args[1];
    const secondArg = args[2] ? args[2].trim() : null;
    const thirdArg = args[3] ? args[3].trim() : null;

    if (!command) {
        ErrorMessage("NoArgumentPassed");
        return;
    }

    switch (command) {
        case "schedule":
            if (!secondArg || !thirdArg) {
                await LogStuff("No time schedule was provided, or it's incomplete.", "warn");
                return;
            }
            await CreateSchedule(secondArg, thirdArg);
            break;
        default:
            await LogStuff(`Currently supported settings:\nschedule <hour> <day>    schedule ${APP_NAME.STYLED} to run periodically.`);
    }
}
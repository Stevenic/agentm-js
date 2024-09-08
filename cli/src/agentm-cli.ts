/**
 * Copyright 2023-2024 Awarity.ai
 */

import yargs from "yargs";
import { hideBin } from "yargs/helpers";
import { createConfig, init, server } from "./pulse";

export async function run() {
    await yargs(hideBin(process.argv))
        .scriptName('agentm')
        .command('start', `Starts AgentM's Pulse server.`, (yargs) => {
            return yargs
                .option('port', {
                    describe: `The port number to use.`,
                    type: 'number',
                    default: 4242
                })
                .option('examples', {
                    describe: `Include example pages when initializing a new .agentm folder.`,
                    type: 'boolean',
                    default: true
                })
                .demandOption([]);
        }, async (args) => {
            const config = createConfig();
            await init(config, args.examples);
            await server(config).listen(args.port, () => {
                console.log(`AgentM's Pulse server is running on http://localhost:${args.port}`);
            });
        })
        .help()
        .demandCommand()
        .parseAsync();
}

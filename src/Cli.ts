import { Command } from "commander";
import { BroadcastVote } from "./broadcastServer";
import { BroadCastClient } from "./Client";

const DEFAULT_PORT = 6060;
const DEFAULT_URL = `ws://localhost:${DEFAULT_PORT}`;
const program = new Command();

program
    .name("voting-server")
    .description(`A Polling unit for voting using the CLI `)
    .version("1.0.0");

program
    .command('start')
    .description('Start the polling unit server')
    .option('-p, --port <number>', 'port to listen on', DEFAULT_PORT.toString())  
    .action((option) => {
        const port = parseInt(option.port)
        new BroadcastVote(port);
    }); 

program
    .command('connect')
    .description('Connect to the polling unit for other users to vote')

    .option('-u, --url <string>', 'server URL to connect to', DEFAULT_URL)
    .action((option) => {
        new BroadCastClient(option.url);
    });

program    
    .command('status')
    .description('Check the current poll status')
    .action(() => {
        console.log('Fetching poll results...');
    });


program.parse();
export {};
import WebSocket from "ws";
import readline from "readline";
import { PROTOCOL } from "./Config";

export class BroadCastClient{
    private ws:WebSocket | null = null;
    private rl:readline.Interface;
    private votername:string = '';
    private serverUrl:string;
    private readonly PROTOCOL = PROTOCOL;

    constructor(serverUrl:string){
        this.serverUrl = serverUrl;
        this.rl = readline.createInterface({
            input:process.stdin,
            output:process.stdout
        });
        this.init();
    }

    private init():void{
        this.authenticate();
    }

    private authenticate():void{
        this.rl.question(`Enter your votername: `, (votername) =>{
            if (!votername.trim()) {
                console.error('\nVotername cannot be empty');
                this.authenticate();
                return;
            }
            this.votername = votername.trim();
            this.connectToServer();
        });
    }

    private connectToServer():void{
        try {
            const options = {
                headers:{
                    'X-Votersname': this.votername
                },
            };

            this.ws = new WebSocket(this.serverUrl,this.PROTOCOL,options);

            this.ws.on('open', () => {
                console.log('Connected to polling unit');
                this.voting();
            });

            this.ws.on('error',(error) => {
                console.error('\nConnection failed:',error.message);
                this.cleanUp();
            });

            this.ws.on('close',(code,reason) => {
                console.log('\nDisconnected from polling unit:', reason.toString());
                this.cleanUp();
            })

            this.ws.on('message',(data) => {
                try {
                    //Clear the current "Voting:" prompt
                    console.log('\n' + data.toString());
                    this.rl.prompt(true);
                } catch (error) {
                    console.error('\nMessage Error:', error);
                }
            })
        } catch (error) {
            console.error('Failed to connect:', error);
            process.exit(1);
        }
    }

    private voting():void{
        if (!this.ws) return;

        this.rl.question('Enter vote or "createpoll:Question,Option1,Option2":', (input) => {
            const canBeSent = input.trim().toLowerCase();
            if (canBeSent === 'quit' || canBeSent === 'exit') {
                this.rl.close()
                this.ws!.close()
                return;
            }
            if (canBeSent) {
                this.ws!.send(input)
            }
            this.voting();
        });
    }

    private cleanUp(){
        if (this.ws) {
            this.ws.close()
            this.ws = null;
        }
        this.rl.close()
        process.exit(0);
    }
}
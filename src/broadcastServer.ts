import WebSocket from "ws";
import { createServer, IncomingMessage, Server } from "http";
import { AuthenticateClient,Message,PROTOCOL } from "./Config";
import { Socket } from "net";

export class BroadcastVote{
    private wss:WebSocket.Server;
    private hs:Server;
    private clients: Map<WebSocket, string> = new Map()
    private poll:{question:string,options:string[],votes:Map<string, number>} | null = null;

    protected readonly PROTOCOL = PROTOCOL;

    constructor(port: number){
        this.hs = createServer();
        this.wss = new WebSocket.Server({noServer:true});
        //Bind methods to preserve 'this' context

        this.onHttpUpgrade = this.onHttpUpgrade.bind(this)
        this.onSocketError = this.onSocketError.bind(this)
        this.authenticate = this.authenticate.bind(this)
        this.init(port)
    }

    private init(port:number){
        this.hs.on('upgrade', this.onHttpUpgrade);
        this.onWebSocketConnection();

        this.hs.listen(port, () =>{
            console.log(`Polling Unit is currently run on port ${port}`)
        });
    }

    private onHttpUpgrade(req:IncomingMessage,socket:Socket,header:Buffer){
        socket.on('error',this.onSocketError);
        this.authenticate(req,(err,client) => {
            if(err || !client){
                socket.write("HTTP/1.1 401 Unauthroized\r\n\r\n");
                socket.destroy();
                return;
            }
            socket.removeListener('error',this.onSocketError);
            this.wss.handleUpgrade(req,socket,header,(ws) => {
                this.wss.emit('connection',ws,req,client);
            })
        });
    }

    private onSocketError(error:Error){
        console.log(`Socket Error: `,error.message);
    }

    private authenticate(req:IncomingMessage,callback:(err:Error | null, client?: AuthenticateClient) => void){
        const protocols = req.headers['sec-websocket-protocol'];
        const votersname = req.headers['x-votersname'];

        if (!protocols || !protocols.split(',').map(p => p.trim()).includes(this.PROTOCOL)) {
            callback(new Error('Invalid protocol'));
            return;
        }

        if (!votersname || typeof votersname != 'string' || votersname.trim() === '') {
            callback(new Error('Invalid Protocol'));
            return;
        }

        let candidateVotersName = votersname.trim();

        const foundInClient = Array.from(this.clients.values())
            .some((name) => name.toLowerCase() === candidateVotersName.toLowerCase())

         if (foundInClient) {
            callback(new Error('Votersname alredy taken'));
            return;
         }   
         callback(null,{username:candidateVotersName})
    }

    private onWebSocketConnection(){
        this.wss.on('connection',(ws:WebSocket,req:IncomingMessage,client:AuthenticateClient) => {
            const votersname = client.username;
            this.clients.set(ws,votersname);

            console.log(`${votersname} has joined the chat`)
            console.log(this.onlineUsers());

            this.broadcast({
                type:'system',
                payload:this.onlineUsers()
            });

            const findClient = () =>{
                return Array.from(this.clients.entries())
                    .find(([client]) => client === ws)?.[1]
            };

            ws.on('message', (message) => {
                const found = findClient();
                if (!found) return;
            
                const msg = message.toString().trim().toLowerCase();

                if (msg.startsWith('createpoll')) {
                    const [question, ...options] = msg.replace('createpoll:','').split(',');
                    this.createPoll(question.trim(),options.map(opt => opt.trim()));
                    return;
                }
                
                if (this.poll && this.poll.options.includes(msg)) {
                    this.poll.votes.set(msg, (this.poll.votes.get(msg) || 0) + 1);
                    this.broadcast({ type: 'system', payload: `Vote received for ${msg}.` });
                    this.broadcastPollResults();
                } else {
                    this.broadcast({ 
                        type: 'message', 
                        payload: msg, 
                        username: found 
                    }, ws);
                }
            });
            

            ws.on('close', () => {
                 const votersname = findClient()
                 if(votersname){
                    console.log(`${votersname} has left the polling unit`);
                    this.broadcast({
                        type:'system',
                        payload:this.onlineUsers()
                    });
                    this.deleteClient(ws)
                 }
            });
            ws.on('error', (err) =>{
                console.log('Client Error: ',err.message);
                this.deleteClient(ws);
            });
        });
    }

    private broadcast(message:Message,sender?:WebSocket){
        const toBroadcast = message.type === 'system'
            ? `System: ${message.payload}`
            : `${message.username}: ${message.payload}`;
        this.clients.forEach((name,client) => {
            if (client !== sender && client.readyState === WebSocket.OPEN) {
                client.send(toBroadcast)
            }
        })    
    }

    private createPoll(question:string, options:string[]){
        if (this.poll) {
            this.broadcast({
                type:'system',
                payload:'A poll is already running!'
            });
            return;
        }
        this.poll = {
            question,options,
            votes:new Map(options.map(option => [option,0]))
        };
        this.broadcast({
            type:'system',
            payload:`New poll: ${question} \nOptions: ${options.join(', ')}`
        });
    }
    private broadcastPollResults() {
        if (!this.poll) return;
    
        const results = Array.from(this.poll.votes.entries())
            .map(([option, count]) => `${option}: ${count} votes`).join('\n');
    
        this.broadcast({ type: 'system', payload: `Live Poll Results:\n${results}` });
    }
    private closePoll() {
        if (!this.poll) {
            this.broadcast({ type: 'system', payload: 'No active poll to close.' });
            return;
        }
    
        const winner = [...this.poll.votes.entries()].reduce((a, b) => (a[1] > b[1] ? a : b));
        this.broadcast({ type: 'system', payload: `Poll closed! Winner: ${winner[0]} with ${winner[1]} votes.` });
    
        this.poll = null;
    }
    

    private onlineUsers(){
        return `Current online users: ${this.clients.size}`;
    }

    private deleteClient(ws:WebSocket){
        this.clients.delete(ws)
        console.log(this.onlineUsers())
    }

}
export const PROTOCOL = 'polls';

export type ServersVote = {
    type:'system';
    payload:string;
}

export type ClientsVote = {
    type:'message';
    username:string;
    payload:string;
}

export type Message = ClientsVote | ServersVote

export interface AuthenticateClient{
    username:string;
}
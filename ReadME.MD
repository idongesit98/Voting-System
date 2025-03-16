# Broadcast Server
## Overview
A real-time Polling Station server implementation using WebSocket protocol. This server supports user authentication, real-time messaging, and user status tracking,showing live results in real-time.It is built in a CLI format as a pet project learning how to use websocket.

## Features
- Real-time WebSocket communication
- Username-based authenticaiton
- User presence trakcing (join/leave notifications)
- Broadcast messaging system
- Connection state mamagement
- Error handling and connection recovery
- TypeScript support

## Prerequisites
- Node.js (latest)
- npm or yarn
- TypeScript

## Installation
```sh
git clone https://github.com/idongesit98/Voting-System.git

cd Voting-Server directory 
 
npm install 
```

## Usages
```bash
# development
$ npm run dev 

# build
$ npm run build     

# start
$ npm run voting-server

#connect
$ npm run voting-server connect

```

## Project Structure
```stylus
├── src/
│   ├── Cli.ts               # Commander implementation
│   ├── Client.ts            # Client server implementation
│   ├── broadcastServer.ts   # Broadcast server implementation
│   ├── Config.ts            # Configuration and types
│   └── Server.ts            # Entry point
│
├── package.json
├── tsconfig.json
└── README.md
```

## Contributing
Contributions, ideas and suggestions, bug reports are welcome as the project owner is not an island.

## Contacts
Questions or Inquiries, Please contact [robsonidongesitsamuel@gmail.com].

## Awaiting your suggestions and PR. CHEERSSSSSS
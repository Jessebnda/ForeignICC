import { io, Socket } from 'socket.io-client';
import WebSocket from 'ws';

export class MCPClient {
  private socket: Socket;
  private ws: WebSocket;
  private serverUrl: string;

  constructor(serverUrl: string = 'http://localhost:3000') {
    this.serverUrl = serverUrl;
    this.socket = io(serverUrl);
    this.ws = new WebSocket(`ws://localhost:3001`);

    this.setupSocketIO();
    this.setupWebSocket();
  }

  private setupSocketIO() {
    this.socket.on('connect', () => {
      console.log('Connected to MCP server via Socket.IO');
    });

    this.socket.on('disconnect', () => {
      console.log('Disconnected from MCP server');
    });
  }

  private setupWebSocket() {
    this.ws.on('open', () => {
      console.log('Connected to MCP server via WebSocket');
    });

    this.ws.on('close', () => {
      console.log('Disconnected from MCP server');
    });
  }

  public sendCommand(command: string, data: any) {
    this.socket.emit('mcp_command', {
      command,
      data
    });
  }

  public sendWebSocketMessage(message: string) {
    if (this.ws.readyState === WebSocket.OPEN) {
      this.ws.send(message);
    }
  }

  public disconnect() {
    this.socket.disconnect();
    this.ws.close();
  }
} 
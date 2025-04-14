import { Server, Socket } from 'socket.io';
import { WebSocketServer, WebSocket } from 'ws';

export class MCPServer {
  private io: Server;
  private wss: WebSocketServer;
  private port: number;

  constructor(port: number = 3000) {
    this.port = port;
    this.io = new Server(port, {
      cors: {
        origin: "*",
        methods: ["GET", "POST"]
      }
    });

    this.wss = new WebSocketServer({ port: port + 1 });

    this.setupSocketIO();
    this.setupWebSocket();
  }

  private setupSocketIO() {
    this.io.on('connection', (socket: Socket) => {
      console.log('Client connected via Socket.IO');

      socket.on('mcp_command', (data: { command: string; data: any }) => {
        console.log('Received MCP command:', data);
        // Handle MCP commands here
        this.handleMCPCommand(data);
      });

      socket.on('disconnect', () => {
        console.log('Client disconnected');
      });
    });
  }

  private setupWebSocket() {
    this.wss.on('connection', (ws: WebSocket) => {
      console.log('Client connected via WebSocket');

      ws.on('message', (message: string) => {
        console.log('Received WebSocket message:', message.toString());
        // Handle WebSocket messages here
        this.handleWebSocketMessage(message);
      });

      ws.on('close', () => {
        console.log('Client disconnected');
      });
    });
  }

  private handleMCPCommand(data: { command: string; data: any }) {
    // Implement MCP command handling logic here
    console.log('Processing MCP command:', data);
  }

  private handleWebSocketMessage(message: string) {
    // Implement WebSocket message handling logic here
    console.log('Processing WebSocket message:', message);
  }

  public start() {
    console.log(`MCP Server started on port ${this.port}`);
    console.log(`WebSocket Server started on port ${this.port + 1}`);
  }

  public stop() {
    this.io.close();
    this.wss.close();
    console.log('MCP Server stopped');
  }
} 
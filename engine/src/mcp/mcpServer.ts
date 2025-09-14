import {
  JSONRPCRequest,
  JSONRPCResponse,
  JSONRPCError,
  InitializeParams,
  InitializeResult,
  ToolCallParams,
  ToolCallResult,
  ListToolsResult,
  ListResourcesResult,
  ListPromptsResult,
  MCPErrorCode,
  Tool
} from './protocol';
import { MCPTools } from './tools';

export class MCPServer {
  private initialized: boolean = false;
  private mcpTools: MCPTools;
  private sessionId?: string;

  constructor(mcpTools: MCPTools) {
    this.mcpTools = mcpTools;
  }

  public async handleRequest(request: JSONRPCRequest): Promise<JSONRPCResponse> {
    try {
      // Extract session ID if present
      if (request.params?.sessionId) {
        this.sessionId = request.params.sessionId;
      }

      switch (request.method) {
        case 'initialize':
          return this.handleInitialize(request);

        case 'initialized':
          return this.handleInitialized(request);

        case 'tools/list':
          return this.handleToolsList(request);

        case 'tools/call':
          return this.handleToolCall(request);

        case 'resources/list':
          return this.handleResourcesList(request);

        case 'prompts/list':
          return this.handlePromptsList(request);

        case 'ping':
          return this.createResponse(request.id, { pong: true });

        default:
          return this.createErrorResponse(
            request.id,
            MCPErrorCode.MethodNotFound,
            `Method not found: ${request.method}`
          );
      }
    } catch (error) {
      console.error('MCP Server error:', error);
      return this.createErrorResponse(
        request.id || null,
        MCPErrorCode.InternalError,
        error instanceof Error ? error.message : 'Internal server error'
      );
    }
  }

  private handleInitialize(request: JSONRPCRequest): JSONRPCResponse {
    const params = request.params as InitializeParams;

    if (this.initialized) {
      return this.createErrorResponse(
        request.id,
        MCPErrorCode.AlreadyInitialized,
        'Server already initialized'
      );
    }

    this.initialized = true;

    const result: InitializeResult = {
      protocolVersion: '2024-11-05',
      capabilities: {
        tools: {},
        resources: {},
        prompts: {}
      },
      serverInfo: {
        name: 'clash-royale-mcp-server',
        version: '1.0.0'
      }
    };

    return this.createResponse(request.id, result);
  }

  private handleInitialized(request: JSONRPCRequest): JSONRPCResponse {
    if (!this.initialized) {
      return this.createErrorResponse(
        request.id,
        MCPErrorCode.NotInitialized,
        'Server not initialized'
      );
    }

    // Notification, no response needed
    if (request.id === null || request.id === undefined) {
      return this.createResponse(null, {});
    }

    return this.createResponse(request.id, {});
  }

  private handleToolsList(request: JSONRPCRequest): JSONRPCResponse {
    if (!this.initialized) {
      return this.createErrorResponse(
        request.id,
        MCPErrorCode.NotInitialized,
        'Server not initialized'
      );
    }

    const tools = this.mcpTools.getTools();
    const result: ListToolsResult = {
      tools: tools.map(tool => ({
        name: tool.name,
        description: tool.description,
        inputSchema: tool.inputSchema
      }))
    };

    return this.createResponse(request.id, result);
  }

  private async handleToolCall(request: JSONRPCRequest): Promise<JSONRPCResponse> {
    if (!this.initialized) {
      return this.createErrorResponse(
        request.id,
        MCPErrorCode.NotInitialized,
        'Server not initialized'
      );
    }

    const params = request.params as ToolCallParams;

    if (!params.name) {
      return this.createErrorResponse(
        request.id,
        MCPErrorCode.InvalidParams,
        'Tool name is required'
      );
    }

    try {
      const result = await this.mcpTools.executeTool(
        params.name,
        params.arguments || {},
        this.sessionId
      );

      // Convert the result to MCP format
      const toolResult: ToolCallResult = {
        content: result.content || [],
        isError: false
      };

      return this.createResponse(request.id, toolResult);
    } catch (error) {
      return this.createErrorResponse(
        request.id,
        MCPErrorCode.ToolNotFound,
        error instanceof Error ? error.message : `Tool execution failed: ${params.name}`
      );
    }
  }

  private handleResourcesList(request: JSONRPCRequest): JSONRPCResponse {
    if (!this.initialized) {
      return this.createErrorResponse(
        request.id,
        MCPErrorCode.NotInitialized,
        'Server not initialized'
      );
    }

    // No resources for now
    const result: ListResourcesResult = {
      resources: []
    };

    return this.createResponse(request.id, result);
  }

  private handlePromptsList(request: JSONRPCRequest): JSONRPCResponse {
    if (!this.initialized) {
      return this.createErrorResponse(
        request.id,
        MCPErrorCode.NotInitialized,
        'Server not initialized'
      );
    }

    // No prompts for now
    const result: ListPromptsResult = {
      prompts: []
    };

    return this.createResponse(request.id, result);
  }

  private createResponse(id: string | number | null | undefined, result: any): JSONRPCResponse {
    return {
      jsonrpc: '2.0',
      id: id !== undefined ? id : null,
      result
    };
  }

  private createErrorResponse(
    id: string | number | null | undefined,
    code: number,
    message: string,
    data?: any
  ): JSONRPCResponse {
    const error: JSONRPCError = {
      code,
      message
    };

    if (data !== undefined) {
      error.data = data;
    }

    return {
      jsonrpc: '2.0',
      id: id !== undefined ? id : null,
      error
    };
  }

  public reset(): void {
    this.initialized = false;
    this.sessionId = undefined;
  }
}
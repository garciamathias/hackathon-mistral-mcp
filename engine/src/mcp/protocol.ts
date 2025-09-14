// MCP Protocol Types and Interfaces

export interface JSONRPCRequest {
  jsonrpc: '2.0';
  method: string;
  params?: any;
  id?: string | number | null;
}

export interface JSONRPCResponse {
  jsonrpc: '2.0';
  id: string | number | null;
  result?: any;
  error?: JSONRPCError;
}

export interface JSONRPCError {
  code: number;
  message: string;
  data?: any;
}

// MCP Protocol Methods
export interface InitializeParams {
  protocolVersion: string;
  capabilities?: {
    experimental?: Record<string, any>;
    roots?: {
      listChanged?: boolean;
    };
    sampling?: Record<string, any>;
  };
  clientInfo?: {
    name: string;
    version?: string;
  };
}

export interface InitializeResult {
  protocolVersion: string;
  capabilities: {
    tools?: Record<string, any>;
    resources?: Record<string, any>;
    prompts?: Record<string, any>;
    logging?: Record<string, any>;
  };
  serverInfo: {
    name: string;
    version: string;
  };
}

export interface Tool {
  name: string;
  description?: string;
  inputSchema?: {
    type: string;
    properties?: Record<string, any>;
    required?: string[];
  };
}

export interface ToolCallParams {
  name: string;
  arguments?: any;
}

export interface ToolCallResult {
  content: Array<{
    type: 'text' | 'image' | 'resource';
    text?: string;
    data?: string;
    mimeType?: string;
    uri?: string;
  }>;
  isError?: boolean;
}

export interface ListToolsResult {
  tools: Tool[];
}

export interface Resource {
  uri: string;
  name?: string;
  description?: string;
  mimeType?: string;
}

export interface ListResourcesResult {
  resources: Resource[];
}

export interface Prompt {
  name: string;
  description?: string;
  arguments?: Array<{
    name: string;
    description?: string;
    required?: boolean;
  }>;
}

export interface ListPromptsResult {
  prompts: Prompt[];
}

// Error codes
export enum MCPErrorCode {
  ParseError = -32700,
  InvalidRequest = -32600,
  MethodNotFound = -32601,
  InvalidParams = -32602,
  InternalError = -32603,

  // MCP specific
  NotInitialized = -32001,
  AlreadyInitialized = -32002,
  ResourceNotFound = -32003,
  ToolNotFound = -32004,
  PromptNotFound = -32005,
}
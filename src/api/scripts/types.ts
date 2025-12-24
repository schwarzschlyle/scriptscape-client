// scriptscape-client/src/api/scripts/types.ts

export interface Script {
  id: string;
  name: string;
  projectId: string;
  text: string;
  version: number;
  metadata?: Record<string, any>;
  createdAt: string;
  updatedAt: string;
}

export interface CreateScriptRequest {
  name: string;
  text: string;
  metadata?: Record<string, any>;
}

export interface UpdateScriptRequest {
  name?: string;
  text?: string;
  metadata?: Record<string, any>;
}

export interface ScriptResponse extends Script {}

export interface ScriptsListResponse {
  data: Script[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

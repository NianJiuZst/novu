export interface IEnv {
	WEBSOCKET_ROOM: DurableObjectNamespace;
	JWT_SECRET: string;
	INTERNAL_API_KEY: string;
	API_URL?: string;
	REGION?: string;
}

export interface IConnectionMetadata {
	userId: string;
	environmentId: string;
	connectedAt: number;
	jwtToken: string;
}

export interface IWebSocketRoom {
	sendToUser(userId: string, event: string, data: any): Promise<void>;
	broadcast(event: string, data: any, excludeUserId?: string): Promise<void>;
	getActiveConnectionsForUser(userId: string): number;
	getConnectedUsers(): string[];
}

export interface IBulkMessage {
	userId: string;
	event: string;
	data?: any;
}

export interface IBulkSendRequest {
	messages: IBulkMessage[];
	environmentId: string;
}

export interface IBulkMessageResult {
	index: number;
	success: true;
	roomId: string;
	userId: string;
	event: string;
}

export interface IBulkMessageError {
	index: number;
	error: string;
	message: IBulkMessage;
}

export interface IBulkSendResponse {
	success: boolean;
	processed: number;
	failed: number;
	total: number;
	timestamp: string;
	results: IBulkMessageResult[];
	errors?: IBulkMessageError[];
}

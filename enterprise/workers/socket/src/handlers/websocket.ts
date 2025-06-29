import type { Context } from 'hono';

export async function handleWebSocketUpgrade(context: Context) {
	const userId = context.get('userId');
	const subscriberId = context.get('subscriberId');
	const organizationId = context.get('organizationId');
	const environmentId = context.get('environmentId');

	// Extract JWT token from query parameter
	const jwtToken = context.req.query('token');

	const roomId = `${environmentId}:${userId}`;

	// Apply EU jurisdiction if REGION is set to "eu"
	const region = context.env.REGION;
	const namespace = region === 'eu' ? context.env.WEBSOCKET_ROOM.jurisdiction('eu') : context.env.WEBSOCKET_ROOM;

	const id = namespace.idFromName(roomId);
	const stub = namespace.get(id);

	// Forward the request to the Durable Object with user info and JWT token
	const requestWithUserInfo = new Request(context.req.raw.url, {
		method: context.req.method,
		headers: {
			...Object.fromEntries(context.req.raw.headers.entries()),
			'X-User-Id': userId,
			'X-Subscriber-Id': subscriberId,
			'X-Organization-Id': organizationId,
			'X-Environment-Id': environmentId,
			'X-JWT-Token': jwtToken || '',
		},
		body: context.req.raw.body,
	});

	return stub.fetch(requestWithUserInfo);
}

// Send message handler - Protected by internal API key authentication
export async function handleSendMessage(context: Context) {
	try {
		const { userId, event, data, environmentId } = await context.req.json();

		// Validate required fields
		if (!userId || !event) {
			return context.json({ error: 'Missing required fields: userId and event' }, 400);
		}

		if (!environmentId) {
			return context.json({ error: 'Missing required field: environmentId' }, 400);
		}

		// Validate field types
		if (typeof userId !== 'string' || typeof event !== 'string' || typeof environmentId !== 'string') {
			return context.json({ error: 'Invalid field types: userId, event, and environmentId must be strings' }, 400);
		}

		// Create room ID based on environment and user
		const roomId = `${environmentId}:${userId}`;

		console.log(`[Internal API] Routing message to room: ${roomId} for user: ${userId}, event: ${event}`);

		/*
		 * Get the Durable Object instance for the appropriate room
		 * Apply EU jurisdiction if REGION is set to "eu"
		 */
		const region = context.env.REGION;
		const namespace = region === 'eu' ? context.env.WEBSOCKET_ROOM.jurisdiction('eu') : context.env.WEBSOCKET_ROOM;

		const id = namespace.idFromName(roomId);
		const stub = namespace.get(id);

		await stub.sendToUser(userId, event, data);

		return context.json({ success: true, roomId, timestamp: new Date().toISOString() });
	} catch (error) {
		console.error('Error sending message:', error);

		return context.json({ error: 'Internal server error' }, 500);
	}
}

// Send bulk messages handler - Protected by internal API key authentication
export async function handleSendBulkMessages(context: Context) {
	try {
		const { messages, environmentId } = await context.req.json();

		// Validate required fields
		if (!messages || !Array.isArray(messages)) {
			return context.json({ error: 'Missing or invalid required field: messages (must be an array)' }, 400);
		}

		if (!environmentId) {
			return context.json({ error: 'Missing required field: environmentId' }, 400);
		}

		if (typeof environmentId !== 'string') {
			return context.json({ error: 'Invalid field type: environmentId must be a string' }, 400);
		}

		if (messages.length === 0) {
			return context.json({ error: 'Messages array cannot be empty' }, 400);
		}

		if (messages.length > 100) {
			return context.json({ error: 'Maximum 100 messages allowed per bulk request' }, 400);
		}

		const results = [];
		const errors = [];
		const region = context.env.REGION;
		const namespace = region === 'eu' ? context.env.WEBSOCKET_ROOM.jurisdiction('eu') : context.env.WEBSOCKET_ROOM;

		for (let i = 0; i < messages.length; i++) {
			const message = messages[i];

			try {
				// Validate individual message
				if (!message.userId || !message.event) {
					errors.push({
						index: i,
						error: 'Missing required fields: userId and event',
						message,
					});
					continue;
				}

				if (typeof message.userId !== 'string' || typeof message.event !== 'string') {
					errors.push({
						index: i,
						error: 'Invalid field types: userId and event must be strings',
						message,
					});
					continue;
				}

				// Create room ID based on environment and user
				const roomId = `${environmentId}:${message.userId}`;

				console.log(`[Internal API Bulk] Routing message ${i + 1}/${messages.length} to room: ${roomId} for user: ${message.userId}, event: ${message.event}`);

				// Get the Durable Object instance for the appropriate room
				const id = namespace.idFromName(roomId);
				const stub = namespace.get(id);

				await stub.sendToUser(message.userId, message.event, message.data);

				results.push({
					index: i,
					success: true,
					roomId,
					userId: message.userId,
					event: message.event,
				});
			} catch (error) {
				console.error(`Error processing bulk message ${i}:`, error);
				errors.push({
					index: i,
					error: 'Internal server error',
					message,
				});
			}
		}

		const response = {
			success: errors.length === 0,
			processed: results.length,
			failed: errors.length,
			total: messages.length,
			timestamp: new Date().toISOString(),
			results,
			...(errors.length > 0 && { errors }),
		};

		const statusCode = errors.length === 0 ? 200 : errors.length === messages.length ? 500 : 207;

		return context.json(response, statusCode);
	} catch (error) {
		console.error('Error processing bulk messages:', error);

		return context.json({ error: 'Internal server error' }, 500);
	}
}

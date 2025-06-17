const express = require('express');
const { GetTranslations, GetTranslationsCommand } = require('./enterprise/packages/translation/dist/index.js');

const app = express();
app.use(express.json());

// Mock user session data
const mockUserSessionData = {
  organizationId: 'test-org-123',
  environmentId: 'test-env-456',
  _id: 'user-123'
};

// Create the usecase instance
const getTranslationsUsecase = new GetTranslations();

// Translation endpoint
app.get('/v2/translations', async (req, res) => {
  try {
    console.log('📥 Received request:', {
      query: req.query,
      url: req.url
    });

    const command = GetTranslationsCommand.create({
      organizationId: mockUserSessionData.organizationId,
      environmentId: mockUserSessionData.environmentId,
      groupIdentifier: req.query.groupIdentifier,
      locale: req.query.locale,
      page: req.query.page ? Number(req.query.page) : 0,
      limit: req.query.limit ? Number(req.query.limit) : 50,
    });

    const result = await getTranslationsUsecase.execute(command);
    
    console.log('📤 Sending response:', {
      totalItems: result.total,
      page: result.page,
      limit: result.limit
    });
    
    res.json(result);
  } catch (error) {
    console.error('❌ Error processing request:', error.message);
    res.status(500).json({ 
      error: 'Internal server error', 
      message: error.message 
    });
  }
});

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({ status: 'OK', timestamp: new Date().toISOString() });
});

// Start the server
const PORT = 3001;
app.listen(PORT, () => {
  console.log('🚀 Simple Translation Test Server Started!');
  console.log(`✅ Server running on http://localhost:${PORT}`);
  console.log('📍 Endpoints:');
  console.log(`   GET http://localhost:${PORT}/v2/translations`);
  console.log(`   GET http://localhost:${PORT}/health`);
  console.log('');
  console.log('📋 Test these commands:');
  console.log(`   curl "http://localhost:${PORT}/v2/translations"`);
  console.log(`   curl "http://localhost:${PORT}/v2/translations?locale=en_US"`);
  console.log(`   curl "http://localhost:${PORT}/v2/translations?groupIdentifier=welcome&page=0&limit=5"`);
  console.log(`   curl "http://localhost:${PORT}/health"`);
});

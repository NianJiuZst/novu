const { NestFactory } = require('@nestjs/core');
const { Module, Controller, Get, Query } = require('@nestjs/common');

// Mock the required decorators and dependencies
const UserSession = () => (target, propertyName, descriptor) => descriptor;

// Mock user session data
const mockUserSessionData = {
  organizationId: 'test-org-123',
  environmentId: 'test-env-456',
  _id: 'user-123'
};

// Import our translation module
const { EnterpriseTranslationModule, GetTranslations, GetTranslationsCommand } = require('./enterprise/packages/translation/dist/index.js');

// Create a simple controller that uses our translation logic
@Controller('/v2/translations')
class TestTranslationController {
  constructor() {
    this.getTranslationsUsecase = new GetTranslations();
  }

  @Get('/')
  async getTranslations(@Query() query) {
    const command = GetTranslationsCommand.create({
      organizationId: mockUserSessionData.organizationId,
      environmentId: mockUserSessionData.environmentId,
      groupIdentifier: query.groupIdentifier,
      locale: query.locale,
      page: query.page ? Number(query.page) : 0,
      limit: query.limit ? Number(query.limit) : 50,
    });

    return await this.getTranslationsUsecase.execute(command);
  }
}

@Module({
  controllers: [TestTranslationController],
  providers: [GetTranslations],
})
class TestAppModule {}

async function bootstrap() {
  console.log('🚀 Starting test translation server...');
  
  try {
    const app = await NestFactory.create(TestAppModule);
    app.enableCors();
    
    await app.listen(3001);
    console.log('✅ Test server is running on http://localhost:3001');
    console.log('📍 Translation endpoint: GET http://localhost:3001/v2/translations');
    console.log('📋 Example usage:');
    console.log('   curl "http://localhost:3001/v2/translations"');
    console.log('   curl "http://localhost:3001/v2/translations?locale=en_US&page=0&limit=5"');
    console.log('   curl "http://localhost:3001/v2/translations?groupIdentifier=welcome"');
    
  } catch (error) {
    console.error('❌ Failed to start server:', error.message);
    process.exit(1);
  }
}

// Set required environment variables
process.env.NOVU_ENTERPRISE = 'true';
process.env.NODE_ENV = 'development';

bootstrap();

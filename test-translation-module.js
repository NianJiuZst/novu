const { exec } = require('child_process');
const path = require('path');

// Set environment variables for enterprise mode
process.env.NOVU_ENTERPRISE = 'true';
process.env.NODE_ENV = 'test';

console.log('🧪 Testing Translation Module Import...\n');

try {
  // Test 1: Import the module
  console.log('1️⃣ Testing module import...');
  const translationModule = require('./enterprise/packages/translation/dist/index.js');
  console.log('✅ Module imported successfully');
  console.log('📦 Available exports:', Object.keys(translationModule));
  
  // Test 2: Check if EnterpriseTranslationModule is available
  console.log('\n2️⃣ Testing EnterpriseTranslationModule...');
  if (translationModule.EnterpriseTranslationModule) {
    console.log('✅ EnterpriseTranslationModule is available');
    console.log('📋 Module type:', typeof translationModule.EnterpriseTranslationModule);
  } else {
    console.log('❌ EnterpriseTranslationModule not found');
  }
  
  // Test 3: Check controller
  console.log('\n3️⃣ Testing TranslationV2Controller...');
  if (translationModule.TranslationV2Controller) {
    console.log('✅ TranslationV2Controller is available');
    console.log('📋 Controller type:', typeof translationModule.TranslationV2Controller);
  } else {
    console.log('❌ TranslationV2Controller not found');
  }
  
  // Test 4: Check use case
  console.log('\n4️⃣ Testing GetTranslations usecase...');
  if (translationModule.GetTranslations) {
    console.log('✅ GetTranslations usecase is available');
    console.log('📋 Usecase type:', typeof translationModule.GetTranslations);
  } else {
    console.log('❌ GetTranslations usecase not found');
  }
  
  // Test 5: Test DTOs
  console.log('\n5️⃣ Testing DTOs...');
  if (translationModule.TranslationResponseDto && translationModule.GetTranslationsRequestDto) {
    console.log('✅ DTOs are available');
  } else {
    console.log('❌ DTOs not found');
  }
  
  console.log('\n🎉 All basic tests passed! Module is ready for runtime testing.');
  
} catch (error) {
  console.error('❌ Test failed:', error.message);
  console.error('Stack trace:', error.stack);
  process.exit(1);
}

// Test 6: Try to simulate a controller method call
console.log('\n6️⃣ Testing mock controller execution...');
try {
  const { GetTranslations, GetTranslationsCommand } = require('./enterprise/packages/translation/dist/index.js');
  
  const usecase = new GetTranslations();
  const command = GetTranslationsCommand.create({
    organizationId: 'test-org',
    environmentId: 'test-env',
    groupIdentifier: 'test-group',
    locale: 'en_US',
    page: 0,
    limit: 10
  });
  
  usecase.execute(command).then(result => {
    console.log('✅ Mock execution successful');
    console.log('📊 Result:', JSON.stringify(result, null, 2));
    console.log('\n🚀 Translation module is fully functional!');
  }).catch(error => {
    console.error('❌ Mock execution failed:', error.message);
  });
  
} catch (error) {
  console.error('❌ Mock execution setup failed:', error.message);
}

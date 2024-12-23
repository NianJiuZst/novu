## 2.5.3 (2024-12-23)

### 🚀 Features

- **api-service:** plain cards fetch user organizations ([#7268](https://github.com/novuhq/novu/pull/7268))
- upgrade maily ([#7361](https://github.com/novuhq/novu/pull/7361))
- **api-service:** remove skip ref ([#7357](https://github.com/novuhq/novu/pull/7357))
- **dashboard:** integrations update and create flow ([#7281](https://github.com/novuhq/novu/pull/7281))
- **dashboard:** new integrations page view ([#7310](https://github.com/novuhq/novu/pull/7310))
- **dashboard:** scheduled digest ([#7314](https://github.com/novuhq/novu/pull/7314))
- **dashboard,api:** New maily variables function usage & update maily ([#7329](https://github.com/novuhq/novu/pull/7329))
- **api:** preview usecase ([#7330](https://github.com/novuhq/novu/pull/7330))
- **api:** Nv 5045 update the api to have same behavior as preference ([#7302](https://github.com/novuhq/novu/pull/7302))
- **dashboard:** Nv 4866 Enable override custom controls and implement custom controls for Delay & Digest ([#7288](https://github.com/novuhq/novu/pull/7288))
- **api:** add query parser ([#7267](https://github.com/novuhq/novu/pull/7267))
- **api:** Nv 5033 additional removal cycle found unneeded elements ([#7283](https://github.com/novuhq/novu/pull/7283))
- **dashboard:** Activity Feed Page - Stacked PR ([#7249](https://github.com/novuhq/novu/pull/7249))
- **dashboard:** digest fixed duration ([#7234](https://github.com/novuhq/novu/pull/7234))
- **api:** Nv 4966 e2e testing happy path - messages ([#7248](https://github.com/novuhq/novu/pull/7248))
- **api:** add push control schema ([#7252](https://github.com/novuhq/novu/pull/7252))
- **api:** add chat control schema ([#7251](https://github.com/novuhq/novu/pull/7251))
- **api:** add sms control schema ([#7250](https://github.com/novuhq/novu/pull/7250))
- **api:** revert preview tests that was deleted ([#7237](https://github.com/novuhq/novu/pull/7237))
- **api:** add full step data to workflow dto; refactor ([#7235](https://github.com/novuhq/novu/pull/7235))
- **dashboard:** Billing settings page in dashboard v2 ([#7203](https://github.com/novuhq/novu/pull/7203))
- **api:** 'Missing' issue missing when the control value has empty string ([#7244](https://github.com/novuhq/novu/pull/7244))
- **api:** add exception log ([#7225](https://github.com/novuhq/novu/pull/7225))
- **dashboard:** Nv 4525 workflow editor channel preferences ([#7212](https://github.com/novuhq/novu/pull/7212))
- **dashboard:** add delay step ([#7131](https://github.com/novuhq/novu/pull/7131))
- **dashboard:** NV-4969 export to code preview banner ([#7224](https://github.com/novuhq/novu/pull/7224))
- **dashboard:** add plain chat buttons ([#7209](https://github.com/novuhq/novu/pull/7209))
- **dashboard:** Implement email step editor & mini preview ([#7129](https://github.com/novuhq/novu/pull/7129))
- **dashboard:** api keys page ([#7204](https://github.com/novuhq/novu/pull/7204))
- **api:** Nv 4939 e2e testing happy path events ([#7208](https://github.com/novuhq/novu/pull/7208))
- **dashboard:** Inbox starter onboarding page ([#7154](https://github.com/novuhq/novu/pull/7154))
- **dashboard:** Getting started page ([#7132](https://github.com/novuhq/novu/pull/7132))
- **api:** gracefully preview ([#7190](https://github.com/novuhq/novu/pull/7190))
- **api:** converted bulk trigger to use SDK ([#7166](https://github.com/novuhq/novu/pull/7166))
- **api:** wip fix framework workflow issues ([#7147](https://github.com/novuhq/novu/pull/7147))
- **api:** fix framework workflow payload preview ([#7137](https://github.com/novuhq/novu/pull/7137))
- **dashboard:** add feature flags provider and hook ([#7133](https://github.com/novuhq/novu/pull/7133))
- **application-generic:** add SUBSCRIBER_WIDGET_JWT_EXPIRATION_TIME env variable ([#7105](https://github.com/novuhq/novu/pull/7105))
- **dashboard:** Sign up Questionnaire ([#7114](https://github.com/novuhq/novu/pull/7114))

### 🩹 Fixes

- **api-service:** Polish keysToObject ([#7362](https://github.com/novuhq/novu/pull/7362))
- **api-service,dashboard:** Crate of fixes for variable suggestions ([#7360](https://github.com/novuhq/novu/pull/7360))
- **dashboard:** fixed view execution logs button triggering the workflow ([#7335](https://github.com/novuhq/novu/pull/7335))
- **api-service:** digest schema - remove the schema defaults as it doesn't work with the framework ajv validation ([#7334](https://github.com/novuhq/novu/pull/7334))
- **api-service:** Add marks to tiptap zod schema ([#7339](https://github.com/novuhq/novu/pull/7339))
- **api-service:** skip sanitization for non-novu cloud based workflows ([#7354](https://github.com/novuhq/novu/pull/7354))
- **dashboard:** Tweak arbitrary variable handling ([#7351](https://github.com/novuhq/novu/pull/7351))
- **api:** @novu/api -> @novu/api-service ([#7348](https://github.com/novuhq/novu/pull/7348))
- **framework:** Remove @novu/shared dependency temporarily ([#7337](https://github.com/novuhq/novu/pull/7337))
- **api,dashboard:** Correct variable generation and parsing ([#7324](https://github.com/novuhq/novu/pull/7324))
- **web:** add show bridge menu for all orgs ([#7307](https://github.com/novuhq/novu/pull/7307))
- **api:** Crate of fixes part 2 ([#7292](https://github.com/novuhq/novu/pull/7292))
- **api:** centralize upsert validation  + improve nested error handling ([#7173](https://github.com/novuhq/novu/pull/7173))
- **api, worker, ws:** reintroduce New Relic import in instrument files ([#7275](https://github.com/novuhq/novu/pull/7275))
- **root:** update newrelic and @types/newrelic to latest versions ([#7269](https://github.com/novuhq/novu/pull/7269))
- **api, webhook, worker, ws:** remove duplicate New Relic import in bootstrap file ([#7161](https://github.com/novuhq/novu/pull/7161))
- **api:** dashboard workflow override ([#7253](https://github.com/novuhq/novu/pull/7253))
- **dashboard:** nested payload gen ([#7240](https://github.com/novuhq/novu/pull/7240))
- **api:** allow empty email preview ([#7239](https://github.com/novuhq/novu/pull/7239))
- **api:** Minor fix for OpenAPI specs ([f469fdb97](https://github.com/novuhq/novu/commit/f469fdb97))
- **api:** next build ([#7217](https://github.com/novuhq/novu/pull/7217))
- **api:** step naming ([#7140](https://github.com/novuhq/novu/pull/7140))
- **api:** session wrap connected true ([184c54905](https://github.com/novuhq/novu/commit/184c54905))
- **js:** Remove @novu/shared dependency" ([#7206](https://github.com/novuhq/novu/pull/7206))
- **js:** Remove @novu/shared dependency ([#6906](https://github.com/novuhq/novu/pull/6906))
- **api:** invalid schema ([#7184](https://github.com/novuhq/novu/pull/7184))
- **api:** regression bug ([#7182](https://github.com/novuhq/novu/pull/7182))
- **api,dashboard:** Invalid url error and in-app tabs spacing ([#7167](https://github.com/novuhq/novu/pull/7167))
- **api:** Resolve circular import issue for workflow update validation ([#7151](https://github.com/novuhq/novu/pull/7151))
- **api:** fix step id on sync to env ([#7139](https://github.com/novuhq/novu/pull/7139))

### ❤️  Thank You

- Adam Chmara @ChmaraX
- Biswajeet Das @BiswaViraj
- Dima Grossman @scopsy
- GalTidhar @tatarco
- George Desipris @desiprisg
- George Djabarov @djabarovgeorge
- Himanshu Garg @merrcury
- Pawan Jain
- Paweł Tymczuk @LetItRock
- Sokratis Vidros @SokratisVidros

## 2.5.2 (2024-12-23)

### 🚀 Features

- **api-service:** plain cards fetch user organizations ([#7268](https://github.com/novuhq/novu/pull/7268))
- upgrade maily ([#7361](https://github.com/novuhq/novu/pull/7361))
- **api-service:** remove skip ref ([#7357](https://github.com/novuhq/novu/pull/7357))
- **dashboard:** integrations update and create flow ([#7281](https://github.com/novuhq/novu/pull/7281))
- **dashboard:** new integrations page view ([#7310](https://github.com/novuhq/novu/pull/7310))
- **dashboard:** scheduled digest ([#7314](https://github.com/novuhq/novu/pull/7314))
- **dashboard,api:** New maily variables function usage & update maily ([#7329](https://github.com/novuhq/novu/pull/7329))
- **api:** preview usecase ([#7330](https://github.com/novuhq/novu/pull/7330))
- **api:** Nv 5045 update the api to have same behavior as preference ([#7302](https://github.com/novuhq/novu/pull/7302))
- **dashboard:** Nv 4866 Enable override custom controls and implement custom controls for Delay & Digest ([#7288](https://github.com/novuhq/novu/pull/7288))
- **api:** add query parser ([#7267](https://github.com/novuhq/novu/pull/7267))
- **api:** Nv 5033 additional removal cycle found unneeded elements ([#7283](https://github.com/novuhq/novu/pull/7283))
- **dashboard:** Activity Feed Page - Stacked PR ([#7249](https://github.com/novuhq/novu/pull/7249))
- **dashboard:** digest fixed duration ([#7234](https://github.com/novuhq/novu/pull/7234))
- **api:** Nv 4966 e2e testing happy path - messages ([#7248](https://github.com/novuhq/novu/pull/7248))
- **api:** add push control schema ([#7252](https://github.com/novuhq/novu/pull/7252))
- **api:** add chat control schema ([#7251](https://github.com/novuhq/novu/pull/7251))
- **api:** add sms control schema ([#7250](https://github.com/novuhq/novu/pull/7250))
- **api:** revert preview tests that was deleted ([#7237](https://github.com/novuhq/novu/pull/7237))
- **api:** add full step data to workflow dto; refactor ([#7235](https://github.com/novuhq/novu/pull/7235))
- **dashboard:** Billing settings page in dashboard v2 ([#7203](https://github.com/novuhq/novu/pull/7203))
- **api:** 'Missing' issue missing when the control value has empty string ([#7244](https://github.com/novuhq/novu/pull/7244))
- **api:** add exception log ([#7225](https://github.com/novuhq/novu/pull/7225))
- **dashboard:** Nv 4525 workflow editor channel preferences ([#7212](https://github.com/novuhq/novu/pull/7212))
- **dashboard:** add delay step ([#7131](https://github.com/novuhq/novu/pull/7131))
- **dashboard:** NV-4969 export to code preview banner ([#7224](https://github.com/novuhq/novu/pull/7224))
- **dashboard:** add plain chat buttons ([#7209](https://github.com/novuhq/novu/pull/7209))
- **dashboard:** Implement email step editor & mini preview ([#7129](https://github.com/novuhq/novu/pull/7129))
- **dashboard:** api keys page ([#7204](https://github.com/novuhq/novu/pull/7204))
- **api:** Nv 4939 e2e testing happy path events ([#7208](https://github.com/novuhq/novu/pull/7208))
- **dashboard:** Inbox starter onboarding page ([#7154](https://github.com/novuhq/novu/pull/7154))
- **dashboard:** Getting started page ([#7132](https://github.com/novuhq/novu/pull/7132))
- **api:** gracefully preview ([#7190](https://github.com/novuhq/novu/pull/7190))
- **api:** converted bulk trigger to use SDK ([#7166](https://github.com/novuhq/novu/pull/7166))
- **api:** wip fix framework workflow issues ([#7147](https://github.com/novuhq/novu/pull/7147))
- **api:** fix framework workflow payload preview ([#7137](https://github.com/novuhq/novu/pull/7137))
- **dashboard:** add feature flags provider and hook ([#7133](https://github.com/novuhq/novu/pull/7133))
- **application-generic:** add SUBSCRIBER_WIDGET_JWT_EXPIRATION_TIME env variable ([#7105](https://github.com/novuhq/novu/pull/7105))
- **dashboard:** Sign up Questionnaire ([#7114](https://github.com/novuhq/novu/pull/7114))

### 🩹 Fixes

- **api-service:** Polish keysToObject ([#7362](https://github.com/novuhq/novu/pull/7362))
- **api-service,dashboard:** Crate of fixes for variable suggestions ([#7360](https://github.com/novuhq/novu/pull/7360))
- **dashboard:** fixed view execution logs button triggering the workflow ([#7335](https://github.com/novuhq/novu/pull/7335))
- **api-service:** digest schema - remove the schema defaults as it doesn't work with the framework ajv validation ([#7334](https://github.com/novuhq/novu/pull/7334))
- **api-service:** Add marks to tiptap zod schema ([#7339](https://github.com/novuhq/novu/pull/7339))
- **api-service:** skip sanitization for non-novu cloud based workflows ([#7354](https://github.com/novuhq/novu/pull/7354))
- **dashboard:** Tweak arbitrary variable handling ([#7351](https://github.com/novuhq/novu/pull/7351))
- **api:** @novu/api -> @novu/api-service ([#7348](https://github.com/novuhq/novu/pull/7348))
- **framework:** Remove @novu/shared dependency temporarily ([#7337](https://github.com/novuhq/novu/pull/7337))
- **api,dashboard:** Correct variable generation and parsing ([#7324](https://github.com/novuhq/novu/pull/7324))
- **web:** add show bridge menu for all orgs ([#7307](https://github.com/novuhq/novu/pull/7307))
- **api:** Crate of fixes part 2 ([#7292](https://github.com/novuhq/novu/pull/7292))
- **api:** centralize upsert validation  + improve nested error handling ([#7173](https://github.com/novuhq/novu/pull/7173))
- **api, worker, ws:** reintroduce New Relic import in instrument files ([#7275](https://github.com/novuhq/novu/pull/7275))
- **root:** update newrelic and @types/newrelic to latest versions ([#7269](https://github.com/novuhq/novu/pull/7269))
- **api, webhook, worker, ws:** remove duplicate New Relic import in bootstrap file ([#7161](https://github.com/novuhq/novu/pull/7161))
- **api:** dashboard workflow override ([#7253](https://github.com/novuhq/novu/pull/7253))
- **dashboard:** nested payload gen ([#7240](https://github.com/novuhq/novu/pull/7240))
- **api:** allow empty email preview ([#7239](https://github.com/novuhq/novu/pull/7239))
- **api:** Minor fix for OpenAPI specs ([f469fdb97](https://github.com/novuhq/novu/commit/f469fdb97))
- **api:** next build ([#7217](https://github.com/novuhq/novu/pull/7217))
- **api:** step naming ([#7140](https://github.com/novuhq/novu/pull/7140))
- **api:** session wrap connected true ([184c54905](https://github.com/novuhq/novu/commit/184c54905))
- **js:** Remove @novu/shared dependency" ([#7206](https://github.com/novuhq/novu/pull/7206))
- **js:** Remove @novu/shared dependency ([#6906](https://github.com/novuhq/novu/pull/6906))
- **api:** invalid schema ([#7184](https://github.com/novuhq/novu/pull/7184))
- **api:** regression bug ([#7182](https://github.com/novuhq/novu/pull/7182))
- **api,dashboard:** Invalid url error and in-app tabs spacing ([#7167](https://github.com/novuhq/novu/pull/7167))
- **api:** Resolve circular import issue for workflow update validation ([#7151](https://github.com/novuhq/novu/pull/7151))
- **api:** fix step id on sync to env ([#7139](https://github.com/novuhq/novu/pull/7139))

### ❤️  Thank You

- Adam Chmara @ChmaraX
- Biswajeet Das @BiswaViraj
- Dima Grossman @scopsy
- GalTidhar @tatarco
- George Desipris @desiprisg
- George Djabarov @djabarovgeorge
- Himanshu Garg @merrcury
- Pawan Jain
- Paweł Tymczuk @LetItRock
- Sokratis Vidros @SokratisVidros
export enum DeliveryLifecycleDetail {
  USER_STEP_CONDITION = 'step_condition',
  SUBSCRIBER_PREFERENCE = 'preference',
  SUBSCRIBER_STEP_FILTERED_BY_TOPIC_SUBSCRIPTION_WORKFLOWS = 'step_filtered_by_topic_subscription_workflows',
  USER_MISSING_PHONE = 'missing_phone',
  USER_MISSING_EMAIL = 'missing_email',
  USER_MISSING_PUSH_TOKEN = 'missing_push_token',
  USER_MISSING_WEBHOOK_URL = 'missing_webhook_url',
  USER_MISSING_CREDENTIALS = 'some_channels_missing_credentials',
  WORKFLOW_MISSING_CHANNEL_STEP = 'workflow_missing_channel_step',
  UNKNOWN_ERROR = 'unknown_error',
  EXECUTION_STOPPED = 'execution_stopped',
  EXECUTION_CANCELED_BY_USER = 'execution_canceled_by_user',
}

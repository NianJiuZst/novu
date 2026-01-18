export type AuthMechanism =
  | 'DEFAULT'
  | 'SCRAM-SHA-1'
  | 'SCRAM-SHA-256'
  | 'MONGODB-X509'
  | 'GSSAPI'
  | 'PLAIN'
  | 'MONGODB-AWS'
  | 'MONGODB-OIDC';

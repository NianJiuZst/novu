import { ExpectedDnsRecordDto } from '../dtos/expected-dns-record.dto';

export function getMailServerDomain(): string | undefined {
  return process.env.MAIL_SERVER_DOMAIN?.replace('https://', '').replace('/', '') || undefined;
}

export function buildExpectedDnsRecords(domainName: string): ExpectedDnsRecordDto[] {
  const mailServerDomain = getMailServerDomain() ?? '';

  return [
    {
      type: 'MX',
      name: domainName,
      content: mailServerDomain,
      ttl: 'Auto',
      priority: 10,
    },
  ];
}

import { ExpectedDnsRecordDto } from '../dtos/expected-dns-record.dto';

export function buildExpectedDnsRecords(domainName: string): ExpectedDnsRecordDto[] {
  const mailServerDomain = process.env.MAIL_SERVER_DOMAIN?.replace('https://', '').replace('/', '') ?? '';

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

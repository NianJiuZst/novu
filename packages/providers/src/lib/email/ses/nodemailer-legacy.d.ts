declare module 'nodemailer-legacy' {
  interface NodemailerLegacy {
    createTransport(options: {
      SES: {
        ses: import('@aws-sdk/client-ses').SESClient;
        aws: { SendRawEmailCommand: typeof import('@aws-sdk/client-ses').SendRawEmailCommand };
      };
    }): import('nodemailer').Transporter;
  }

  const nodemailer: NodemailerLegacy;
  export default nodemailer;
}

export function generateTimestampHex() {
  const date = new Date();
  const timeInSeconds = Math.floor(date.getTime() / 1000);
  const buffer = Buffer.alloc(4);
  buffer.writeUInt32BE(timeInSeconds, 0);

  return buffer.toString('hex');
}

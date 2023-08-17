export function getEnvironment() {
  const domain = location.host
  return domain === 'mpcsnap.safeheron.com' ? 'PROD' : 'TEST'
}

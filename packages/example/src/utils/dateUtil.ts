export function formatToUSDateTime(timestamp: number) {
  const date = new Date(timestamp)

  const month = String(date.getUTCMonth() + 1).padStart(2, '0')
  const day = String(date.getUTCDate()).padStart(2, '0')
  const year = date.getUTCFullYear()

  const hours = String(date.getUTCHours() % 12 || 12).padStart(2, '0')
  const minutes = String(date.getUTCMinutes()).padStart(2, '0')
  const seconds = date.getUTCSeconds()

  const formattedDate = `${month}/${day}/${year}`
  const formattedTime = `${hours}:${minutes}:${seconds}`

  return `${formattedDate} ${formattedTime} UTC`
}

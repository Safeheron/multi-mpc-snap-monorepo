// upperCase
const upperCaseLettersReg = /[A-Z]/
// lowerCase
const lowerCaseLettersReg = /[a-z]/

// PasswordValid
export const isPasswordValid = (value: string) => {
  const valueLen = value.length
  const lenValid = valueLen >= 10
  const containsUpperCaseLetter = upperCaseLettersReg.test(value)
  const containsLowerCaseLetter = lowerCaseLettersReg.test(value)
  const containsNumber = /\d/.test(value)
  return (
    lenValid &&
    containsUpperCaseLetter &&
    containsLowerCaseLetter &&
    containsNumber
  )
}

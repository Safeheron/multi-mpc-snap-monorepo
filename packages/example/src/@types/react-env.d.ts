declare module '*.png' {
  const src: string
  export default src
}

declare module '*.svg' {
  const src: string
  export default src
}

declare module '*.scss' {
  const content: { [className: string]: string }
  export = content
}

declare module '*.less' {
  const content: { [className: string]: string }
  export = content
}

declare module '*.json' {
  const content: Record<string, string>
  export default content
}


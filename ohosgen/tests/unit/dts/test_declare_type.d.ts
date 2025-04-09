export type HelloType = number | boolean

export interface Hello {
  hello(value: HelloType): void
}

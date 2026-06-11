

// export interface BusinessError<T = void> extends Error {
//   code: number;
//   data?: T;
// }

// export interface BusinessError extends Error {
//   code: number;
//   data?: object;
// }

export interface BusinessError {
  code: number;
  data?: object;
}


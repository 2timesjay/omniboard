// TODO: Update to typescript 4.5 and/or rename `Resolution<T>`
// export type Awaited<T> = T extends PromiseLike<infer U> ? Awaited<U> : T
export type Awaited<T> = (value?: T | PromiseLike<T>) => void;

export type Rejection = (reason?: any) => void;
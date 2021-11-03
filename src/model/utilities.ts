// export type Awaited<T> = T extends PromiseLike<infer U> ? Awaited<U> : T
export type Awaited<T> = (value?: T | PromiseLike<T>) => void
// `?url` imports (resolved by Vite to an emitted file's URL), as declared by vite/client.
declare module '*?url' {
  const src: string;
  export default src;
}

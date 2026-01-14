
import { api } from "encore.dev/api";
import { Service } from "encore.dev/service";

export default new Service("frontend");

export const assets = api.static({
  path: "/frontend/*path",
  expose: true,
  dir: "./dist",
  notFound: "./dist/index.html",
  notFoundStatus: 200,
});

// Serve Docusaurus documentation
export const docs = api.static({
  path: "/docs/*path",
  expose: true,
  dir: "./dist/docs",
  notFound: "./dist/docs/index.html",
  notFoundStatus: 200,
});
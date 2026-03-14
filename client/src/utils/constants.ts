const NODE_ENV = import.meta.env.VITE_NODE_ENV || "development";

const API_URL =
  import.meta.env.VITE_API_URL ||
  (NODE_ENV === "production" ? import.meta.env.VITE_API_URL_PRODUCTION : import.meta.env.VITE_API_URL_DEVELOPMENT);

const AUTHORIZE = import.meta.env.VITE_AUTHORIZE || import.meta.env.AUTHORIZE;

export {
  NODE_ENV,
  API_URL,
  AUTHORIZE
}


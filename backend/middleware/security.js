const helmet = require("helmet");

const securityMiddleware = [
  helmet({
    contentSecurityPolicy: false,
    crossOriginEmbedderPolicy: false,
  }),
];

module.exports = securityMiddleware;

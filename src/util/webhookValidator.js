const assert = require('assert');
const crypto = require('crypto');
const HTTPError = require('./httpError');

/**
 * Generate a signature for the provided payload.
 *
 * The secret must be available as an environment variable, TRELLO_SECRET.
 * Returns a base64 digest of an HMAC-SHA1 hash.
 *
 * @param {String|Buffer} payload The payload to sign.
 */
exports.sign = (payload) => {
  const secret = process.env.TRELLO_SECRET;
  assert(secret, 'No secret');
  return crypto.createHmac('sha1', secret).update(payload).digest('base64');
};

function verify(signature, body, callbackURL) {
  console.info(`\n * callbackURL: ${callbackURL}`);
  console.info(`\n * body: ${JSON.stringify(body)}`);
  const payload = JSON.stringify(body) + callbackURL;
  console.info(`\n * payload: ${payload}`);
  const payloadSignature = exports.sign(payload);
  if (signature.length === payloadSignature.length
    && crypto.timingSafeEqual(Buffer.from(signature), Buffer.from(payloadSignature))) {
    return true;
  }
  console.info(`Provided signature (${signature}) did not match payload signature (${payloadSignature})`);
  throw new HTTPError(403, 'X-Trello-Webhook mis-match');
}

/**
 * Verify that the webhook request came from Trello.
 *
 * @param {object} headers The headers of the request.
 * @param {object} body The body of the request.
 */
exports.validateWebhook = ({ headers = null, body = null } = {}, callbackURL) => {
  if (!headers) throw new HTTPError(400);
  if (!body) throw new HTTPError(400);
  if (!headers['x-trello-webhook']) throw new HTTPError(400, 'Must provide X-Trello-Webhook header');
  if (!callbackURL) throw new HTTPError(400, 'Must provide callbackUrl');
  console.info(`X-Trello-Webhook: ${headers['x-trello-webhook']}`);
  return verify(headers['x-trello-webhook'], body, callbackURL);
};

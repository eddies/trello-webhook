const url = require('url');
const validator = require('./util/webhookValidator');
const HTTPError = require('./util/httpError');
const { webhookHandler: handler } = require('./handler/webhookHandler');

function getCallbackUrl(req) {
  const callbackUrl = process.env.TRELLO_CALLBACK_URL;
  if (callbackUrl) {
    return callbackUrl;
  }
  return url.format({
    protocol: req.protocol,
    host: req.get('host'),
    pathname: '/trelloWebhook', // hardcoded because req.{url|originalUrl|path} aren't returning a value on GCF
  });
}

/**
 * HTTP Cloud Function for Trello Webhook events.
 *
 * @param {Object} req Cloud Function request context.
 *                     More info: https://expressjs.com/en/api.html#req
 * @param {Object} res Cloud Function response context.
 *                     More info: https://expressjs.com/en/api.html#res
 */
exports.trelloWebhook = async (req, res) => {
  try {
    if (!req || !res || !req.method) {
      throw new HTTPError(400);
    }

    // console.info('\n**************** START *******************');
    // console.info(req);
    // console.info('\n+++++++++++++++ HEADERS ++++++++++++++++++');
    // console.info(JSON.stringify(req.headers));
    // console.info('\n++++++++++++++++ BODY +++++++++++++++++++');
    // console.info(JSON.stringify(req.body));
    // console.info('\n================  END  ===================');

    // Webhooks Make Validation HEAD Request
    // When you create a webhook, Trello will make a HEAD request to callbackURL you provide to
    // verify that it is a valid URL. Failing to respond to the HEAD request will result in the
    // webhook failing to be created.
    if (req.method === 'HEAD') {
      console.info(`HTTP 200: HEAD request from ${req.ip}`);
      res.status(200).send();
      return;
    }

    if (req.method !== 'POST') {
      console.info(`Rejected ${req.method} request from ${req.ip} (${req.headers['user-agent']})`);
      throw new HTTPError(405, 'Only HEAD and POST requests are accepted');
    }
    console.info(`Received request from ${req.ip} (${req.headers['user-agent']})`);

    // Verify that this request came from Trello
    validator.validateWebhook(req, getCallbackUrl(req));

    const request = await handler(req);

    // The location is the URI of the newly created resource
    const { location } = request;
    if (location) {
      res.setHeader('Location', location);
      res.status(201);
      console.info(`HTTP 201: Created ${location}`);
    } else {
      res.status(200);
    }
    res.send(request.body);
  } catch (e) {
    if (e instanceof HTTPError) {
      res.status(e.statusCode).send(e.message);
      console.info(`HTTP ${e.statusCode}: ${e.message}`);
    } else {
      res.status(500).send(e.message);
      console.error(`HTTP 500: ${e.message}`);
    }
  }
};

# Trello Webhook

[![Build Status](https://travis-ci.com/eddies/trello-webhook.svg?branch=master)](https://travis-ci.com/eddies/trello-webhook)

A [Google Cloud Function](https://cloud.google.com/functions/) that handles [Trello Webhooks](https://developers.trello.com/page/webhooks).

Implemented for the [Node 10 runtime](https://cloud.google.com/functions/docs/concepts/nodejs-10-runtime) with no additional runtime dependencies.

## Trello Card Completion Date and Due Complete

The default handler, `webhookHandler`, checks a card's Due Complete and Completion Date custom field when a card is moved to a list that starts with the name "QA".


## Deploy

1. Trello
  * Get your Developer API Key & generate a Token: https://trello.com/app-key
  * Set environment variables for the API key and token:
  ```console
  $ export TRELLO_API_KEY=<your key here>
  $ export TRELLO_TOKEN=<your token here>
  $ export TRELLO_SECRET=<your oauth secret here>
  ```
2. Google Cloud Functions
  * If you've never used gcloud or deployed a Cloud Function before, run through the [Quickstart](https://cloud.google.com/functions/docs/quickstart#functions-update-install-gcloud-node8) to make sure you have a GCP project with the Cloud Functions API enabled before proceeding.

  * Fork/clone this repo
  * Within the repo, deploy this cloud function with:

  ```console
  $ gcloud functions deploy trelloWebhook \
  --trigger-http --runtime nodejs10 --memory 128MB \
  --set-env-vars TRELLO_SECRET=$TRELLO_SECRET,TRELLO_API_KEY=$TRELLO_API_KEY,TRELLO_TOKEN=$TRELLO_TOKEN \
  --project $(gcloud config list --format 'value(core.project)')
  ```

  * Note the URL of your Cloud Function (also obtainable with: `gcloud functions describe trelloWebhook --format 'value(httpsTrigger.url)'`)
3. Create the Webhook

  ```console
  $ export TRELLO_CALLBACK_URL=$(gcloud functions describe trelloWebhook --format 'value(httpsTrigger.url)')
  $ export TRELLO_ID_MODEL=<the idModel of the board>
  $ curl -X POST -H "Content-Type: application/json" \
https://api.trello.com/1/tokens/${TRELLO_TOKEN}/webhooks?key=${TRELLO_API_KEY} \
-d '{
  "callbackURL":"'$TRELLO_CALLBACK_URL'",
  "idModel":"'$TRELLO_ID_MODEL'",
  "description": "Trello CompletionDate Webhook"
}'
  ```


## Testing

### Prerequisites
* Node 10
* npm 5.6.0 or later (yarn should be fine as well)

### Unit tests
```console
$ npm install
$ npm test
```

### Ad-hoc tests

Spin up the local development server:

```console
$ npm start
```

Easiest way to get the board and card ids (not shortLinks) is to append ".json" to the url for a board or card and grab the `id`.

```console
$ TRELLO_CALLBACK_URL="http://localhost:8080/trelloWebhook"
$ payload='{"action":{"data":{"listBefore":{"name":"To Do"},"listAfter":{"name":"QA"},"board":{"id":"5b61cb39d057323aaa8500b8"},"card":{"id":"5b62c29310f86186bf2ec580"}}}}'

$ signature=$(node -p "validator = require('./src/util/webhookValidator');validator.sign('${payload}${TRELLO_CALLBACK_URL}')")
```

Issue requests against the local endpoint, e.g.:

```console
$ curl -H "X-Trello-Webhook: ${signature}" \-H "Content-Type: application/json" -d "$payload" $TRELLO_CALLBACK_URL
```

For local testing of actual Trello events:

1. `npm start`
2. `npx smee -p 8080`
3. In order to test with smee, the url returned from the above command, e.g. "https://smee.io/abc123" needs to explicity set as the TRELLO_CALLBACK_URL (this shouldn't need to be done in an actual GCF deployment).


```console
$ export TRELLO_CALLBACK_URL=https://smee.io/abc123
$ curl -X POST -H "Content-Type: application/json" https://api.trello.com/1/tokens/${TRELLO_TOKEN}/webhooks?key=${TRELLO_API_KEY} -d '{
  "callbackURL":"'$TRELLO_CALLBACK_URL'",
  "idModel":"'$TRELLO_ID_MODEL'",
  "description": "webhook testing"
}'
```

Don't forget to delete the webhook afterwards:

* Retrieve all webhooks for a token:

```console
$ curl https://api.trello.com/1/tokens/${TRELLO_TOKEN}/webhooks?key=${TRELLO_API_KEY}
```

* Delete the webhook, substituting the `id` of the webhook for `idWebhook` below:

```console
$ curl -X "DELETE" https://api.trello.com/1/tokens/${TRELLO_TOKEN}/webhooks/{idWebhook}?key=${TRELLO_API_KEY}
```


## Contributing
Contributions welcome! Please see [CONTRIBUTING.md](docs/CONTRIBUTING.md).

## License
This project is released under the ISC license, which can be found in [LICENSE](LICENSE).

## References
* Google Cloud Functions
  * [HTTP Triggers](https://cloud.google.com/functions/docs/calling/http)
  * [Using Environment Variables](https://cloud.google.com/functions/docs/env-var)
  * [Node.js Emulator](https://cloud.google.com/functions/docs/emulator)
  * [Testing and CI/CD](https://cloud.google.com/functions/docs/bestpractices/testing)
* Trello
  * [Developer API Keys](https://trello.com/app-key)
  * [REST API: Add a new comment to a card](https://trello.readme.io/reference#cardsidactionscomments)
  * [Using the Custom Fields Power-Up](https://help.trello.com/article/1067-using-the-custom-fields-power-up)

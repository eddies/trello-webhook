const {
  putCustomField,
} = require('../../src/util/trello');

jest.mock('../../src/util/httpsRequest');
const { httpsRequest } = require('../../src/util/httpsRequest');

// Sanity test
// these don't have to be real tests to pass
test('required environment variables are set', () => {
  expect(process.env.TRELLO_API_KEY).toBeDefined();
  expect(process.env.TRELLO_TOKEN).toBeDefined();
});

test('putCustomField', async () => {
  httpsRequest.mockResolvedValue({
    id: '5b6c740402e6d67bb321e701',
    value: '{ "text": "alice"}',
    idCustomField: '5d1475299bd16c39d34bd8b8',
    idModel: '5b6701a089d45b33a885ac8b',
    modelType: 'card',
  });
  const request = await putCustomField('nqPiDKmw', '5d1475299bd16c39d34bd8b8', '{ "text": "alice"}');
  expect(request.body.idModel).toEqual('5b6701a089d45b33a885ac8b');
  expect(request.body.value).toEqual('{ "text": "alice"}');
});

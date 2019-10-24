const { trelloWebhook } = require('../src');

jest.mock('../src/util/httpsRequest');
// const { httpsRequest } = require('../src/util/httpsRequest');

const mockRes = {
  send(message) {
    this.message = message;
    return this;
  },
  setHeader(h) {
    this.location = h;
    return this;
  },
  status(s) {
    this.statusCode = s;
    return this;
  },
};

beforeEach(() => {
  jest.resetModules();
  delete process.env.GITHUB_SECRET;
});

test('trelloWebhook GET', async () => {
  const req = {
    method: 'GET',
    ip: '127.0.0.1',
    headers: {
      'user-agent': 'Agent Smith',
    },
  };
  await trelloWebhook(req, mockRes);
  expect(mockRes.statusCode).toBe(405);
  expect(mockRes.message).toBe('Only HEAD and POST requests are accepted');
});

test('trelloWebhook with missing req', async () => {
  await trelloWebhook(null, mockRes);
  expect(mockRes.statusCode).toBe(400);
  expect(mockRes.message).toBe('Bad Request');
});

test('trelloWebhook HEAD request', async () => {
  const req = {
    method: 'HEAD',
    ip: '127.0.0.1',
    headers: {
      'user-agent': 'Agent Smith',
    },
  };

  await trelloWebhook(req, mockRes);
  expect(mockRes.statusCode).toBe(200);
});

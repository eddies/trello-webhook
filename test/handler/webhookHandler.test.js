const { webhookHandler } = require('../../src/handler/webhookHandler');
const trello = require('../../src/util/trello');
// const HTTPError = require('../../src/util/httpError');

jest.mock('../../src/util/httpsRequest');
const { httpsRequest } = require('../../src/util/httpsRequest');

test('moving card to QA sets completion date and dueComplete', async () => {
  const req = {
    body: {
      action: {
        data: {
          listBefore: {
            name: 'To Do',
            id: '5b61cb4a6bd0876dc693ba73',
          },
          listAfter: {
            name: 'QA',
            id: '5b61cb4a6bd0876dc693ba73',
          },
          board: {
            shortLink: 'G7H0WkOc',
            name: 'GithubWebhookCloudFunction',
            id: '5b61cb39d057323aaa8500b8',
          },
          card: {
            shortLink: '3XrOaBuv',
            idShort: 3,
            name: 'Log all the things',
            id: '5b62c29310f86186bf2ec580',
            idList: '5b61cb4a6bd0876dc693ba73',
          },
        },
      },
    },
  };

  const putCustomFieldSpy = jest.spyOn(trello, 'putCustomField');
  const putCardSpy = jest.spyOn(trello, 'putCard');
  httpsRequest
    .mockResolvedValueOnce([{ // getCustomFields (truncated)
      id: '5cc7c7ae5d8ab757e2e6f56f',
      idModel: '5b61cb39d057323aaa8500b8',
      name: 'Completion Date',
    }])
    .mockResolvedValueOnce([{ // putCustomField (truncated)
      id: '5cc7c7ae5d8ab757e2e6f56f',
      idCustomField: '5b61cb39d057323aaa8500b8',
      value: {
        date: '2018-03-13T16:00:00.000Z',
      },
    }])
    .mockResolvedValueOnce({ // putCard (truncated)
      id: '5b62c29310f86186bf2ec580',
      dueComplete: true,
      due: '2018-03-13T16:00:00.000Z',
    });

  const request = await webhookHandler(req);
  expect(putCustomFieldSpy).toHaveBeenCalledWith(
    '5b62c29310f86186bf2ec580', // cardId
    '5cc7c7ae5d8ab757e2e6f56f', // idCustomField
    { date: expect.stringMatching(/\d{4}-[01]\d-[0-3]\dT[0-2]\d:[0-5]\d:[0-5]\d\.\d+([+-][0-2]\d:[0-5]\d|Z)/) },
  );
  expect(putCardSpy).toHaveBeenCalledWith(
    '5b62c29310f86186bf2ec580', // cardId
    {
      dueComplete: 'true',
      key: expect.stringMatching(/^[a-z0-9]+$/),
      token: expect.stringMatching(/^[a-z0-9]+$/),
    },
  );
  expect(request.body).toEqual(
    expect.objectContaining({
      due: expect.stringMatching(/\d{4}-[01]\d-[0-3]\dT[0-2]\d:[0-5]\d:[0-5]\d\.\d+([+-][0-2]\d:[0-5]\d|Z)/),
    }),
  );
});

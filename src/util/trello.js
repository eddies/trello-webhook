const querystring = require('querystring');
const { httpsRequest } = require('./httpsRequest');

const apiKey = process.env.TRELLO_API_KEY;
const token = process.env.TRELLO_TOKEN;


exports.getBoardId = async (cardId) => {
  const queryParams = querystring.stringify({
    fields: 'id',
    key: apiKey,
    token,
  });

  const options = {
    hostname: 'api.trello.com',
    port: 443,
    path: `/1/cards/${cardId}/board?${queryParams}`,
    method: 'GET',
  };

  const request = await httpsRequest(options);
  return request.id;
};

exports.getCustomFields = async (boardId) => {
  const queryParams = querystring.stringify({
    key: apiKey,
    token,
  });

  const options = {
    hostname: 'api.trello.com',
    port: 443,
    path: `/1/boards/${boardId}/customFields?${queryParams}`,
    method: 'GET',
  };

  return httpsRequest(options);
};

exports.putCustomField = async (cardId, idCustomField, value) => {
  const putData = JSON.stringify({
    value,
    key: apiKey,
    token,
  });

  const options = {
    hostname: 'api.trello.com',
    port: 443,
    path: `/1/card/${cardId}/customField/${idCustomField}/item`,
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json',
      'Content-Length': Buffer.byteLength(putData),
    },
  };

  const request = await httpsRequest(options, putData);
  console.info(`Updated custom field: ${request.idCustomField} on https://trello.com/c/${cardId}`);
  return { location: `https://trello.com/c/${cardId}`, body: request };
};

exports.putCard = async (cardId, params = {}) => {
  params.key = apiKey; // eslint-disable-line no-param-reassign
  params.token = token; // eslint-disable-line no-param-reassign
  const putData = JSON.stringify(params);

  const options = {
    hostname: 'api.trello.com',
    port: 443,
    path: `/1/card/${cardId}`,
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json',
      'Content-Length': Buffer.byteLength(putData),
    },
  };

  const request = await httpsRequest(options, putData);
  console.info(`Updated card: ${params} on https://trello.com/c/${cardId}`);
  return { location: `https://trello.com/c/${cardId}`, body: request };
};

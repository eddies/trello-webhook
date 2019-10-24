const trello = require('../util/trello');
const HTTPError = require('../util/httpError');


async function setCompletionDate(boardId, cardId, completionDate) {
  const customFields = await trello.getCustomFields(boardId);
  const completionDateField = customFields.filter((el) => el.name === 'Completion Date')[0];
  if (!completionDateField) {
    console.warn('No Completion Date Custom Field');
    throw new HTTPError(500, `No Completion Date Custom Field on board ${boardId}`);
  }

  const value = completionDate ? { date: completionDate.toISOString() } : '';
  console.info(`Completion Date: ${JSON.stringify(value)}`);
  return trello.putCustomField(cardId, completionDateField.id, value);
}

async function setDueComplete(cardId, isComplete) {
  return trello.putCard(cardId, { dueComplete: isComplete.toString() });
}

/**
 * Responds to a Trello Webhook Event.
 *
 * @param {object} req Cloud Function request context.
 */
exports.webhookHandler = async (req) => {
  let request = {};
  if (req.body && req.body.action && req.body.action.data
    && req.body.action.data.listBefore && req.body.action.data.listAfter) {
    const boardId = req.body.action.data.board.id;
    const cardId = req.body.action.data.card.id;
    const listBefore = req.body.action.data.listBefore.name;
    const listAfter = req.body.action.data.listAfter.name;
    console.info(`cardId: ${cardId}, listAfter: ${listAfter}`);
    if (listBefore === listAfter) {
      request.body = `List unchanged: ${listBefore}`;
    } else if (listAfter.startsWith('QA')) {
      await setCompletionDate(boardId, cardId, new Date());
      request = await setDueComplete(cardId, true);
    } else if (!listAfter.startsWith('QA') && !listAfter.startsWith('Done')) {
      await setCompletionDate(boardId, cardId);
      request = await setDueComplete(cardId, false);
    }
  } else {
    request.body = `Ignored action: ${req.body.action.type}`;
    console.info(request.body);
  }
  return request;
};

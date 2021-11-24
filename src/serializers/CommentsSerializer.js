const BaseSerializer = require('./BaseSerializer');

class CommentsSerializer extends BaseSerializer {
  constructor(model) {
    const serializedModel = model ? model.toJSON() : null;

    super('success', serializedModel);
  }
}

module.exports = CommentsSerializer;

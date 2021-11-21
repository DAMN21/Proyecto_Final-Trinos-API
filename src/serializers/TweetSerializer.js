const BaseSerializer = require('./BaseSerializer');

class TweetSerializer extends BaseSerializer {
  constructor(model) {
    const serializedModel = model ? model.toJSON() : null;
    super('success', serializedModel);
  }
}

module.exports = TweetSerializer;

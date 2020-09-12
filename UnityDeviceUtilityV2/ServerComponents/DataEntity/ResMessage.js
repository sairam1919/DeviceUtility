/**
 * Creates an instance of ResMessage.
 * 
 * @class ResMessage
 */
class ResMessage {
  constructor(message, status, data) {
    this.status = status;
    this.message = message;
    this.data = data;
  }
}

module.exports = ResMessage;

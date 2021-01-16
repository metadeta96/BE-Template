class ErrorResponse extends Error {
    /**
     * The status code
     * @private
     * @type {number}
     */
    #status = 0;

    /**
     * An additional message for more information
     * @private
     * @type {string}
     */
    #additionalMessage = '';

    /**
     * @constructor
     * @param {string} what the error message
     * @param {number} status an optional status code for the response. Defaults to 500.
     */
    constructor(what, status, additionalMessage) {
        super(what);
        this.#status = status || 500;
    }

    /**
     * The status code for the error
     * 
     * @returns {number} the error status code
     */
    get status() {
        return this.#status;
    }

    /**
     * The additional message for the error
     * 
     * @returns {string} the additional message
     */
    get additionalMessage() {
        return this.#additionalMessage;
    }
}

class PaymentNotPossibleError extends ErrorResponse {
    constructor(message, status) {
        super('It is not possible to pay for this job', status || 400, message);
    }
}

class NotEnoughFundsError extends ErrorResponse {
    constructor(message, status) {
        super('Your balance is not enough for paying this job', status || 400, message);
    }
}

class DepositNotPossibleError extends ErrorResponse {
    constructor(message, status) {
        super('It is not possible to deposit this amount on this profile balance', status || 400, message);
    }
}

module.exports = {
    ErrorResponse,
    PaymentNotPossibleError,
    NotEnoughFundsError,
    DepositNotPossibleError,
};

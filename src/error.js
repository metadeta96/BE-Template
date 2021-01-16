/**
 * Default error class for returning error messages with status code
 * 
 * @class
 * @type {ErrorResponse}
 * @extends Error
 */
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

/**
 * Job payment error class
 * Throw when there is a validation error during the job payment transaction
 * 
 * @class
 * @type {JobPaymentNotPossibleError}
 * @extends ErrorResponse
 */
class JobPaymentNotPossibleError extends ErrorResponse {
    /**
     * @constructor
     * @param {string} message an optional additional error message.
     * @param {number} status an optional status code for the response. Defaults to 400.
     */
    constructor(message, status) {
        super('It is not possible to pay for this job', status || 400, message);
    }
}

/**
 * Job payment error class
 * Throw when the client does not have enough money on its balance to pay for the job
 * 
 * @class
 * @type {NotEnoughFundsError}
 * @extends ErrorResponse
 */
class NotEnoughFundsError extends ErrorResponse {
    /**
     * @constructor
     * @param {string} message an optional additional error message.
     * @param {number} status an optional status code for the response. Defaults to 400.
     */
    constructor(message, status) {
        super('Your balance is not enough for paying this job', status || 400, message);
    }
}

/**
 * Client money depoisit error class
 * Throw when there is a validation error during a money deposit into a client balance
 * 
 * @class
 * @type {DepositNotPossibleError}
 * @extends ErrorResponse
 */
class DepositNotPossibleError extends ErrorResponse {
    /**
     * @constructor
     * @param {string} message an optional additional error message.
     * @param {number} status an optional status code for the response. Defaults to 400.
     */
    constructor(message, status) {
        super('It is not possible to deposit this amount on this profile balance', status || 400, message);
    }
}

module.exports = {
    ErrorResponse,
    JobPaymentNotPossibleError,
    NotEnoughFundsError,
    DepositNotPossibleError,
};

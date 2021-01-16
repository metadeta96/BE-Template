const { ErrorResponse } = require('../error');

const handleError = (err, req, res, next) => {
    let status = 500;
    let message;
    let additionalMessage;
    if (err instanceof ErrorResponse) {
        status = err.status || 500;
        message = err.message;
        additionalMessage = err.additionalMessage;
    } else if (err instanceof Error) {
        message = err.message;
    } else {
        message = err?.toString() ?? 'Internal Server Error';
    }

    res.status(status);
    res.json({
        error: message,
        message: additionalMessage,
    });
};

module.exports = {
    handleError
};

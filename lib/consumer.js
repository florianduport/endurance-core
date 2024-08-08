module.exports = {
    createConsumer: function (type, options, callback) {
        switch (type) {
            case 'amqp':
                const amqpConsumer = require('./consumers/amqp.consumer');
                return amqpConsumer.createConsumer(options, callback);
            case 'kafka':
                const kafkaConsumer = require('./consumers/kafka.consumer');
                return kafkaConsumer.createConsumer(options, callback);
            default:
                throw new Error('Unsupported event type');
        }
    }
};

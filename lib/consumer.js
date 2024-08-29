import * as amqpConsumer from './consumers/amqp.consumer';
import * as kafkaConsumer from './consumers/kafka.consumer';

const createConsumerModule = () => {
    return {
      createConsumer: function (type, options, callback) {
        switch (type) {
          case 'amqp':
            return amqpConsumer.createConsumer(options, callback);
          case 'kafka':
            return kafkaConsumer.createConsumer(options, callback);
          default:
            throw new Error('Unsupported event type');
        }
      }
    };
  };
  
const consumerInstance = createConsumerModule();

export default consumerInstance;
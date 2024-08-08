const { Kafka } = require('kafkajs');

async function createConsumer(options, callback) {
    const { brokers, groupId, topic } = options;
    const kafka = new Kafka({ brokers });
    const consumer = kafka.consumer({ groupId });

    try {
        await consumer.connect();
        await consumer.subscribe({ topic, fromBeginning: true });

        console.log(`Kafka consumer connected to topic: ${topic}`);

        await consumer.run({
            eachMessage: async ({ topic, partition, message }) => {
                const messageContent = message.value.toString();
                callback(messageContent);
            },
        });
    } catch (error) {
        console.error('Error connecting to Kafka', error);
    }
}

module.exports = { createConsumer };

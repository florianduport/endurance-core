// @ts-expect-error TS(2307): Cannot find module 'kafkajs' or its corresponding ... Remove this comment to see the full error message
import { Kafka } from 'kafkajs';

const createConsumer = async function (options: any, callback: any) {
    const { brokers, groupId, topic } = options;
    const kafka = new Kafka({ brokers });
    const consumer = kafka.consumer({ groupId });

    try {
        await consumer.connect();
        await consumer.subscribe({ topic, fromBeginning: true });
        console.log(`Kafka consumer connected to topic: ${topic}`);
        await consumer.run({
            eachMessage: async ({
                topic,
                partition,
                message
            }: any) => {
                const messageContent = message.value.toString();
                callback(messageContent);
            }
        });
    } catch (error) {
        console.error('Error connecting to Kafka', error);
    }
};

export { createConsumer };

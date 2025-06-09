import { Kafka, EachMessagePayload } from 'kafkajs';

interface ConsumerOptions {
    brokers: string[];
    groupId: string;
    topic: string;
}

type MessageCallback = (messageContent: string) => void;

const createConsumer = async (options: ConsumerOptions, callback: MessageCallback): Promise<void> => {
    const { brokers, groupId, topic } = options;
    const kafka = new Kafka({ brokers });
    const consumer = kafka.consumer({ groupId });

    try {
        await consumer.connect();
        await consumer.subscribe({ topic, fromBeginning: true });
        console.log(`Kafka consumer connected to topic: ${topic}`);
        await consumer.run({
            eachMessage: async ({ message }: EachMessagePayload) => {
                const messageContent = message.value?.toString() || '';
                callback(messageContent);
            }
        });
    } catch (error) {
        console.error('Error connecting to Kafka', error);
    }
};

export { createConsumer };

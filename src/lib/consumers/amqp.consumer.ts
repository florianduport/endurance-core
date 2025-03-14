import amqp, { ConsumeMessage } from 'amqplib';

interface ConsumerOptions {
    url: string;
    queue: string;
}

type MessageCallback = (messageContent: string) => void;

const createConsumer = async (options: ConsumerOptions, callback: MessageCallback): Promise<void> => {
    const { url, queue } = options;
    try {
        const connection = await amqp.connect(url);
        const channel = await connection.createChannel();
        await channel.assertQueue(queue, { durable: true });

        console.log(`RabbitMQ consumer connected to queue: ${queue}`);

        channel.consume(queue, (msg: ConsumeMessage | null) => {
            if (msg !== null) {
                const messageContent = msg.content.toString();
                callback(messageContent);
                channel.ack(msg);
            }
        });
    } catch (error) {
        console.error('Error connecting to RabbitMQ', error);
    }
};

export { createConsumer };

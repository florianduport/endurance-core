// @ts-expect-error TS(2307): Cannot find module 'amqplib' or its corresponding ... Remove this comment to see the full error message
import amqp from 'amqplib';

const createConsumer = async function (options: any, callback: any) {
    const { url, queue } = options;
    try {
        const connection = await amqp.connect(url);
        const channel = await connection.createChannel();
        await channel.assertQueue(queue, { durable: true });

        console.log(`RabbitMQ consumer connected to queue: ${queue}`);

        channel.consume(queue, (msg: any) => {
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

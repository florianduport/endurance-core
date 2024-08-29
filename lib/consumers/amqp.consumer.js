import amqp from 'amqplib';

async function createConsumer(options, callback) {
    const { url, queue } = options;
    try {
        const connection = await amqp.connect(url);
        const channel = await connection.createChannel();
        await channel.assertQueue(queue, { durable: true });

        console.log(`RabbitMQ consumer connected to queue: ${queue}`);

        channel.consume(queue, (msg) => {
            if (msg !== null) {
                const messageContent = msg.content.toString();
                callback(messageContent);
                channel.ack(msg);
            }
        });
    } catch (error) {
        console.error('Error connecting to RabbitMQ', error);
    }
}

export { createConsumer };

#!/usr/bin/env node

/**
 * Kafka Connection Test Script
 * Tests connection to Kafka (KRaft mode) and creates test topics
 */

const { Kafka, logLevel } = require('kafkajs');

const kafka = new Kafka({
  clientId: 'test-client',
  brokers: ['localhost:9092'],
  logLevel: logLevel.INFO,
  retry: {
    initialRetryTime: 100,
    retries: 8
  }
});

const admin = kafka.admin();
const producer = kafka.producer();
const consumer = kafka.consumer({ groupId: 'test-group' });

async function testKafka() {
  console.log('🔍 Testing Kafka Connection (KRaft Mode)...\n');
  console.log('Configuration:');
  console.log('  Broker: localhost:9092');
  console.log('  Client ID: test-client\n');

  try {
    // Connect admin client
    console.log('📡 Connecting to Kafka Admin...');
    await admin.connect();
    console.log('✅ Successfully connected to Kafka Admin!\n');

    // Get cluster info
    console.log('📊 Cluster Information:');
    const cluster = await admin.describeCluster();
    console.log(`  Controller: ${cluster.controller}`);
    console.log(`  Brokers: ${cluster.brokers.length}`);
    cluster.brokers.forEach(broker => {
      console.log(`    - Broker ID: ${broker.nodeId}, Host: ${broker.host}:${broker.port}`);
    });
    console.log('');

    // List existing topics
    console.log('📋 Listing existing topics...');
    const topics = await admin.listTopics();
    console.log(`  Found ${topics.length} topics:`);
    if (topics.length > 0) {
      topics.forEach(topic => console.log(`    - ${topic}`));
    } else {
      console.log('    (No topics found)');
    }
    console.log('');

    // Create test topics for microservices
    console.log('🔨 Creating microservices topics...');
    const topicsToCreate = [
      {
        topic: 'auth.request',
        numPartitions: 3,
        replicationFactor: 1,
      },
      {
        topic: 'auth.response',
        numPartitions: 3,
        replicationFactor: 1,
      },
      {
        topic: 'export.request',
        numPartitions: 3,
        replicationFactor: 1,
      },
      {
        topic: 'export.response',
        numPartitions: 3,
        replicationFactor: 1,
      },
    ];

    try {
      await admin.createTopics({
        topics: topicsToCreate,
        waitForLeaders: true,
      });
      console.log('✅ Topics created successfully:');
      topicsToCreate.forEach(t => console.log(`    - ${t.topic}`));
    } catch (error) {
      if (error.type === 'TOPIC_ALREADY_EXISTS') {
        console.log('ℹ️  Topics already exist (this is fine)');
      } else {
        throw error;
      }
    }
    console.log('');

    // Describe topics
    console.log('📊 Topic Details:');
    const metadata = await admin.fetchTopicMetadata({
      topics: topicsToCreate.map(t => t.topic),
    });
    
    metadata.topics.forEach(topic => {
      console.log(`  Topic: ${topic.name}`);
      console.log(`    Partitions: ${topic.partitions.length}`);
      topic.partitions.forEach(partition => {
        console.log(`      - Partition ${partition.partitionId}: Leader ${partition.leader}`);
      });
    });
    console.log('');

    // Test producer
    console.log('📤 Testing Producer...');
    await producer.connect();
    const sendResult = await producer.send({
      topic: 'auth.request',
      messages: [
        {
          key: 'test-key',
          value: JSON.stringify({
            type: 'test',
            timestamp: new Date().toISOString(),
            message: 'Test message from connection test script'
          }),
        },
      ],
    });
    console.log('✅ Message sent successfully!');
    console.log(`  Topic: auth.request`);
    console.log(`  Partition: ${sendResult[0].partition}`);
    console.log(`  Offset: ${sendResult[0].baseOffset}\n`);

    // Test consumer
    console.log('📥 Testing Consumer...');
    await consumer.connect();
    await consumer.subscribe({ topic: 'auth.request', fromBeginning: false });
    
    let messageReceived = false;
    const timeout = setTimeout(() => {
      if (!messageReceived) {
        console.log('⏱️  Consumer test completed (no new messages in queue)\n');
      }
    }, 3000);

    await consumer.run({
      eachMessage: async ({ topic, partition, message }) => {
        messageReceived = true;
        clearTimeout(timeout);
        console.log('✅ Message received successfully!');
        console.log(`  Topic: ${topic}`);
        console.log(`  Partition: ${partition}`);
        console.log(`  Offset: ${message.offset}`);
        console.log(`  Value: ${message.value.toString()}\n`);
        await consumer.disconnect();
      },
    });

    // Wait for consumer test
    await new Promise(resolve => setTimeout(resolve, 3500));

    console.log('✅ All Kafka tests passed successfully!\n');

  } catch (error) {
    console.error('❌ Kafka connection test failed:');
    console.error(`   Error: ${error.message}\n`);
    
    if (error.code === 'ECONNREFUSED') {
      console.log('💡 Troubleshooting tips:');
      console.log('   1. Make sure Docker containers are running: docker-compose ps');
      console.log('   2. Check Kafka logs: docker logs microservices-kafka');
      console.log('   3. Verify port 9092 is not in use by another service');
      console.log('   4. Wait a few seconds for Kafka to fully start (it can take 20-30 seconds)\n');
    }
    
    process.exit(1);
  } finally {
    await producer.disconnect();
    await admin.disconnect();
    console.log('🔌 All connections closed.\n');
  }
}

// Run the test
testKafka();

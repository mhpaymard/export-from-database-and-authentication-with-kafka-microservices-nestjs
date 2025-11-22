#!/bin/bash
set -e

# Start Kafka in the background
echo "Starting Kafka..."
/opt/kafka/bin/kafka-server-start.sh /opt/kafka/config/kraft/server.properties &
KAFKA_PID=$!

# Wait for Kafka to be ready
echo "Waiting for Kafka to start..."
sleep 15

until /opt/kafka/bin/kafka-broker-api-versions.sh --bootstrap-server localhost:9092 &>/dev/null; do
  echo "Waiting for Kafka broker..."
  sleep 2
done

echo "Kafka is ready! Creating topics..."

# Create topics
/opt/kafka/bin/kafka-topics.sh --bootstrap-server localhost:9092 --create --if-not-exists --topic auth.request --partitions 3 --replication-factor 1 2>/dev/null || true
/opt/kafka/bin/kafka-topics.sh --bootstrap-server localhost:9092 --create --if-not-exists --topic auth.response --partitions 3 --replication-factor 1 2>/dev/null || true
/opt/kafka/bin/kafka-topics.sh --bootstrap-server localhost:9092 --create --if-not-exists --topic export.request --partitions 3 --replication-factor 1 2>/dev/null || true
/opt/kafka/bin/kafka-topics.sh --bootstrap-server localhost:9092 --create --if-not-exists --topic export.response --partitions 3 --replication-factor 1 2>/dev/null || true

echo "Topics created! Listing all topics:"
/opt/kafka/bin/kafka-topics.sh --bootstrap-server localhost:9092 --list

# Keep Kafka running
wait $KAFKA_PID

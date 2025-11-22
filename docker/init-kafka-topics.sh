#!/bin/bash

# Wait for Kafka to be ready
echo "Waiting for Kafka to be ready..."
sleep 10

# Create topics if they don't exist
echo "Creating Kafka topics..."

/opt/kafka/bin/kafka-topics.sh --bootstrap-server localhost:9092 \
  --create --if-not-exists \
  --topic auth.request \
  --partitions 3 \
  --replication-factor 1

/opt/kafka/bin/kafka-topics.sh --bootstrap-server localhost:9092 \
  --create --if-not-exists \
  --topic auth.response \
  --partitions 3 \
  --replication-factor 1

/opt/kafka/bin/kafka-topics.sh --bootstrap-server localhost:9092 \
  --create --if-not-exists \
  --topic export.request \
  --partitions 3 \
  --replication-factor 1

/opt/kafka/bin/kafka-topics.sh --bootstrap-server localhost:9092 \
  --create --if-not-exists \
  --topic export.response \
  --partitions 3 \
  --replication-factor 1

echo "Kafka topics created successfully!"

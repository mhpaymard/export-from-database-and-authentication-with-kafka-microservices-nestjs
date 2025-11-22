#!/bin/bash

# Allow overriding bootstrap server when running inside another container
BOOTSTRAP_SERVER=${KAFKA_BOOTSTRAP_SERVERS:-kafka:29092}

# Wait for Kafka to be ready
echo "Waiting for Kafka broker to be ready (bootstrap: ${BOOTSTRAP_SERVER})..."
until /opt/kafka/bin/kafka-broker-api-versions.sh --bootstrap-server "${BOOTSTRAP_SERVER}" &>/dev/null; do
  echo "Kafka is unavailable - sleeping"
  sleep 2
done

echo "Kafka is ready! Creating topics..."

# Create topics with proper configuration
/opt/kafka/bin/kafka-topics.sh --bootstrap-server "${BOOTSTRAP_SERVER}" \
  --create --if-not-exists \
  --topic auth.request \
  --partitions 3 \
  --replication-factor 1 \
  --config retention.ms=604800000

/opt/kafka/bin/kafka-topics.sh --bootstrap-server "${BOOTSTRAP_SERVER}" \
  --create --if-not-exists \
  --topic auth.response \
  --partitions 3 \
  --replication-factor 1 \
  --config retention.ms=604800000

/opt/kafka/bin/kafka-topics.sh --bootstrap-server "${BOOTSTRAP_SERVER}" \
  --create --if-not-exists \
  --topic export.request \
  --partitions 3 \
  --replication-factor 1 \
  --config retention.ms=604800000

/opt/kafka/bin/kafka-topics.sh --bootstrap-server "${BOOTSTRAP_SERVER}" \
  --create --if-not-exists \
  --topic export.response \
  --partitions 3 \
  --replication-factor 1 \
  --config retention.ms=604800000

/opt/kafka/bin/kafka-topics.sh --bootstrap-server "${BOOTSTRAP_SERVER}" \
  --create --if-not-exists \
  --topic export.progress \
  --partitions 3 \
  --replication-factor 1 \
  --config retention.ms=86400000

echo "Topics created successfully!"
/opt/kafka/bin/kafka-topics.sh --bootstrap-server "${BOOTSTRAP_SERVER}" --list

echo "Topic creation completed!"

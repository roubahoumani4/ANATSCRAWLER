#!/bin/bash
# clean_and_fix_elasticsearch_indices.sh
# This script deletes unnecessary indices and creates/updates required ones with recommended mappings.

ES_HOST="192.168.1.110:9200"

# List of required indices
REQUIRED_INDICES=(
  "darkweb_structured"
  "anat_security.users"
  "filesearchdb.fs.chunks"
)

# Get all current indices
ALL_INDICES=$(curl -s "$ES_HOST/_cat/indices?h=index" | awk '{print $1}')

# Delete indices not in the required list
echo "Deleting indices not required..."
for idx in $ALL_INDICES; do
  skip=false
  for req in "${REQUIRED_INDICES[@]}"; do
    if [[ "$idx" == "$req" ]]; then
      skip=true
      break
    fi
  done
  if [ "$skip" = false ]; then
    echo "Deleting $idx ..."
    curl -X DELETE "$ES_HOST/$idx"
  fi
done

echo "Creating/updating required indices..."

# Create darkweb_structured index
curl -X PUT "$ES_HOST/darkweb_structured" -H 'Content-Type: application/json' -d'
{
  "mappings": {
    "properties": {
      "user_id": { "type": "keyword" },
      "name": { "type": "text" },
      "phone": { "type": "text" },
      "location": { "type": "text" },
      "link": { "type": "text" },
      "gender": { "type": "keyword" },
      "language": { "type": "keyword" }
    }
  }
}'
echo "Created or updated: darkweb_structured"

# Create or update anat_security.users
curl -X PUT "$ES_HOST/anat_security.users" -H 'Content-Type: application/json' -d'
{
  "mappings": {
    "properties": {
      "email": { "type": "keyword" },
      "username": { "type": "keyword" },
      "password": { "type": "keyword" }
    }
  }
}'
echo "Created or updated: anat_security.users"

# Create or update filesearchdb.fs.chunks
curl -X PUT "$ES_HOST/filesearchdb.fs.chunks" -H 'Content-Type: application/json' -d'
{
  "mappings": {
    "properties": {
      "field1": { "type": "text" },
      "field2": { "type": "text" }
    }
  }
}'
echo "Created or updated: filesearchdb.fs.chunks"

echo "Elasticsearch cleanup and index fix complete."

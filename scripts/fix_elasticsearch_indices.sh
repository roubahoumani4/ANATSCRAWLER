#!/bin/bash
# fix_elasticsearch_indices.sh
# This script will create missing indices with recommended mappings for your project.

ES_HOST="192.168.1.110:9200"

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

# (Optional) Add more index creations below as needed
# Example for anat_security.users
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

# Example for filesearchdb.fs.chunks (if you want to re-map it)
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

# Add more indices as needed following the above pattern

echo "Elasticsearch index fix complete."

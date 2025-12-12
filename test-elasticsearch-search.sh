#!/bin/bash

# Test script to search Elasticsearch and parse results
# Usage: ./test-elasticsearch-search.sh "search_query"

QUERY="${1:-adkeen99@yahoo.co.uk}"
ES_HOST="${2:-localhost:9200}"

echo "Searching for: $QUERY"
echo "Elasticsearch: $ES_HOST"
echo "===================="

# Search files_index
echo ""
echo "Searching files_index..."
curl -X POST "http://${ES_HOST}/files_index/_search" \
  -H 'Content-Type: application/json' \
  -d "{
    \"query\": {
      \"bool\": {
        \"should\": [
          {
            \"match\": {
              \"content\": {
                \"query\": \"${QUERY}\",
                \"operator\": \"and\"
              }
            }
          },
          {
            \"wildcard\": {
              \"content\": {
                \"value\": \"*${QUERY}*\",
                \"case_insensitive\": true
              }
            }
          }
        ],
        \"minimum_should_match\": 1
      }
    },
    \"size\": 10,
    \"_source\": [\"file_name\", \"file_path\", \"content\"],
    \"highlight\": {
      \"fields\": {
        \"content\": {
          \"fragment_size\": 500,
          \"number_of_fragments\": 3
        }
      }
    }
  }" 2>/dev/null | jq '{
    total: .hits.total.value,
    results: [.hits.hits[] | {
      file_name: ._source.file_name,
      score: ._score,
      highlights: .highlight.content
    }]
  }'

echo ""
echo "===================="
echo "Search complete!"

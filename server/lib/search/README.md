# Search Implementation Documentation

This module implements search functionality using Elasticsearch with support for fuzzy matching, exact matches, and phone number search.

## Features

- Multi-field search across different Elasticsearch indices
- Fuzzy matching for non-phone-number queries
- Exact phrase matching with higher boost
- Phone number normalization and matching
- Highlight extraction and result scoring
- Fallback to local search when Elasticsearch is unavailable

## Configuration

The search implementation looks for data in the following Elasticsearch indices:
- `fs_chunks_index`
- `filesearchdb.fs.chunks`

## Query Types

1. **Exact Phrase Match** - Highest boost (3)
   - Uses `match_phrase` for exact matches
   - Applied to the "content" field

2. **Multi-field Match** - Medium boost (2)
   - Searches across "data", "content", and "data.content"
   - Uses "best_fields" matching strategy

3. **Fuzzy Match** - Lower boost (1)
   - Only applied to non-phone-number queries
   - Uses AUTO fuzziness with prefix length of 2
   - Applied across all searchable fields

## Result Processing

Results are processed to include:
- Matched terms extraction from highlights
- Context snippets around matches
- Score-based sorting
- Fuzzy matching fallback if no direct matches are found

## Usage

```typescript
import { performFuzzySearch } from './lib/search';

// Simple search
const results = await performFuzzySearch('query', ELASTICSEARCH_URI);

// Phone number search (automatically normalized)
const results = await performFuzzySearch('123-456-7890', ELASTICSEARCH_URI);
```

## Error Handling

- Request timeout after 30 seconds
- Detailed error logging
- Fallback to empty results on error
- Invalid query validation

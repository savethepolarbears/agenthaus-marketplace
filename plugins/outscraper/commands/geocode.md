---
description: Geocode addresses to coordinates or reverse geocode latitude/longitude to addresses. Usage—`/outscraper:geocode '1600 Pennsylvania Ave, Washington DC'`, `/outscraper:geocode reverse '38.8977,-77.0365'`, `/outscraper:geocode batch addresses.csv`
---

# Outscraper Geocoding Command

Convert addresses to geographic coordinates (latitude/longitude) or reverse lookup coordinates to addresses.

## Forward Geocoding

Convert a street address to latitude and longitude coordinates.

```
/outscraper:geocode "1600 Pennsylvania Ave, Washington DC"
/outscraper:geocode "123 Main St, San Francisco, CA 94105"
/outscraper:geocode "Eiffel Tower, Paris, France"
/outscraper:geocode --batch addresses.csv
```

**Parameters:**
- `address` (required): Full or partial street address, landmark, or place name
- `--format` (optional): "json" or "csv" (default: json)
- `--batch` (optional): Path to CSV file with addresses in first column
- `--limit` (optional): Max results per address if ambiguous (default: 1)
- `--country` (optional): Country code to narrow search (us, uk, de, etc.)

**Output (Single Address):**
```json
{
  "address": "1600 Pennsylvania Ave, Washington DC",
  "latitude": 38.8977,
  "longitude": -77.0365,
  "place_name": "The White House",
  "place_type": "government_office",
  "formatted_address": "1600 Pennsylvania Avenue NW, Washington, DC 20500, USA",
  "components": {
    "street": "1600 Pennsylvania Avenue NW",
    "city": "Washington",
    "state": "DC",
    "zip": "20500",
    "country": "United States"
  },
  "accuracy": "high",
  "status": "success"
}
```

**Output (Batch Geocoding — CSV):**
```
address,latitude,longitude,place_name,accuracy
"1600 Pennsylvania Ave, Washington DC",38.8977,-77.0365,"The White House",high
"123 Main St, San Francisco, CA",37.7749,-122.4194,"Downtown SF",medium
```

**Output (Ambiguous Address — Multiple Results):**
```json
{
  "address": "Main St, USA",
  "results": [
    {
      "latitude": 42.3601,
      "longitude": -71.0589,
      "place_name": "Main Street, Boston, MA",
      "accuracy": "medium"
    },
    {
      "latitude": 37.7749,
      "longitude": -122.4194,
      "place_name": "Main Street, San Francisco, CA",
      "accuracy": "medium"
    }
  ],
  "status": "ambiguous"
}
```

---

## Reverse Geocoding

Convert latitude/longitude coordinates back to a street address.

```
/outscraper:geocode reverse "38.8977,-77.0365"
/outscraper:geocode reverse 38.8977 -77.0365
/obscraper:geocode reverse --batch coordinates.csv
```

**Parameters:**
- `coordinates` (required): Latitude,longitude or separate lat/lon arguments
- `--format` (optional): "json" or "csv"
- `--batch` (optional): Path to CSV file with coordinates in columns
- `--language` (optional): Language for result address (en, es, fr, de, etc.)

**Output (Single Coordinate):**
```json
{
  "latitude": 38.8977,
  "longitude": -77.0365,
  "address": "1600 Pennsylvania Avenue NW, Washington, DC 20500, USA",
  "place_name": "The White House",
  "place_type": "government_office",
  "components": {
    "street": "1600 Pennsylvania Avenue NW",
    "city": "Washington",
    "state": "DC",
    "zip": "20500",
    "country": "United States"
  },
  "accuracy": "high",
  "status": "success"
}
```

**Output (Batch Reverse Geocoding):**
```
latitude,longitude,address,place_name,place_type
38.8977,-77.0365,"1600 Pennsylvania Avenue NW, Washington, DC 20500, USA","The White House",government_office
37.7749,-122.4194,"Downtown, San Francisco, CA 94102, USA","San Francisco Downtown",neighborhood
```

---

## Batch Geocoding

Process multiple addresses or coordinates in a single operation.

```
/outscraper:geocode batch addresses.csv --mode forward
/outscraper:geocode batch coordinates.csv --mode reverse
/outscraper:geocode batch locations.csv --output results.csv
```

**Parameters:**
- `--file` (required): CSV file path
- `--mode` (required): "forward" or "reverse"
- `--output` (optional): Output CSV path (default: input_geocoded.csv)
- `--delimiter` (optional): CSV delimiter (default: comma)
- `--address-column` (optional): Column name for addresses (default: "address")
- `--lat-column` (optional): Column name for latitude (default: "latitude")
- `--lon-column` (optional): Column name for longitude (default: "longitude")

**Input CSV (Forward Geocoding):**
```
address,company,contact
1600 Pennsylvania Ave, Washington DC,US Government,John Smith
123 Main St, San Francisco CA,Tech Corp,Sarah Johnson
```

**Output CSV (Forward Geocoding):**
```
address,company,contact,latitude,longitude,place_name,accuracy
1600 Pennsylvania Ave, Washington DC,US Government,John Smith,38.8977,-77.0365,The White House,high
123 Main St, San Francisco CA,Tech Corp,Sarah Johnson,37.7749,-122.4194,Downtown SF,medium
```

**Input CSV (Reverse Geocoding):**
```
store_id,latitude,longitude,city
001,38.8977,-77.0365,Washington DC
002,37.7749,-122.4194,San Francisco
```

**Output CSV (Reverse Geocoding):**
```
store_id,latitude,longitude,city,address,place_name,accuracy
001,38.8977,-77.0365,Washington DC,1600 Pennsylvania Avenue NW Washington DC 20500,The White House,high
002,37.7749,-122.4194,San Francisco,Downtown San Francisco CA 94102,Downtown SF,medium
```

---

## Distance Calculation

Calculate distance between coordinates or addresses.

```
/outscraper:geocode distance "38.8977,-77.0365" "40.7128,-74.0060"
/outscraper:geocode distance "Washington DC" "New York City" --unit km
```

**Parameters:**
- `--unit` (optional): "km" (kilometers), "miles", or "m" (meters, default: km)

**Output:**
```json
{
  "origin": {
    "coordinates": [38.8977, -77.0365],
    "address": "Washington, DC, USA"
  },
  "destination": {
    "coordinates": [40.7128, -74.0060],
    "address": "New York, NY, USA"
  },
  "distance": {
    "km": 362.4,
    "miles": 225.2,
    "meters": 362400
  },
  "driving_time_hours": 6.2,
  "status": "success"
}
```

---

## Cost & Rate Limits

- **Forward geocoding**: 0.5 credit per address
- **Reverse geocoding**: 0.5 credit per coordinate
- **Batch processing**: Same per-item cost as individual requests
- **Distance calculation**: 1 credit per calculation
- **Rate limit**: ~30 QPS for geocoding operations

**Cost Examples:**
- Geocode 100 addresses: 50 credits
- Reverse geocode 500 coordinates: 250 credits
- Batch process mixed batch (1000 addresses): 500 credits

---

## Advanced Workflows

### 1. Store Location Mapping
```
1. Import list of 100 store addresses
2. Batch geocode to get coordinates
3. Create map visualization (latitude, longitude columns)
4. Add distance calculations from headquarters
5. Filter locations within service radius
6. Export KML for Google Earth mapping
```

### 2. Customer Location Analysis
```
1. Import customer addresses from CRM
2. Batch geocode to coordinates
3. Cluster by geographic region
4. Calculate distance to nearest branch
5. Identify underserved areas (10+ km radius)
6. Generate territory assignment report
```

### 3. Delivery Route Optimization
```
1. Get delivery stop addresses
2. Forward geocode all addresses
3. Calculate distances between stops
4. Sort by proximity to optimize route
5. Estimate delivery time per stop
6. Generate optimized route map
```

### 4. Service Area Coverage
```
1. Define coverage boundaries with coordinates
2. Reverse geocode boundary corners
3. Calculate distance from service center to perimeter
4. Identify gaps in coverage
5. Plan expansion locations
6. Create service area visualization
```

### 5. Competitive Proximity Analysis
```
1. Get competitor locations (addresses)
2. Forward geocode all locations
3. Identify competitors within 5 km of your locations
4. Calculate overlap concentration by region
5. Identify white space markets
6. Recommend expansion target zones
```

---

## Tips & Best Practices

1. **Address standardization**
   - Include full address: street, city, state/province, zip, country
   - Use standard abbreviations (St, Ave, Blvd not Street, Avenue, Boulevard)
   - Remove special characters or formatting inconsistencies
   - Geocoding accuracy improves with complete addresses

2. **Accuracy assessment**
   - "high" = street-level accuracy (within 5m)
   - "medium" = city-level accuracy (within 1km)
   - "low" = region-level accuracy (within 10km)
   - Filter results by accuracy threshold for critical applications

3. **Batch processing efficiency**
   - Group requests by country/region
   - Process in chunks of 1000-5000 addresses
   - Use CSV format for batch operations (cheaper per item)
   - Schedule batch jobs during off-peak hours

4. **Error handling**
   - Retry failed addresses with simplified format (city, state, country)
   - Check for typos in original addresses
   - Use country parameter to disambiguate ambiguous addresses
   - Log failed geocodes for manual review

5. **Privacy considerations**
   - Do not store personal addresses with coordinates
   - Aggregate location data at neighborhood or zip code level
   - Use general place names instead of specific addresses in public reports
   - Comply with data privacy regulations (GDPR, CCPA, etc.)

6. **Performance optimization**
   - Cache geocoded results to avoid re-processing
   - Pre-validate addresses before batch geocoding
   - Use reverse geocoding to normalize address format
   - Deduplicate addresses before processing

---

## Common Use Cases

| Use Case | Method | Input | Output |
|----------|--------|-------|--------|
| Map store locations | Forward Geocode | Address | Latitude, Longitude |
| Find nearby addresses | Reverse Geocode | Lat/Lon | Address, Place Name |
| Optimize delivery route | Distance | Multiple Addresses | Distance Matrix |
| Territory assignment | Batch Forward | Address List CSV | Coordinates CSV |
| Service area coverage | Distance + Reverse | Radius from center | Addresses within radius |
| Competitor analysis | Forward + Distance | Competitor addresses | Distance to your locations |
| Regional clustering | Batch Forward | Customer addresses | Grouped by region |

---

## Error Handling

```json
{
  "address": "XYZ Invalid Address 123",
  "status": "error",
  "error_code": "INVALID_ADDRESS",
  "message": "Address could not be geocoded. Please verify spelling and format."
}
```

Common error codes:
- `INVALID_ADDRESS` — Address format unrecognized or incomplete
- `NOT_FOUND` — Address does not exist in database
- `AMBIGUOUS` — Multiple possible matches (provide more specificity)
- `RATE_LIMIT` — API rate limit exceeded (retry after 60 seconds)
- `API_ERROR` — Temporary service issue (retry with exponential backoff)
- `INSUFFICIENT_CREDITS` — Upgrade account or purchase credits

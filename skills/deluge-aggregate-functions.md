# Deluge: Aggregate Functions (No Iteration)

## Purpose
Replace iterative `for each` loops with built-in Deluge aggregate functions for counting, summing, averaging, and more. These execute server-side without iteration.

## Syntax
```deluge
<variable> = <Form>[criteria].<method>;
```

Test Aathira

## Aggregate Methods

| Method | Returns | Description |
|--------|---------|-------------|
| `.count()` | Bigint | Count of matching records |
| `.sum(field)` | Bigint/Decimal | Sum of field values |
| `.avg(field)` | Bigint/Decimal | Average of field values |
| `.minimum(field)` | Any | Smallest field value |
| `.maximum(field)` | Any | Largest field value |
| `.distinct(field)` | List | Unique field values |

## Examples

### Count Records
**Before (iterative — DO NOT use):**
```deluge
records = Shipping_Method[ID != 0];
total = 0;
for each r in records
{
    total = total + 1;
}
```

**After (aggregate — USE this):**
```deluge
total = Shipping_Method[ID != 0].count();
```

### Sum Field Values
```deluge
total_revenue = Orders[Status == "Paid"].sum(Amount);
```

### Average Field Values
```deluge
avg_rating = Reviews[Rating != 0].avg(Rating);
```

### Get Unique Values
```deluge
unique_cities = Customers[ID != 0].distinct(City);
```

## Key Benefits
- **Less code** — 5+ lines reduced to 1 line
- **Faster** — server-side execution, no client iteration
- **Cleaner** — intent is immediately obvious

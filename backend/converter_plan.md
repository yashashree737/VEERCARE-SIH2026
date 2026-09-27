# Converter Function: CSV Line to JSON to Supabase

This plan outlines the architecture and approach for a converter function that reads individual lines from your `data2.csv` file, formats them as JSON, and seamlessly pushes them into your Supabase database.

## Objective
Create a scalable pipeline that converts raw CSV rows into structured JSON payloads and inserts them into Supabase, matching your existing normalized database schema.

## Overall Brief

The converter function will act as a bridge between the raw `data2.csv` file and your database. Instead of loading the entire massive file into memory at once, the function will process it **line-by-line** (or in small batches). For each line, it will:
1. Parse the row into a Python dictionary.
2. Structure the data into the appropriate JSON format that your tables expect (e.g., separating Unit data, Personnel Profile data, and Log data).
3. Push the formatted JSON directly to Supabase.

## Implementation Plan

### 1. Dependencies and Initialization
- We will utilize Python's built-in `csv` module (specifically `csv.DictReader`) to read the file row by row without overwhelming the system memory.
- To communicate with Supabase, we have two options:
  - **Option A (Current Ecosystem):** Reuse your existing SQLAlchemy setup (`database.py`) and simply map the dictionary to your SQLAlchemy models (like `Unit`, `User`, `PersonnelProfile`), then use `db.commit()`.

### 2. The Converter Function Logic
We will build a core function, for example, `process_csv_row(row_dict)`. Inside this function:
- **Unit Data Extraction:** We'll check if the `unit_id` from the row already exists in Supabase. If not, we construct a JSON payload for the `units` table and insert it.
- **User / Personnel Data Extraction:** We'll check if the `personnel_id` exists. If not, we create a JSON payload for the `users` and `personnel_profiles` tables containing fields like `rank`, `age_band`, and `deployment_zone`.
- **Log / Metrics Data Extraction:** Since every line in the CSV represents a weekly log for a soldier, we will construct JSON payloads for `duty_hr_logs`, `health_vitals_logs`, or `ml_predictions` based on the metrics in that specific row (like `duty_hours`, `sleep_quality_score`, `strain_index`) and insert them.

### 3. Iteration and Error Handling
- A wrapper script will open `data2.csv` and loop through each line, passing it to `process_csv_row(row_dict)`.
- We will include `try-except` blocks to catch and log any rows that fail to insert (e.g., due to missing critical fields or duplicate constraints) so the process doesn't crash midway through the 60,000+ rows.

## Open Questions

> [!IMPORTANT]
> 1. **Insertion Method:** Do you prefer to use the existing SQLAlchemy engine (like in your `push_to_supabase.py` script), or would you rather use the native `supabase-py` client (which requires a Supabase URL and Service Key)?
> 2. **Batching:** Sending 60,000 separate network requests (one for each line) can be slow. Should we design the function to collect 100-500 lines of JSON at a time and do a "bulk insert" to Supabase for better performance?
> 3. **Data Updates:** If a line contains data for a `personnel_id` that already exists in Supabase, should the function update their profile with the new line's data, or just append the new weekly logs (Duty/Health) to their history?
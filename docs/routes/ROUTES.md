Routes Data – Authoring Guide

Purpose
- Capture “actual” routes (incl. public transport) with high detail, without you writing code.
- You provide segment info (origin/destination/mode/waypoints/optional distance). I convert to map-ready data and wire it in.

How To Provide Your Routes
- Option A (simple text): Send lines in this format per segment:
  - id, title, mode, origin, destination, waypoints(optional), departAt(optional), distanceKm(optional), mapLink(optional)
  - Example:
    - travel-001-walk, 福岡空港→ホテル, walk, "福岡空港", "博多駅前ホテル", "東比恵駅; 博多駅", , 3,
    - travel-002-train, 羽田→渋谷, train, "羽田空港第1ターミナル駅", "渋谷駅", "浜松町駅; 品川駅", , 18,
- Option B (spreadsheet/CSV): Fill docs/routes/routes-template.csv and send it back.

Fields (per segment)
- id: unique id (e.g., travel-001-walk)
- title: optional short label for the segment
- mode: walk | bus | train | flight (add others if needed)
- origin/destination: place names or Google Maps share links (preferred for precision)
- waypoints: optional stops (semicolon separated)
- departAt: optional departure time (helps with transit routing accuracy)
- distanceKm: optional; if you provide, I’ll use it as the authoritative value
- mapLink: optional reference (e.g., a Google Maps URL you already searched)

What I Will Do
- Convert your segments into stable GeoJSON route shapes per segment.
- Store them under public/data/routes/<segment-id>.geojson.
- Render them in the MovePage with a detailed map (no coding needed from you).

Privacy & Attribution
- Map tiles/providers require attribution (I’ll add a small footer if needed).
- If we choose Google Maps live routing, an API key is required; otherwise, we can use an OSS stack (MapLibre + public tiles) and prebuilt route shapes.

Next Steps
- Fill in routes-template.csv or send your segments as text (Option A).
- I’ll convert and integrate them. No other action needed on your side.


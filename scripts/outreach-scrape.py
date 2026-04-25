"""
outreach-scrape.py — Generador de leads para outreach UnToque.

Uso:
    # Modo manual: lee restaurants_seed.csv y enriquece con email/teléfono.
    python outreach-scrape.py --mode manual --output ./out/leads.csv

    # Modo Apify: requiere APIFY_TOKEN env var. Llama al actor
    # compass/google-maps-extractor con query "restaurantes <ciudad>".
    APIFY_TOKEN=xxx python outreach-scrape.py --mode apify --city "Buenos Aires" --limit 250

Argumentos:
    --mode      manual | apify        (default: manual)
    --city      ciudad de búsqueda    (sólo apify)
    --limit     máx leads por corrida (default: 500, hard cap: 500)
    --output    ruta CSV de salida    (default: outreach_leads_YYYY-MM-DD.csv)

Inputs esperados (modo manual):
    restaurants_seed.csv con columnas: name, city, instagram_handle, gmaps_url

Output (cualquier modo):
    CSV con columnas:
        name, city, type, party_size_estimate, instagram, email,
        phone, gmaps_url, status, tier
    - status arranca siempre en "cold"
    - tier se calcula con followers IG: A >5k, B 1-5k, C <1k

Dependencias opcionales:
    pip install apify-client    # solo si se usa --mode apify

Notas:
    - Sin credentials hardcoded. Todo via env vars.
    - Cap de 500 leads por corrida para no quemar API rate limit.
    - El scraping de IG bio está stubeado (TODO) — la bajada real
      requiere o instagrapi (login) o un actor Apify dedicado.
"""

import argparse
import csv
import os
import re
import sys
from datetime import date
from typing import Iterable

# ---------------------------------------------------------------- constantes

MAX_LEADS = 500
CSV_FIELDS = [
    "name",
    "city",
    "type",
    "party_size_estimate",
    "instagram",
    "email",
    "phone",
    "gmaps_url",
    "status",
    "tier",
]
SEED_CSV = "restaurants_seed.csv"


# ---------------------------------------------------------------- utilidades


def categorize_tier(followers: int | None) -> str:
    """A si >5k, B si 1-5k, C si <1k o None."""
    if not followers or followers < 1000:
        return "C"
    if followers < 5000:
        return "B"
    return "A"


def classify_type(name: str) -> str:
    """Heurística simple sobre el nombre del local."""
    n = (name or "").lower()
    if any(k in n for k in ("café", "cafe", "coffee", "bakery", "panaderia")):
        return "café"
    if any(k in n for k in ("bar", "pub", "cervecería", "cerveceria", "wine")):
        return "bar"
    return "restaurante"


def estimate_party_size(venue_type: str) -> str:
    """Tamaño promedio de mesa esperado (rango)."""
    return {
        "restaurante": "2-6",
        "bar": "2-4",
        "café": "1-3",
    }.get(venue_type, "2-4")


def parse_email_from_bio(bio: str) -> str:
    """Extrae primer email de un texto libre."""
    if not bio:
        return ""
    m = re.search(r"[\w\.\-+]+@[\w\.\-]+\.\w+", bio)
    return m.group(0) if m else ""


def parse_phone_from_bio(bio: str) -> str:
    """Extrae primer teléfono AR plausible (+54 9 ...)."""
    if not bio:
        return ""
    m = re.search(r"(\+?54\s?9?\s?\d{2,4}[\s\-]?\d{3,4}[\s\-]?\d{3,4})", bio)
    return m.group(0) if m else ""


# ---------------------------------------------------------------- modo manual


def fetch_ig_bio(handle: str) -> tuple[str, int]:
    """
    TODO: implementar scraping de bio + followers de IG.
    Opciones:
      a) Actor Apify "apify/instagram-profile-scraper".
      b) Lib instagrapi (requiere login + 2FA).
      c) Endpoint público https://www.instagram.com/<handle>/?__a=1 (deprecado).
    Por ahora devuelve placeholder.
    """
    _ = handle
    return ("", 0)


def run_manual(seed_path: str) -> list[dict]:
    if not os.path.exists(seed_path):
        print(f"[!] No encuentro {seed_path}. Creá el CSV con columnas: name, city, instagram_handle, gmaps_url",
              file=sys.stderr)
        return []

    leads: list[dict] = []
    with open(seed_path, encoding="utf-8") as f:
        reader = csv.DictReader(f)
        for row in reader:
            name = (row.get("name") or "").strip()
            if not name:
                continue
            handle = (row.get("instagram_handle") or "").strip().lstrip("@")
            bio, followers = fetch_ig_bio(handle) if handle else ("", 0)
            venue_type = classify_type(name)
            leads.append({
                "name": name,
                "city": (row.get("city") or "").strip(),
                "type": venue_type,
                "party_size_estimate": estimate_party_size(venue_type),
                "instagram": f"@{handle}" if handle else "",
                "email": parse_email_from_bio(bio),
                "phone": parse_phone_from_bio(bio),
                "gmaps_url": (row.get("gmaps_url") or "").strip(),
                "status": "cold",
                "tier": categorize_tier(followers),
            })
    return leads


# ---------------------------------------------------------------- modo apify


def run_apify(city: str, limit: int) -> list[dict]:
    token = os.getenv("APIFY_TOKEN")
    if not token:
        print("[!] APIFY_TOKEN no seteado. Exportalo o usá --mode manual.", file=sys.stderr)
        return []

    try:
        # pip install apify-client (opcional)
        from apify_client import ApifyClient  # type: ignore
    except ImportError:
        print("[!] apify-client no instalado. Corré: pip install apify-client", file=sys.stderr)
        return []

    client = ApifyClient(token)
    run_input = {
        "searchStringsArray": [f"restaurantes {city}"],
        "maxCrawledPlacesPerSearch": min(limit, MAX_LEADS),
        "language": "es",
        "countryCode": "ar",
    }
    print(f"[*] Lanzando actor compass/google-maps-extractor para {city} (max {run_input['maxCrawledPlacesPerSearch']})...")
    run = client.actor("compass/google-maps-extractor").call(run_input=run_input)

    leads: list[dict] = []
    dataset = client.dataset(run["defaultDatasetId"]).iterate_items()  # type: ignore
    for item in dataset:
        name = item.get("title") or item.get("name") or ""
        if not name:
            continue
        venue_type = classify_type(name)
        # Apify devuelve a veces "additionalInfo" con redes sociales.
        ig = ""
        for key in ("instagrams", "social", "additionalInfo"):
            v = item.get(key)
            if isinstance(v, list) and v:
                ig = str(v[0])
                break
        leads.append({
            "name": name,
            "city": city,
            "type": venue_type,
            "party_size_estimate": estimate_party_size(venue_type),
            "instagram": ig,
            "email": item.get("email", "") or "",
            "phone": item.get("phone", "") or "",
            "gmaps_url": item.get("url", "") or "",
            "status": "cold",
            "tier": categorize_tier(item.get("followersCount")),
        })
    return leads


# ---------------------------------------------------------------- output


def write_csv(rows: Iterable[dict], path: str) -> int:
    rows = list(rows)[:MAX_LEADS]
    os.makedirs(os.path.dirname(os.path.abspath(path)) or ".", exist_ok=True)
    with open(path, "w", encoding="utf-8", newline="") as f:
        writer = csv.DictWriter(f, fieldnames=CSV_FIELDS)
        writer.writeheader()
        for row in rows:
            writer.writerow({k: row.get(k, "") for k in CSV_FIELDS})
    return len(rows)


# ---------------------------------------------------------------- main


def main() -> int:
    parser = argparse.ArgumentParser(description="Generador de leads outreach UnToque.")
    parser.add_argument("--mode", choices=["manual", "apify"], default="manual")
    parser.add_argument("--city", default="Buenos Aires")
    parser.add_argument("--limit", type=int, default=MAX_LEADS)
    parser.add_argument(
        "--output",
        default=f"outreach_leads_{date.today().isoformat()}.csv",
    )
    args = parser.parse_args()

    if args.limit > MAX_LEADS:
        print(f"[!] Limit {args.limit} > cap {MAX_LEADS}. Recorto a {MAX_LEADS}.", file=sys.stderr)
        args.limit = MAX_LEADS

    if args.mode == "manual":
        seed = os.getenv("OUTREACH_SEED_CSV", SEED_CSV)
        leads = run_manual(seed)
    else:
        leads = run_apify(args.city, args.limit)

    if not leads:
        print("[!] Sin leads. Revisá inputs.", file=sys.stderr)
        return 1

    n = write_csv(leads, args.output)
    print(f"[OK] {n} leads escritos en {args.output}")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())

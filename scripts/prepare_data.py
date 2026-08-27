#!/usr/bin/env python3
"""
scripts/prepare_data.py

Processes raw ARPAT radiocommunications data for:
  1. Opnet (ex-Linkem) BTS installations across Tuscany -> data/bts.json
  2. Eolo (ex-NGI) BTS installations across Tuscany -> data/bts_eolo.json
And extracts the official ISTAT Tuscany boundary GeoJSON in WGS84 (EPSG:4326) -> data/tuscany.geojson
"""

import json
import os
import re
import urllib.request

BASE_DIR = os.path.abspath(os.path.join(os.path.dirname(__file__), ".."))
DATA_DIR = os.path.join(BASE_DIR, "data")

RAW_BTS_PATH = os.path.join(BASE_DIR, "bts_data.json")
OUTPUT_BTS_PATH = os.path.join(DATA_DIR, "bts.json")

RAW_EOLO_PATH = os.path.join(BASE_DIR, "bts_data_eolo.json")
OUTPUT_EOLO_PATH = os.path.join(DATA_DIR, "bts_eolo.json")

OUTPUT_GEOJSON_PATH = os.path.join(DATA_DIR, "tuscany.geojson")
ISTAT_GEOJSON_URL = "https://raw.githubusercontent.com/openpolis/geojson-italy/master/geojson/limits_IT_regions.geojson"


def categorize_opnet_technology(tech_str):
    """Categorizes Opnet technology string into primary group and boolean capability flags."""
    if not tech_str or tech_str == "-":
        return {
            "primary": "other",
            "label": "Non specificato",
            "has5G": False,
            "has4G": False,
            "hasPonteRadio": False,
            "hasWimax": False,
            "hasWifi": False,
            "hasWireless": False
        }

    tech_lower = tech_str.lower()
    has_5g = "5g" in tech_lower
    has_4g = "4g" in tech_lower
    has_ponte_radio = "ponte radio" in tech_lower
    has_wimax = "wimax" in tech_lower
    has_wifi = "wi-fi" in tech_lower or "wifi" in tech_lower
    has_wireless = "wireless" in tech_lower or has_wimax or has_wifi

    if has_5g:
        primary = "5g"
    elif has_4g:
        primary = "4g"
    elif has_ponte_radio and not (has_wimax or has_wifi):
        primary = "ponte_radio"
    elif has_wimax:
        primary = "wimax"
    elif has_wifi:
        primary = "wifi"
    else:
        primary = "other"

    return {
        "primary": primary,
        "label": tech_str,
        "has5G": has_5g,
        "has4G": has_4g,
        "hasPonteRadio": has_ponte_radio,
        "hasWimax": has_wimax,
        "hasWifi": has_wifi,
        "hasWireless": has_wireless
    }


def categorize_eolo_technology(tech_str):
    """Categorizes Eolo technology string into primary group and boolean capability flags."""
    if not tech_str or tech_str == "-" or "non disponibile" in tech_str.lower():
        return {
            "primary": "other",
            "label": tech_str or "Non specificato",
            "has5G": False,
            "has4G": False,
            "hasPonteRadio": False,
            "hasWimax": False,
            "hasWifi": False,
            "hasWireless": False
        }

    tech_lower = tech_str.lower()
    has_5g = "5g" in tech_lower
    has_4g = "4g" in tech_lower
    has_ponte_radio = "ponte radio" in tech_lower
    has_wireless = "wireless" in tech_lower or "wi-fi" in tech_lower or "wifi" in tech_lower or "wimax" in tech_lower

    if has_5g:
        primary = "5g"
    elif has_wireless and has_ponte_radio:
        primary = "wireless_pr"
    elif has_ponte_radio and not has_wireless:
        primary = "ponte_radio"
    elif has_wireless and not has_ponte_radio:
        primary = "wireless"
    else:
        primary = "other"

    return {
        "primary": primary,
        "label": tech_str,
        "has5G": has_5g,
        "has4G": has_4g,
        "hasPonteRadio": has_ponte_radio,
        "hasWimax": False,
        "hasWifi": False,
        "hasWireless": has_wireless
    }


def extract_station_code(name):
    """Attempts to extract alphanumeric station code from name string."""
    if not name:
        return ""
    parts = name.split("-")
    if len(parts) > 1:
        code_candidate = parts[-1].strip()
        match = re.search(r"([A-Za-z0-9_]{3,12})", code_candidate)
        if match:
            return match.group(1)
        return code_candidate
    return ""


def process_bts_data():
    """Reads raw Opnet BTS JSON, validates coords, and saves data/bts.json."""
    if not os.path.exists(RAW_BTS_PATH):
        print(f"[ERROR] Raw Opnet BTS file not found at: {RAW_BTS_PATH}")
        return []

    with open(RAW_BTS_PATH, "r", encoding="utf-8") as f:
        raw_data = json.load(f)

    print(f"[INFO] Processing Opnet data: {len(raw_data)} raw records...")

    normalized = []
    skipped = 0

    for idx, item in enumerate(raw_data, 1):
        gestore = item.get("Gestore", "").strip()
        if gestore and not any(op in gestore.lower() for op in ["opnet", "linkem"]):
            skipped += 1
            continue

        lat = item.get("Latitudine")
        lng = item.get("Longitudine")

        if lat is None or lng is None:
            skipped += 1
            continue

        try:
            lat = float(lat)
            lng = float(lng)
        except (ValueError, TypeError):
            skipped += 1
            continue

        if not (42.0 <= lat <= 44.8 and 9.4 <= lng <= 12.6):
            print(f"[WARN] Opnet record #{idx} outside bounds: lat={lat}, lng={lng}")

        name = item.get("Nome", f"Opnet-BTS-{idx}").strip()
        provincia = item.get("Provincia", "").strip().upper()
        comune = item.get("Comune", "").strip()
        indirizzo = item.get("Indirizzo", "").strip()
        raw_tech = item.get("Tecnologia", "").strip()
        riferimento = item.get("Riferimento", "").strip()
        tipologia = item.get("Tipologia", "").strip()

        tech_info = categorize_opnet_technology(raw_tech)
        code = extract_station_code(name)

        record = {
            "id": f"opnet-{idx:04d}",
            "name": name,
            "code": code,
            "operator": "Opnet",
            "operatorGroup": "opnet",
            "province": provincia,
            "comune": comune,
            "address": indirizzo,
            "lat": round(lat, 6),
            "lng": round(lng, 6),
            "technology": raw_tech,
            "techCategory": tech_info["primary"],
            "has5G": tech_info["has5G"],
            "has4G": tech_info["has4G"],
            "hasPonteRadio": tech_info["hasPonteRadio"],
            "hasWireless": tech_info["hasWireless"],
            "hasWimax": tech_info["hasWimax"],
            "hasWifi": tech_info["hasWifi"],
            "reference": riferimento,
            "tipologia": tipologia if tipologia != "-" else None,
            "raw": item
        }
        normalized.append(record)

    os.makedirs(DATA_DIR, exist_ok=True)
    with open(OUTPUT_BTS_PATH, "w", encoding="utf-8") as f:
        json.dump(normalized, f, ensure_ascii=False, indent=2)

    print(f"[SUCCESS] Saved {len(normalized)} Opnet BTS records to: {OUTPUT_BTS_PATH}")
    return normalized


def process_eolo_data():
    """Reads raw Eolo BTS JSON, validates coords, and saves data/bts_eolo.json."""
    if not os.path.exists(RAW_EOLO_PATH):
        print(f"[WARN] Raw Eolo BTS file not found at: {RAW_EOLO_PATH}")
        return []

    with open(RAW_EOLO_PATH, "r", encoding="utf-8") as f:
        raw_data = json.load(f)

    print(f"[INFO] Processing Eolo data: {len(raw_data)} raw records...")

    normalized = []
    skipped = 0

    for idx, item in enumerate(raw_data, 1):
        gestore = item.get("Gestore", "").strip()
        # Filter for EOLO / NGI
        if gestore and not any(op in gestore.lower() for op in ["eolo", "ngi"]):
            skipped += 1
            continue

        lat = item.get("Latitudine")
        lng = item.get("Longitudine")

        if lat is None or lng is None:
            skipped += 1
            continue

        try:
            lat = float(lat)
            lng = float(lng)
        except (ValueError, TypeError):
            skipped += 1
            continue

        if not (42.0 <= lat <= 44.8 and 9.4 <= lng <= 12.6):
            print(f"[WARN] Eolo record #{idx} outside bounds: lat={lat}, lng={lng}")

        name = item.get("Nome", f"Eolo-BTS-{idx}").strip()
        provincia = item.get("Provincia", "").strip().upper()
        comune = item.get("Comune", "").strip()
        indirizzo = item.get("Indirizzo", "").strip()
        raw_tech = item.get("Tecnologia", "").strip()
        riferimento = item.get("Riferimento", "").strip()
        tipologia = item.get("Tipologia", "").strip()

        tech_info = categorize_eolo_technology(raw_tech)
        code = extract_station_code(name)

        record = {
            "id": f"eolo-{idx:04d}",
            "name": name,
            "code": code,
            "operator": "Eolo",
            "operatorGroup": "eolo",
            "province": provincia,
            "comune": comune,
            "address": indirizzo,
            "lat": round(lat, 6),
            "lng": round(lng, 6),
            "technology": raw_tech,
            "techCategory": tech_info["primary"],
            "has5G": tech_info["has5G"],
            "has4G": tech_info["has4G"],
            "hasPonteRadio": tech_info["hasPonteRadio"],
            "hasWireless": tech_info["hasWireless"],
            "hasWimax": False,
            "hasWifi": False,
            "reference": riferimento,
            "tipologia": tipologia if tipologia != "-" else None,
            "raw": item
        }
        normalized.append(record)

    os.makedirs(DATA_DIR, exist_ok=True)
    with open(OUTPUT_EOLO_PATH, "w", encoding="utf-8") as f:
        json.dump(normalized, f, ensure_ascii=False, indent=2)

    print(f"[SUCCESS] Saved {len(normalized)} Eolo BTS records to: {OUTPUT_EOLO_PATH}")
    return normalized


def fetch_tuscany_boundary():
    """Ensures official ISTAT regional boundary GeoJSON is present in WGS84."""
    if os.path.exists(OUTPUT_GEOJSON_PATH):
        print(f"[INFO] Tuscany boundary already present at: {OUTPUT_GEOJSON_PATH}")
        return

    print(f"[INFO] Fetching Tuscany boundary from ISTAT / OpenPolis repository...")
    try:
        req = urllib.request.Request(
            ISTAT_GEOJSON_URL,
            headers={"User-Agent": "Tuscany-BTS-Map-Builder/1.0"}
        )
        with urllib.request.urlopen(req, timeout=15) as resp:
            data = json.loads(resp.read().decode("utf-8"))

        toscana_feature = None
        for f in data.get("features", []):
            reg_name = f.get("properties", {}).get("reg_name", "")
            if "Toscana" in reg_name:
                toscana_feature = f
                break

        if not toscana_feature:
            raise ValueError("Toscana feature not found in GeoJSON")

        toscana_geojson = {
            "type": "FeatureCollection",
            "name": "Regione_Toscana_Confine_WGS84",
            "crs": {
                "type": "name",
                "properties": {
                    "name": "urn:ogc:def:crs:OGC:1.3:CRS84"
                }
            },
            "source": "ISTAT - Basi Territoriali / OpenPolis (EPSG:4326)",
            "features": [toscana_feature]
        }

        os.makedirs(DATA_DIR, exist_ok=True)
        with open(OUTPUT_GEOJSON_PATH, "w", encoding="utf-8") as f:
            json.dump(toscana_geojson, f, ensure_ascii=False)

        print(f"[SUCCESS] Tuscany boundary saved to: {OUTPUT_GEOJSON_PATH}")

    except Exception as e:
        print(f"[WARN] Failed to fetch boundary online: {e}")


if __name__ == "__main__":
    print("=== Tuscany BTS Map Data Preparation ===")
    process_bts_data()
    process_eolo_data()
    fetch_tuscany_boundary()
    print("=== Data preparation complete ===")

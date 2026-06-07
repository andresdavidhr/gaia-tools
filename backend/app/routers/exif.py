from io import BytesIO

from fastapi import APIRouter, File, HTTPException, UploadFile
from PIL import ExifTags, Image

router = APIRouter()

CAMERA_TAGS = {"Make", "Model", "Software", "ExifVersion", "ISOSpeedRatings",
               "FNumber", "ExposureTime", "FocalLength", "Flash", "WhiteBalance",
               "MeteringMode", "ExposureMode", "ExposureProgram"}
DATE_TAGS   = {"DateTime", "DateTimeOriginal", "DateTimeDigitized"}


def _gps_decimal(coord, ref):
    try:
        d, m, s = (float(x.numerator) / float(x.denominator) if hasattr(x, "numerator") else float(x) for x in coord)
        val = d + m / 60 + s / 3600
        if ref in ("S", "W"):
            val = -val
        return round(val, 6)
    except Exception:
        return None


def _safe_str(val):
    if isinstance(val, bytes):
        return val.decode(errors="replace")
    if hasattr(val, "numerator"):
        return str(round(float(val.numerator) / float(val.denominator), 4))
    return str(val)


@router.post("/")
async def extract(file: UploadFile = File(...)):
    data = await file.read()
    try:
        img = Image.open(BytesIO(data))
    except Exception:
        raise HTTPException(422, "Cannot open image.")

    image_info = {
        "Width": img.width,
        "Height": img.height,
        "Format": img.format or "unknown",
        "Mode": img.mode,
    }

    try:
        raw = img._getexif() or {} if hasattr(img, "_getexif") else {}
    except Exception:
        raw = {}

    tags = {ExifTags.TAGS.get(k, str(k)): v for k, v in raw.items()}

    camera, date, gps = {}, {}, {}
    for name, val in tags.items():
        if name in CAMERA_TAGS:
            camera[name] = _safe_str(val)
        elif name in DATE_TAGS:
            date[name] = _safe_str(val)

    try:
        raw_gps = tags.get("GPSInfo", {})
        if isinstance(raw_gps, dict):
            gps_named = {ExifTags.GPSTAGS.get(k, k): v for k, v in raw_gps.items()}
            lat = _gps_decimal(gps_named.get("GPSLatitude", ()), gps_named.get("GPSLatitudeRef", ""))
            lon = _gps_decimal(gps_named.get("GPSLongitude", ()), gps_named.get("GPSLongitudeRef", ""))
            if lat is not None:
                gps["Latitude"] = lat
            if lon is not None:
                gps["Longitude"] = lon
            if "GPSAltitude" in gps_named:
                a = gps_named["GPSAltitude"]
                gps["Altitude"] = round(float(a.numerator) / float(a.denominator), 2) if hasattr(a, "numerator") else float(a)
    except Exception:
        pass

    return {"Image": image_info, "Camera": camera, "GPS": gps, "Date": date}

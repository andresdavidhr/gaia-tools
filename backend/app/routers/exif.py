from io import BytesIO

from fastapi import APIRouter, File, UploadFile
from PIL import ExifTags, Image

router = APIRouter()

CAMERA_TAGS = {"Make", "Model", "Software", "ExifVersion", "ISOSpeedRatings",
               "FNumber", "ExposureTime", "FocalLength", "Flash", "WhiteBalance",
               "MeteringMode", "ExposureMode", "ExposureProgram"}
DATE_TAGS   = {"DateTime", "DateTimeOriginal", "DateTimeDigitized"}
GPS_TAGS    = {"GPSLatitude", "GPSLongitude", "GPSAltitude",
               "GPSLatitudeRef", "GPSLongitudeRef", "GPSAltitudeRef", "GPSImgDirection"}

REVERSED = {v: k for k, v in ExifTags.TAGS.items()}


def _gps_decimal(coord, ref):
    try:
        d, m, s = (float(x.numerator) / float(x.denominator) if hasattr(x, "numerator") else float(x) for x in coord)
        val = d + m / 60 + s / 3600
        if ref in ("S", "W"):
            val = -val
        return round(val, 6)
    except Exception:
        return None


@router.post("/")
async def extract(file: UploadFile = File(...)):
    data = await file.read()
    img = Image.open(BytesIO(data))

    image_info = {
        "Width": img.width,
        "Height": img.height,
        "Format": img.format or "unknown",
        "Mode": img.mode,
    }

    raw = img._getexif() or {}
    tags = {ExifTags.TAGS.get(k, k): v for k, v in raw.items()}

    camera, date, gps = {}, {}, {}
    for name, val in tags.items():
        if name in CAMERA_TAGS:
            if hasattr(val, "numerator"):
                val = round(float(val.numerator) / float(val.denominator), 4)
            camera[name] = str(val)
        elif name in DATE_TAGS:
            date[name] = str(val)

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

    return {"Image": image_info, "Camera": camera, "GPS": gps, "Date": date}

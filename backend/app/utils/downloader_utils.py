import os
import re
import tempfile
import yt_dlp


def get_video_info(url: str) -> dict:
    opts = {"quiet": True, "skip_download": True, "no_warnings": True}
    with yt_dlp.YoutubeDL(opts) as ydl:
        meta = ydl.extract_info(url, download=False)
    return {"title": meta.get("title", ""), "duration": meta.get("duration")}


def download_video(url: str, fmt: str, quality: str = "best", custom_filename: str = "") -> tuple[str, str]:
    tmp_dir = tempfile.mkdtemp()

    if custom_filename.strip():
        safe = re.sub(r"[^\w\s\-]", "", custom_filename).strip()
        out_template = os.path.join(tmp_dir, f"{safe}.%(ext)s")
    else:
        out_template = os.path.join(tmp_dir, "%(title)s.%(ext)s")

    if fmt == "mp3":
        bitrate = quality if quality in ("128", "192", "320") else "192"
        ydl_opts = {
            "format": "bestaudio/best",
            "outtmpl": out_template,
            "postprocessors": [{"key": "FFmpegExtractAudio", "preferredcodec": "mp3", "preferredquality": bitrate}],
            "prefer_ffmpeg": True,
            "quiet": True,
        }
    else:
        fmt_map = {
            "720": "bestvideo[height<=720]+bestaudio/best",
            "1080": "bestvideo[height<=1080]+bestaudio/best",
        }
        ydl_opts = {
            "format": fmt_map.get(quality, "bestvideo+bestaudio/best"),
            "outtmpl": out_template,
            "merge_output_format": "mp4",
            "prefer_ffmpeg": True,
            "quiet": True,
        }

    with yt_dlp.YoutubeDL(ydl_opts) as ydl:
        ydl.download([url])

    files = os.listdir(tmp_dir)
    if not files:
        raise RuntimeError("No se generó ningún archivo tras la descarga.")

    actual_path = os.path.join(tmp_dir, files[0])
    return actual_path, files[0]

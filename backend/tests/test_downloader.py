import pytest
from unittest.mock import patch, MagicMock


def test_download_invalid_format(client):
    r = client.post("/api/downloader/download", json={"url": "https://youtu.be/test", "format": "wav"})
    assert r.status_code == 400


def test_download_missing_url(client):
    r = client.post("/api/downloader/download", json={"format": "mp3"})
    assert r.status_code == 422


@patch("app.utils.downloader_utils.yt_dlp.YoutubeDL")
def test_download_mp3_calls_ytdlp(mock_ydl, client, tmp_path):
    fake_file = tmp_path / "song.mp3"
    fake_file.write_bytes(b"fake audio")

    instance = mock_ydl.return_value.__enter__.return_value
    instance.download.return_value = None

    with patch("app.utils.downloader_utils.tempfile.mkdtemp", return_value=str(tmp_path)), \
         patch("os.listdir", return_value=["song.mp3"]):
        r = client.post("/api/downloader/download", json={"url": "https://youtu.be/TYlSh0vGLow", "format": "mp3"})

    assert instance.download.called


def test_download_filename_returned(client, tmp_path):
    fake_file = tmp_path / "My Video.mp3"
    fake_file.write_bytes(b"fake audio")

    with patch("app.routers.downloader.download_video", return_value=(str(fake_file), "My Video.mp3")):
        r = client.post("/api/downloader/download", json={"url": "https://youtu.be/TYlSh0vGLow", "format": "mp3"})

    assert r.status_code == 200
    cd = r.headers["content-disposition"]
    assert "My" in cd and ".mp3" in cd


def test_custom_filename_in_disposition(client, tmp_path):
    fake_file = tmp_path / "mi-cancion.mp3"
    fake_file.write_bytes(b"fake audio")

    with patch("app.routers.downloader.download_video", return_value=(str(fake_file), "mi-cancion.mp3")):
        r = client.post("/api/downloader/download", json={
            "url": "https://youtu.be/TYlSh0vGLow", "format": "mp3", "custom_filename": "mi-cancion"
        })

    assert r.status_code == 200
    assert "mi-cancion.mp3" in r.headers["content-disposition"]


@patch("app.utils.downloader_utils.yt_dlp.YoutubeDL")
def test_quality_mp3_128(mock_ydl, client, tmp_path):
    fake_file = tmp_path / "song.mp3"
    fake_file.write_bytes(b"fake audio")

    instance = mock_ydl.return_value.__enter__.return_value
    instance.download.return_value = None

    with patch("app.utils.downloader_utils.tempfile.mkdtemp", return_value=str(tmp_path)), \
         patch("os.listdir", return_value=["song.mp3"]):
        client.post("/api/downloader/download", json={"url": "https://youtu.be/test", "format": "mp3", "quality": "128"})

    call_kwargs = mock_ydl.call_args[0][0]
    assert call_kwargs["postprocessors"][0]["preferredquality"] == "128"


@patch("app.utils.downloader_utils.yt_dlp.YoutubeDL")
def test_quality_mp4_720(mock_ydl, client, tmp_path):
    fake_file = tmp_path / "video.mp4"
    fake_file.write_bytes(b"fake video")

    instance = mock_ydl.return_value.__enter__.return_value
    instance.download.return_value = None

    with patch("app.utils.downloader_utils.tempfile.mkdtemp", return_value=str(tmp_path)), \
         patch("os.listdir", return_value=["video.mp4"]):
        client.post("/api/downloader/download", json={"url": "https://youtu.be/test", "format": "mp4", "quality": "720"})

    call_kwargs = mock_ydl.call_args[0][0]
    assert "height<=720" in call_kwargs["format"]


@patch("app.utils.downloader_utils.yt_dlp.YoutubeDL")
def test_download_propagates_error(mock_ydl, client):
    mock_ydl.return_value.__enter__.return_value.download.side_effect = Exception("vídeo privado")
    r = client.post("/api/downloader/download", json={"url": "https://youtu.be/test", "format": "mp3"})
    assert r.status_code == 500
    assert "vídeo privado" in r.json()["detail"]


def test_info_endpoint_error(client):
    with patch("app.routers.downloader.get_video_info", side_effect=Exception("URL inválida")):
        r = client.get("/api/downloader/info", params={"url": "not-a-url"})
    assert r.status_code == 400
    assert "URL inválida" in r.json()["detail"]


def test_info_endpoint_ok(client):
    with patch("app.routers.downloader.get_video_info", return_value={"title": "Test Video", "duration": 120}):
        r = client.get("/api/downloader/info", params={"url": "https://youtu.be/test"})
    assert r.status_code == 200
    assert r.json()["title"] == "Test Video"


def test_download_removes_temp_dir(client, tmp_path):
    """El mkdtemp de yt-dlp se acumulaba en el volumen /tmp del contenedor."""
    work_dir = tmp_path / "dl"
    work_dir.mkdir()
    fake_file = work_dir / "song.mp3"
    fake_file.write_bytes(b"fake audio")

    with patch("app.routers.downloader.download_video", return_value=(str(fake_file), "song.mp3")):
        r = client.post("/api/downloader/download", json={"url": "https://youtu.be/test", "format": "mp3"})

    assert r.status_code == 200
    assert not work_dir.exists()


@pytest.mark.integration
def test_download_real_mp3(client):
    """Descarga real de Baby Shark como MP3. Requiere red y ffmpeg."""
    url = "https://www.youtube.com/watch?v=XqZsoesa55w"
    r = client.post("/api/downloader/download", json={"url": url, "format": "mp3"}, timeout=120)
    assert r.status_code == 200
    assert r.headers["content-type"] == "audio/mpeg"
    assert int(r.headers.get("content-length", 0)) > 0

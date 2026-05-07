import tempfile
import qrcode
from qrcode.image.pil import PilImage

SIZE_MAP = {"S": 5, "M": 10, "L": 15}


def generate_qr(text: str, size: str = "M") -> str:
    box_size = SIZE_MAP.get(size.upper(), 10)
    qr = qrcode.QRCode(box_size=box_size, border=4)
    qr.add_data(text)
    qr.make(fit=True)
    img: PilImage = qr.make_image(fill_color="black", back_color="white")
    tmp = tempfile.NamedTemporaryFile(suffix=".png", delete=False)
    img.save(tmp.name)
    return tmp.name

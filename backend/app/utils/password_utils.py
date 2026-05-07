import secrets
import string


def generate_password(length: int, symbols: bool, numbers: bool) -> str:
    alphabet = string.ascii_letters
    if numbers:
        alphabet += string.digits
    if symbols:
        alphabet += string.punctuation

    while True:
        password = "".join(secrets.choice(alphabet) for _ in range(length))
        has_upper = any(c.isupper() for c in password)
        has_lower = any(c.islower() for c in password)
        has_digit = not numbers or any(c.isdigit() for c in password)
        has_symbol = not symbols or any(c in string.punctuation for c in password)
        if has_upper and has_lower and has_digit and has_symbol:
            return password

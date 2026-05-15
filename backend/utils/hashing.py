import hashlib
import hmac
import os


def generate_anon_id(fingerprint):
    salt = os.environ.get("ANON_SALT", "pragna-vistara-local-anon-salt")
    return hashlib.sha256((fingerprint + salt).encode("utf-8")).hexdigest()


def generate_audit_signature(payload):
    return hmac.new(
        os.environ["ENCLAVE_KEY"].encode("utf-8"),
        payload.encode("utf-8"),
        hashlib.sha256,
    ).hexdigest()

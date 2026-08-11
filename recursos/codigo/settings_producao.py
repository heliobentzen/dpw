"""
Referência de configuração segura para produção — apoio dos M11 e M14.

NÃO copie este arquivo inteiro para o seu projeto. Use-o como lista de
verificação: cada bloco explica o que a configuração previne. Copie apenas o
que se aplica ao seu caso e entenda cada linha antes de colar.

Verifique sempre com:
    DEBUG=False python manage.py check --deploy
"""

import os
from pathlib import Path

import dj_database_url
from dotenv import load_dotenv

BASE_DIR = Path(__file__).resolve().parent.parent
load_dotenv(BASE_DIR / ".env")

# ---------------------------------------------------------------------------
# Núcleo
# ---------------------------------------------------------------------------

# Falha alto e cedo: melhor quebrar no boot do que rodar com chave insegura.
SECRET_KEY = os.environ["SECRET_KEY"]

# "False" (string) é verdadeiro em Python — daí a comparação explícita.
DEBUG = os.getenv("DEBUG", "False") == "True"

# Nunca ["*"]: aceita qualquer Host e habilita envenenamento de cache/links.
ALLOWED_HOSTS = [h.strip() for h in os.getenv("ALLOWED_HOSTS", "").split(",") if h.strip()]

# ---------------------------------------------------------------------------
# Banco de dados
# ---------------------------------------------------------------------------

DATABASES = {
    "default": dj_database_url.config(
        default=f"sqlite:///{BASE_DIR / 'db.sqlite3'}",
        conn_max_age=600,          # reaproveita conexões (menos latência)
        conn_health_checks=True,   # descarta conexões mortas
        ssl_require=not DEBUG,     # exige TLS até o banco em produção
    )
}

# ---------------------------------------------------------------------------
# Senhas
# ---------------------------------------------------------------------------

# Argon2 é o algoritmo recomendado atualmente. Requer: pip install "django[argon2]"
PASSWORD_HASHERS = [
    "django.contrib.auth.hashers.Argon2PasswordHasher",
    "django.contrib.auth.hashers.PBKDF2PasswordHasher",
    "django.contrib.auth.hashers.PBKDF2SHA1PasswordHasher",
]

AUTH_PASSWORD_VALIDATORS = [
    {"NAME": "django.contrib.auth.password_validation.UserAttributeSimilarityValidator"},
    {
        "NAME": "django.contrib.auth.password_validation.MinimumLengthValidator",
        "OPTIONS": {"min_length": 12},
    },
    {"NAME": "django.contrib.auth.password_validation.CommonPasswordValidator"},
    {"NAME": "django.contrib.auth.password_validation.NumericPasswordValidator"},
]

# ---------------------------------------------------------------------------
# Arquivos estáticos e de mídia
# ---------------------------------------------------------------------------

STATIC_URL = "/static/"
STATIC_ROOT = BASE_DIR / "staticfiles"       # destino do collectstatic
STATICFILES_DIRS = [BASE_DIR / "static"]     # estáticos do projeto

MEDIA_URL = "/media/"
MEDIA_ROOT = BASE_DIR / "media"

STORAGES = {
    "default": {"BACKEND": "django.core.files.storage.FileSystemStorage"},
    # Comprime e adiciona hash ao nome do arquivo: cache eterno + invalidação
    # automática a cada deploy.
    "staticfiles": {"BACKEND": "whitenoise.storage.CompressedManifestStaticFilesStorage"},
}

# ---------------------------------------------------------------------------
# Sessão e CSRF
# ---------------------------------------------------------------------------

SESSION_COOKIE_HTTPONLY = True     # JavaScript não lê o cookie (mitiga roubo via XSS)
SESSION_COOKIE_SAMESITE = "Lax"    # não é enviado por sites terceiros (mitiga CSRF)
SESSION_COOKIE_AGE = 60 * 60 * 8   # 8 horas
CSRF_COOKIE_SAMESITE = "Lax"

# ---------------------------------------------------------------------------
# Endurecimento — só em produção
# ---------------------------------------------------------------------------

if not DEBUG:
    # Redireciona HTTP -> HTTPS. Atrás de proxy, é o cabeçalho abaixo que informa
    # o esquema original; sem ele, o redirecionamento vira laço infinito.
    SECURE_SSL_REDIRECT = True
    SECURE_PROXY_SSL_HEADER = ("HTTP_X_FORWARDED_PROTO", "https")

    # HSTS: o navegador passa a exigir HTTPS por conta própria.
    # Ative SOMENTE depois de confirmar que o HTTPS funciona — é difícil reverter.
    SECURE_HSTS_SECONDS = 31_536_000          # 1 ano
    SECURE_HSTS_INCLUDE_SUBDOMAINS = True
    SECURE_HSTS_PRELOAD = True

    # Cookies só por HTTPS.
    SESSION_COOKIE_SECURE = True
    CSRF_COOKIE_SECURE = True

    # Impede o navegador de "adivinhar" o tipo do conteúdo (defesa contra
    # upload disfarçado sendo interpretado como script).
    SECURE_CONTENT_TYPE_NOSNIFF = True

    # Impede que o site seja embutido em iframe (clickjacking).
    X_FRAME_OPTIONS = "DENY"

    # Não vaza a URL de origem para sites externos.
    SECURE_REFERRER_POLICY = "same-origin"

    # Origens confiáveis para POST (necessário quando há domínio próprio).
    CSRF_TRUSTED_ORIGINS = [f"https://{h}" for h in ALLOWED_HOSTS]

# ---------------------------------------------------------------------------
# Content Security Policy — requer: pip install django-csp
# ---------------------------------------------------------------------------

# Evite 'unsafe-inline'. Se precisar de script inline, use nonce ou mova para
# arquivo estático.
CONTENT_SECURITY_POLICY = {
    "DIRECTIVES": {
        "default-src": ["'self'"],
        "script-src": ["'self'"],
        "style-src": ["'self'"],
        "img-src": ["'self'", "data:"],
        "font-src": ["'self'"],
        "connect-src": ["'self'"],
        "frame-ancestors": ["'none'"],
        "base-uri": ["'self'"],
        "form-action": ["'self'"],
    }
}

# ---------------------------------------------------------------------------
# Logs — para stdout (fator XI do 12-factor), nunca para arquivo
# ---------------------------------------------------------------------------

LOGGING = {
    "version": 1,
    "disable_existing_loggers": False,
    "formatters": {
        "verboso": {"format": "{asctime} {levelname} {name} {message}", "style": "{"},
    },
    "handlers": {
        "console": {"class": "logging.StreamHandler", "formatter": "verboso"},
    },
    "root": {"handlers": ["console"], "level": "INFO"},
    "loggers": {
        "django.request": {"handlers": ["console"], "level": "ERROR", "propagate": False},
        "django.security": {"handlers": ["console"], "level": "WARNING", "propagate": False},
    },
}

# ---------------------------------------------------------------------------
# E-mail
# ---------------------------------------------------------------------------

if DEBUG:
    EMAIL_BACKEND = "django.core.mail.backends.console.EmailBackend"
else:
    EMAIL_BACKEND = "django.core.mail.backends.smtp.EmailBackend"
    EMAIL_HOST = os.getenv("EMAIL_HOST", "")
    EMAIL_PORT = int(os.getenv("EMAIL_PORT", "587"))
    EMAIL_USE_TLS = True
    EMAIL_HOST_USER = os.getenv("EMAIL_HOST_USER", "")
    EMAIL_HOST_PASSWORD = os.getenv("EMAIL_HOST_PASSWORD", "")

DEFAULT_FROM_EMAIL = os.getenv("DEFAULT_FROM_EMAIL", "nao-responda@exemplo.org")

# ---------------------------------------------------------------------------
# Monitoramento de erros — requer: pip install "sentry-sdk[django]"
# ---------------------------------------------------------------------------

if not DEBUG and os.getenv("SENTRY_DSN"):
    import sentry_sdk

    sentry_sdk.init(
        dsn=os.environ["SENTRY_DSN"],
        traces_sample_rate=0.1,
        # NUNCA envie dados pessoais para um serviço externo sem base legal.
        send_default_pii=False,
    )

# ---------------------------------------------------------------------------
# Localização
# ---------------------------------------------------------------------------

LANGUAGE_CODE = "pt-br"
TIME_ZONE = "America/Sao_Paulo"
USE_I18N = True
USE_TZ = True    # armazena em UTC, exibe no fuso local

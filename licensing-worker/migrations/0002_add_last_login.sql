-- Último login de la cuenta titular, marcado por el backend .NET en cada inicio de sesión.
ALTER TABLE licenses ADD COLUMN last_login TEXT;

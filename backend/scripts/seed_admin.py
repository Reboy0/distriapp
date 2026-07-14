"""Bootstrap the first platform admin. There is no self-registration for
admins by design (AUTH-1 says the admin onboards distributors, not the other
way around) so this one-off script is the only way to create the first
account. Usage: python -m scripts.seed_admin <email> <password>
"""
import asyncio
import sys

from sqlalchemy import select

from app.core.security import hash_password
from app.db.session import async_session_factory
from app.models.admin_user import AdminUser


async def main(email: str, password: str) -> None:
    async with async_session_factory() as db:
        result = await db.execute(select(AdminUser).where(AdminUser.email == email))
        if result.scalar_one_or_none() is not None:
            print(f"Admin {email} already exists")
            return
        db.add(AdminUser(email=email, password_hash=hash_password(password)))
        await db.commit()
        print(f"Created admin {email}")


if __name__ == "__main__":
    asyncio.run(main(sys.argv[1], sys.argv[2]))

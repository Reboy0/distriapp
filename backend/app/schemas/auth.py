from pydantic import BaseModel


class TokenResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"


class AdminLoginRequest(BaseModel):
    email: str
    password: str


class DistributorLoginRequest(BaseModel):
    email: str
    password: str


class ClientLoginRequest(BaseModel):
    phone: str
    password: str


class ClientRegisterRequest(BaseModel):
    invitation_code: str
    name: str
    phone: str
    password: str

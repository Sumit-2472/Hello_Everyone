from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel

app = FastAPI()

# 1. CORS: The bridge that prevents browser security blocks
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000"], 
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# 2. Schema: The "Contract" for incoming data
class LoginRequest(BaseModel):
    email: str
    password: str

@app.post("/login")
async def login(request: LoginRequest):
    # Mock authentication logic
    if request.email == "user@example.com" and request.password == "password123":
        return {"status": "success", "message": "Login successful"}
    else:
        raise HTTPException(status_code=401, detail="Invalid credentials")
@app.post("/register")
async def register(user: RegisterRequest):
    try:
        # Your existing database or registration logic goes here
        return {"message": "User registered successfully"}
    except Exception as e:
        # This catches the error and prints it to your terminal 
        # so you can see exactly what is breaking
        print(f"CRITICAL ERROR: {e}") 
        raise HTTPException(status_code=500, detail=str(e))
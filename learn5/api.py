from fastapi import FastAPI

app = FastAPI()


@app.get("/")
def home():
    return {"message": "AURA is running"}


@app.get("/health")
def health():
    return {"status": "healthy"}


@app.get("/company/{name}")
def get_company(name: str):
    return {
        "company": name,
        "status": "assessment ready"
    }

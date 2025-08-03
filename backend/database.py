from motor.motor_asyncio import AsyncIOMotorClient
from pymongo.server_api import ServerApi
import os
from dotenv import load_dotenv

load_dotenv()

client = None
database = None

async def connect_to_mongo():
    global client, database
    try:
        client = AsyncIOMotorClient(
            os.getenv("MONGODB_URI"),
            server_api=ServerApi('1')
        )
        database = client.kiraai
        print("Connected to MongoDB")
    except Exception as e:
        print(f"Error connecting to MongoDB: {e}")

async def close_mongo_connection():
    global client
    if client:
        client.close()

def get_database():
    return database
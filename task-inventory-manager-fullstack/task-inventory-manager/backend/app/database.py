from motor.motor_asyncio import AsyncIOMotorClient
from app.config import settings

client: AsyncIOMotorClient = None
db = None


async def connect_to_mongo():
    global client, db
    client = AsyncIOMotorClient(settings.MONGO_URI)
    db = client[settings.MONGO_DB_NAME]

    # Indexes for performance & uniqueness constraints
    await db.users.create_index("email", unique=True)
    await db.tasks.create_index("owner_id")
    await db.inventory.create_index("sku", unique=True)
    print(f"Connected to MongoDB database: {settings.MONGO_DB_NAME}")


async def close_mongo_connection():
    global client
    if client:
        client.close()
        print("MongoDB connection closed")


def get_db():
    return db

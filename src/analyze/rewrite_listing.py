import sys
import os
from openai import AsyncOpenAI
import time
import pandas as pd
import os
import json
import asyncio
from dotenv import load_dotenv

load_dotenv()
# Load environment variables from .env file
openai_api_key = os.getenv('OPENAI_API_KEY')
if not openai_api_key:
    raise ValueError("OPENAI_API_KEY not found in environment variables. Please check your .env file.")

async def rewrite_listing(listing_text: str) -> str:

    async with AsyncOpenAI(api_key=openai_api_key) as client:
        response = await client.chat.completions.create(
            model="gpt-4o-mini",
            messages=[
                {"role": "system", "content": 
                 """You are a helpful assistant that rewrites ecommerce listing titles to be optimized for search engines and click through rate.
                    The listing should be include the most important keywords for ecommerce shoppers and search engines.
                    The listing should be brief to accomodate mobile shoppers, under 40 characters.
                    """},

                {"role": "user", "content": f"Rewrite the following eBay listing: {listing_text}"}
            ]
        )
        return response.choices[0].message.content


if __name__ == "__main__":
    # Test the function
    listing_text = "AMERICAN EAGLE Stretch Jean Jeggings"
    rewritten_listing = asyncio.run(rewrite_listing(listing_text))
    print(rewritten_listing)

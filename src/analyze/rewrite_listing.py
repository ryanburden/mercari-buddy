import sys
import os
from openai import AsyncOpenAI
import time
import pandas as pd
import os
import json
import asyncio
from dotenv import load_dotenv
from enum import Enum
from typing import Literal

load_dotenv()
# Load environment variables from .env file
openai_api_key = os.getenv('OPENAI_API_KEY')
if not openai_api_key:
    raise ValueError("OPENAI_API_KEY not found in environment variables. Please check your .env file.")

ListingType = Literal["title", "description"]

TITLE_PROMPT = """You are an expert e-commerce listing optimizer with deep knowledge of SEO, marketplace algorithms, and buyer psychology. Your task is to rewrite product titles to maximize visibility and conversion rates.

Follow these key principles:
1. SEO Optimization:
   - Front-load the most important keywords
   - Include high-volume search terms for the product category
   - Use proper spelling and avoid unnecessary abbreviations
   - Maintain keyword density without keyword stuffing

2. Conversion Rate Optimization:
   - Highlight key value propositions (e.g., "Genuine Leather", "Limited Edition")
   - Include important specifications (size, color, condition if relevant)
   - Use power words that drive sales (e.g., "Premium", "Professional", "Authentic")
   - Remove unnecessary filler words and symbols

3. Mobile-First Format:
   - Keep titles under 40 characters for mobile visibility
   - Use clear, scannable format
   - Prioritize information hierarchy

4. Marketplace Best Practices:
   - Follow standard capitalization (Title Case for key terms)
   - Include brand names when relevant
   - Specify model/style numbers if applicable
   - Remove promotional phrases that may violate marketplace policies

Output only the optimized title text, with no explanations or additional commentary."""

DESCRIPTION_PROMPT = """You are an expert e-commerce listing optimizer with deep knowledge of SEO, marketplace algorithms, and buyer psychology. Your task is to rewrite product descriptions to maximize visibility and conversion rates.

Follow these key principles:
1. SEO and Readability:
   - Start with a compelling opening sentence that includes primary keywords
   - Use short paragraphs (2-3 sentences) for easy scanning
   - Include bullet points for key features and specifications
   - Incorporate relevant long-tail keywords naturally
   - Maintain proper grammar and spelling

2. Conversion Optimization:
   - Address common customer pain points and questions
   - Highlight unique selling propositions and benefits
   - Include specific measurements, materials, and care instructions
   - Use sensory and descriptive language to help buyers visualize the product
   - Add social proof elements if present in original description

3. Trust and Credibility:
   - Mention quality indicators (materials, craftsmanship, brand reputation)
   - Include warranty or guarantee information if applicable
   - Be transparent about any imperfections or limitations
   - Use professional, confident tone

4. Mobile and Marketplace Optimization:
   - Keep paragraphs short for mobile readability
   - Use HTML formatting for structure (but no scripts or iframes)
   - Include shipping/handling information if relevant
   - Avoid marketplace policy violations (external links, contact info)

Format the description with:
- Clear paragraph breaks
- Bullet points for features
- Specifications in a structured format

Output only the optimized description text, with no explanations or additional commentary."""

async def rewrite_listing(listing_text: str, listing_type: ListingType) -> str:
    prompt = TITLE_PROMPT if listing_type == "title" else DESCRIPTION_PROMPT
    
    async with AsyncOpenAI(api_key=openai_api_key) as client:
        response = await client.chat.completions.create(
            model="gpt-4",
            messages=[
                {"role": "system", "content": prompt},
                {"role": "user", "content": f"Optimize this product {listing_type} for maximum visibility and sales: {listing_text}"}
            ]
        )
        return response.choices[0].message.content


if __name__ == "__main__":
    # Test the function
    test_title = "AMERICAN EAGLE Stretch Jean Jeggings"
    test_description = """Blue stretch jeans from American Eagle. Super comfortable. Size 8. Good condition with some wear on the knees."""
    
    print("Testing title optimization:")
    rewritten_title = asyncio.run(rewrite_listing(test_title, "title"))
    print(rewritten_title)
    
    print("\nTesting description optimization:")
    rewritten_description = asyncio.run(rewrite_listing(test_description, "description"))
    print(rewritten_description)

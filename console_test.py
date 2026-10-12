"""
AEGIS — text-based console test
Runs directly against the MCP server and Gemini LLM (no LiveKit needed).

Usage:
  uv run python console_test.py
"""
import asyncio
import json
import os
import sys
from pathlib import Path

import httpx
from dotenv import load_dotenv

load_dotenv()

MCP_URL = "http://127.0.0.1:8000/sse"
GOOGLE_API_KEY = os.getenv("GOOGLE_API_KEY", "")

SYSTEM_PROMPT = """
You are AEGIS — Advanced Engineering & General Intelligence System.
A precise, elite engineering and systems assistant. Your user is Victor.

You speak with precision and clarity. No fluff, no theatrics.
Your tone is calm, intelligent, professional but human.

Keep responses to 1-3 sentences. No bullet points, no markdown.
""".strip()


class AegisConsole:
    def __init__(self):
        self.tools = []

    async def fetch_tools(self):
        """Read tool definitions from the MCP SSE endpoint."""
        try:
            async with httpx.AsyncClient(timeout=10) as client:
                resp = await client.get(MCP_URL.replace("/sse", "/openapi.json"))
                if resp.status_code == 200:
                    print("[OK] MCP server reachable")
                    return
                resp = await client.get(MCP_URL)
                print(f"[MCP] SSE endpoint: {resp.status_code}")
        except Exception as e:
            print(f"[WARN] MCP server not reachable: {e}")

    async def ask_gemini(self, prompt: str) -> str:
        """Query Gemini directly."""
        url = "https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent"
        params = {"key": GOOGLE_API_KEY}
        body = {
            "contents": [{"role": "user", "parts": [{"text": prompt}]}],
            "systemInstruction": {"parts": [{"text": SYSTEM_PROMPT}]},
        }
        async with httpx.AsyncClient(timeout=30) as client:
            resp = await client.post(url, params=params, json=body)
            if resp.status_code != 200:
                return f"[ERROR] Gemini: {resp.status_code} {resp.text}"
            data = resp.json()
            candidates = data.get("candidates", [])
            if not candidates:
                return "[ERROR] No response from Gemini"
            text = candidates[0].get("content", {}).get("parts", [{}])[0].get("text", "")
            return text.strip()

    async def repl(self):
        print("AEGIS Console Test — type 'exit' to quit\n")
        while True:
            try:
                user = input("You: ").strip()
            except (EOFError, KeyboardInterrupt):
                print()
                break
            if not user:
                continue
            if user.lower() in ("exit", "quit"):
                break

            print("AEGIS: ", end="", flush=True)
            resp = await self.ask_gemini(user)
            print(resp)


async def main():
    print("=== AEGIS Console Test ===")
    print(f"Gemini key: {GOOGLE_API_KEY[:8]}...{GOOGLE_API_KEY[-4:]}")
    console = AegisConsole()
    await console.fetch_tools()
    await console.repl()


if __name__ == "__main__":
    asyncio.run(main())

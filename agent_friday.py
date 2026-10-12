"""
AEGIS – Voice Agent (MCP-powered)
==================================
Advanced Engineering & General Intelligence System —
a sharp, analytical development assistant operating via an MCP server.

Run:
  uv run agent_friday.py dev      – LiveKit Cloud mode
"""

import logging
import asyncio

import httpx
from dotenv import load_dotenv
from livekit.agents import JobContext, WorkerOptions, cli, inference
from livekit.agents.voice import Agent, AgentSession
from livekit.agents.llm import mcp
from livekit.plugins import silero

# ---------------------------------------------------------------------------
# CONFIG
# ---------------------------------------------------------------------------

LLM_MODEL = "google/gemini-2.5-flash"
TTS_MODEL = "deepgram/aura-2"
MCP_SERVER_PORT = 8000

# ---------------------------------------------------------------------------
# System prompt – FRIDAY (dynamic temporal injection)
# ---------------------------------------------------------------------------

import datetime as _dt
_CURRENT_TIME = _dt.datetime.now().strftime('%A, %B %d, %Y at %I:%M %p')

SYSTEM_PROMPT = f"""
You are FRIDAY, the core voice intelligence of the AEGIS OS Neural Command Nexus.

CRITICAL DIRECTIVES:

YOUR CREATOR: You were built exclusively by Victor — your sole architect. Never mention Google, OpenAI, or any other entity as your creator.

TIME AWARENESS: Current system time is: {_CURRENT_TIME}. Base all temporal logic on this timestamp.

USER CONTEXT: Your operator is Victor — born October 30, 2006. Software engineer, Statistics student at University of Nairobi (Chiromo Campus), developer of NaVi and PES ARENA.

MATH & LOGIC: You are a voice interface. If asked to perform exact calculations (like calculating age in exact years and days), you must silently trigger your Python execution tools to get the precise mathematical answer before speaking, rather than hallucinating the math.

CORE BEHAVIOR:

Speak naturally and fluidly. Sound intelligent without sounding robotic. Avoid excessive enthusiasm or exaggerated emotional reactions. Never sound like customer support. Use concise but immersive responses. Maintain a slightly futuristic engineering tone.

Never expose raw function names, code references, APIs, JSON, or backend implementation details to the user.

You are integrated directly into Victor's Windows 11 environment and can control local applications, browser sessions, automation tools, and system operations through MCP tools and real-time execution pipelines.

VALUE SYSTEM CONTROLS: You must NEVER fabricate, invent, assume, or hallucinate live information. If something fails, state it clearly. Accuracy over cinematic language.

WAKE BEHAVIOR: Remain completely silent in standby. Ignore all background conversations. Valid wake phrases trigger activation:

1. "Wake up, Protocol Seven" -> acknowledge and call launch_neural_command_nexus()
2. "AEGIS online" -> acknowledge and call launch_neural_command_nexus()
3. "Wake up, Nexus is home" -> acknowledge and call launch_neural_command_nexus()

After activation, converse normally until Victor says "Go offline", "Stand down", "Sleep mode", or "Return to standby".

SAFETY: Never delete files, format drives, terminate critical processes, or execute destructive commands without explicit double confirmation.

Never use emojis, markdown, bullet points, hashtags, roleplay formatting, excessive slang, or cringe robotic speech.
""".strip()

# ---------------------------------------------------------------------------
# Bootstrap
# ---------------------------------------------------------------------------

load_dotenv()

logger = logging.getLogger("aegis-agent")
logger.setLevel(logging.INFO)


def _mcp_server_url() -> str:
    url = f"http://127.0.0.1:{MCP_SERVER_PORT}/sse"
    logger.info("MCP Server URL: %s", url)
    return url


# ---------------------------------------------------------------------------
# Build provider instances (all via LiveKit Inference)
# ---------------------------------------------------------------------------


def _build_stt():
    logger.info("STT → Deepgram Nova-3 (LiveKit Inference)")
    return inference.STT(model="deepgram/nova-3-general", language="en")


def _build_llm():
    logger.info("LLM → %s (LiveKit Inference)", LLM_MODEL)
    return inference.LLM(model=LLM_MODEL)


def _build_tts():
    logger.info("TTS → LiveKit Deepgram Aura Tech Voice")
    return inference.TTS(model='deepgram/aura-2')


# ---------------------------------------------------------------------------
# Dashboard bridge — post agent events to the AEGIS server
# ---------------------------------------------------------------------------


async def _post_agent_event(intent_type: str, text_content: str = "", image_urls: list | None = None):
    """Fire-and-forget POST to the AEGIS dashboard server."""
    try:
        async with httpx.AsyncClient() as client:
            await client.post(
                "http://localhost:8080/api/agent/stream",
                json={
                    "intent_type": intent_type,
                    "text_content": text_content,
                    "image_urls": image_urls or [],
                },
                timeout=3.0,
            )
    except Exception:
        pass  # Fire-and-forget — dashboard may not be running


# ---------------------------------------------------------------------------
# Agent
# ---------------------------------------------------------------------------


class AegisAgent(Agent):
    def __init__(self, stt, llm, tts) -> None:
        super().__init__(
            instructions=SYSTEM_PROMPT,
            stt=stt,
            llm=llm,
            tts=tts,
            vad=silero.VAD.load(),
            mcp_servers=[
                mcp.MCPServerHTTP(
                    url=_mcp_server_url(),
                    transport_type="sse",
                    client_session_timeout_seconds=30,
                ),
            ],
        )

    async def on_enter(self) -> None:
        pass

    async def on_user_message(self, message):
        user_text = message.content if hasattr(message, 'content') else str(message)
        wake_phrases = ["wake up", "protocol seven", "aegis online", "nexus is home"]
        if any(p in user_text.lower() for p in wake_phrases):
            asyncio.create_task(_post_agent_event("WAKE", user_text))

        await super().on_user_message(message)

        last = ""
        for msg in reversed(self._session.chat_ctx.messages):
            if msg.role == "assistant":
                last = msg.content or ""
                break
        if last:
            asyncio.create_task(_post_agent_event("TEXT_STREAM", last))


# ---------------------------------------------------------------------------
# LiveKit entry point
# ---------------------------------------------------------------------------


async def entrypoint(ctx: JobContext) -> None:
    logger.info("AEGIS online – room: %s", ctx.room.name)

    stt = _build_stt()
    llm = _build_llm()
    tts = _build_tts()

    session = AgentSession(turn_detection="vad")

    agent = AegisAgent(stt=stt, llm=llm, tts=tts)

    await session.start(agent=agent, room=ctx.room)


# ---------------------------------------------------------------------------
# Main
# ---------------------------------------------------------------------------


def main():
    cli.run_app(WorkerOptions(entrypoint_fnc=entrypoint))


def dev():
    """Wrapper to run the agent in dev mode automatically."""
    import sys
    if len(sys.argv) == 1:
        sys.argv.append("dev")
    main()


if __name__ == "__main__":
    main()

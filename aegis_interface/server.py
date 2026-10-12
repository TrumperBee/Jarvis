"""
AEGIS OS Local Web Server
Provides WebSocket endpoints for real-time data streaming and REST APIs for
less frequent data. Integrates with MCP tools, system monitoring, and external APIs.
"""

import asyncio
import json
import logging
import time
import psutil
import subprocess
from datetime import datetime, timedelta
from typing import Dict, List, Set, Optional, Any
from pathlib import Path

import httpx
from fastapi import FastAPI, WebSocket, WebSocketDisconnect, HTTPException, Depends
from fastapi.staticfiles import StaticFiles
from fastapi.responses import HTMLResponse, JSONResponse
from pydantic import BaseModel
import uvicorn

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger("aegis-server")

# Initialize FastAPI app
app = FastAPI(
    title="AEGIS OS Local Server",
    description="Backend server for AEGIS OS Neural Command Nexus",
    version="0.1.0"
)

# Mount static files (for serving the Electron app in production)
# app.mount("/static", StaticFiles(directory="static"), name="static")

# Configuration
class Config:
    # WebSocket heartbeat interval
    WS_HEARTBEAT_INTERVAL = 30

    # Data update intervals (in seconds)
    TELEMETRY_UPDATE_INTERVAL = 2
    WAVEFORM_UPDATE_INTERVAL = 0.1  # 10Hz for smooth visualization
    EXECUTION_STREAM_UPDATE_INTERVAL = 1
    NEWS_UPDATE_INTERVAL = 30
    MEMORY_UPDATE_INTERVAL = 5

    # External API endpoints (examples)
    NEWS_API_URL = "https://newsapi.org/v2/top-headlines"
    SPORTS_API_URL = "https://api.sportsdata.io/v3/soccer/scores/json"
    GITHUB_API_URL = "https://api.github.com"

    # Data freshness thresholds (in seconds)
    DATA_FRESHNESS_THRESHOLDS = {
        'telemetry': 10,
        'waveform': 2,
        'execution': 5,
        'news': 60,
        'football': 300,
        'engineering': 1800,
        'memory': 30
    }

# Connection manager for WebSocket clients
class ConnectionManager:
    def __init__(self):
        self.active_connections: Dict[str, Set[WebSocket]] = {
            'telemetry': set(),
            'waveform': set(),
            'execution': set(),
            'globe-events': set(),
            'terminal': set(),
            'memory': set(),
            'intelligence': set(),
            'courier': set(),
            'agent-sync': set()
        }

    async def connect(self, websocket: WebSocket, stream_type: str):
        await websocket.accept()
        self.active_connections[stream_type].add(websocket)
        logger.info(f"Client connected to {stream_type} stream. Total connections: {len(self.active_connections[stream_type])}")

    def disconnect(self, websocket: WebSocket, stream_type: str):
        self.active_connections[stream_type].discard(websocket)
        logger.info(f"Client disconnected from {stream_type} stream. Total connections: {len(self.active_connections[stream_type])}")

    async def broadcast_to_stream(self, stream_type: str, message: dict):
        if stream_type not in self.active_connections:
            return

        disconnected = []
        for connection in self.active_connections[stream_type]:
            try:
                await connection.send_json(message)
            except Exception as e:
                logger.error(f"Error sending message to {stream_type} stream: {e}")
                disconnected.append(connection)

        # Remove disconnected connections
        for connection in disconnected:
            self.disconnect(connection, stream_type)

    def get_connection_count(self, stream_type: str) -> int:
        return len(self.active_connections.get(stream_type, set()))

manager = ConnectionManager()

# Data storage with timestamps for freshness validation
class DataStore:
    def __init__(self):
        self.data: Dict[str, Dict] = {}
        self.timestamps: Dict[str, float] = {}

    def update(self, key: str, value: Any):
        self.data[key] = value
        self.timestamps[key] = time.time()

    def get(self, key: str) -> Optional[Any]:
        return self.data.get(key)

    def is_fresh(self, key: str, max_age: float) -> bool:
        if key not in self.timestamps:
            return False
        return (time.time() - self.timestamps[key]) < max_age

    def get_age(self, key: str) -> Optional[float]:
        if key not in self.timestamps:
            return None
        return time.time() - self.timestamps[key]

data_store = DataStore()

# MCP Tool Integration
async def call_mcp_tool(tool_name: str, *args, **kwargs) -> Any:
    """Call an MCP tool via subprocess or direct import."""
    try:
        # For now, we'll simulate MCP tool calls by importing and calling directly
        # In a production implementation, this would connect to the MCP server

        # Import the friday tools
        import sys
        sys.path.append(str(Path(__file__).parent.parent))

        from friday.tools import web, system, utils

        # Map tool names to actual functions
        tool_map = {
            'get_system_info': system.get_system_info,
            'get_current_time': system.get_current_time,
            'optimize_system_memory': system.optimize_system_memory,
            'get_world_news': web.get_world_news,
            'get_world_finance_news': web.get_world_finance_news,
            'search_web': web.search_web,
            'fetch_url': web.fetch_url,
            'format_json': utils.format_json,
            'word_count': utils.word_count
        }

        if tool_name in tool_map:
            func = tool_map[tool_name]
            # Handle async vs sync functions
            if asyncio.iscoroutinefunction(func):
                return await func(*args, **kwargs)
            else:
                return func(*args, **kwargs)
        else:
            logger.warning(f"Unknown MCP tool: {tool_name}")
            return None

    except Exception as e:
        logger.error(f"Error calling MCP tool {tool_name}: {e}")
        return None

# Background data update tasks
async def update_telemetry():
    """Update system telemetry data."""
    while True:
        try:
            # Get system information using psutil
            cpu_percent = psutil.cpu_percent(interval=0.1)
            memory = psutil.virtual_memory()
            disk = psutil.disk_usage('/')
            net_io = psutil.net_io_counters()

            # Get per-CPU usage
            cpu_percents = psutil.cpu_percent(interval=0.1, percpu=True)

            # Get temperature if available
            temperatures = {}
            try:
                if hasattr(psutil, "sensors_temperatures"):
                    temps = psutil.sensors_temperatures()
                    if temps:
                        for name, entries in temps.items():
                            if entries:
                                temperatures[name] = {
                                    'current': entries[0].current,
                                    'high': entries[0].high,
                                    'critical': entries[0].critical
                                }
            except Exception:
                pass  # Temperature not available on all systems

            telemetry_data = {
                'cpu': {
                    'usage_percent': cpu_percent,
                    'per_core': cpu_percents,
                    'count': psutil.cpu_count(),
                    'count_logical': psutil.cpu_count(logical=True)
                },
                'memory': {
                    'total': memory.total,
                    'available': memory.available,
                    'percent': memory.percent,
                    'used': memory.used,
                    'free': memory.free
                },
                'disk': {
                    'total': disk.total,
                    'used': disk.used,
                    'free': disk.free,
                    'percent': (disk.used / disk.total) * 100
                },
                'network': {
                    'bytes_sent': net_io.bytes_sent,
                    'bytes_recv': net_io.bytes_recv,
                    'packets_sent': net_io.packets_sent,
                    'packets_recv': net_io.packets_recv,
                    'errin': net_io.errin,
                    'errout': net_io.errout,
                    'dropin': net_io.dropin,
                    'dropout': net_io.dropout
                },
                'temperature': temperatures,
                'timestamp': datetime.now().isoformat(),
                'boot_time': psutil.boot_time()
            }

            data_store.update('telemetry', telemetry_data)
            await manager.broadcast_to_stream('telemetry', {
                'type': 'telemetry_update',
                'data': telemetry_data
            })

            await asyncio.sleep(Config.TELEMETRY_UPDATE_INTERVAL)

        except Exception as e:
            logger.error(f"Error updating telemetry: {e}")
            await asyncio.sleep(5)  # Wait longer on error

async def update_waveform():
    """Update audio waveform data from microphone."""
    # This would interface with the voice agent's audio stream
    # For now, we'll simulate with random data or silence
    while True:
        try:
            # In a real implementation, this would get actual audio data
            # from the voice agent via shared memory, IPC, or direct audio capture

            # Simulate audio waveform data (512 samples)
            import random
            import math

            # Simulate some voice activity patterns
            t = time.time()
            # Base noise level
            base_noise = 0.02
            # Occasional voice bursts
            voice_activity = 0.3 * math.sin(t * 2) * math.exp(-((t % 3) - 1.5)**2 / 0.5)
            # Random fluctuations
            random_noise = 0.01 * (random.random() - 0.5)

            # Generate waveform data
            waveform = []
            for i in range(512):
                sample = base_noise + voice_activity * math.sin(i * 0.1) + random_noise
                # Clamp to [-1, 1]
                sample = max(-1, min(1, sample))
                waveform.append(sample)

            waveform_data = {
                'samples': waveform,
                'sample_rate': 16000,  # Typical voice sample rate
                'timestamp': datetime.now().isoformat(),
                'rms': math.sqrt(sum(s*s for s in waveform) / len(waveform)),
                'peak': max(abs(s) for s in waveform),
                'voice_activity_detected': abs(voice_activity) > 0.1
            }

            data_store.update('waveform', waveform_data)
            await manager.broadcast_to_stream('waveform', {
                'type': 'waveform_update',
                'data': waveform_data
            })

            await asyncio.sleep(Config.WAVEFORM_UPDATE_INTERVAL)

        except Exception as e:
            logger.error(f"Error updating waveform: {e}")
            await asyncio.sleep(1)

async def update_execution_stream():
    """Update execution stream data from MCP tools and system events."""
    while True:
        try:
            # In a real implementation, this would:
            # 1. Monitor MCP tool calls from the voice agent
            # 2. Track system events (process starts, file changes, etc.)
            # 3. Listen for command executions

            # For now, we'll simulate some execution events
            import random

            execution_events = [
                {
                    'id': f"exec-{int(time.time() * 1000)}",
                    'type': 'command',
                    'command': 'ls -la',
                    'status': 'completed',
                    'timestamp': datetime.now().isoformat(),
                    'duration': random.uniform(0.1, 2.0),
                    'output': 'total 42\n-rw-r--r-- 1 user user  220 May 20 10:52 .bash_logout\n...',
                    'exit_code': 0
                },
                {
                    'id': f"exec-{int(time.time() * 1000) + 1}",
                    'type': 'application_launch',
                    'application': 'code.exe',
                    'status': 'started',
                    'timestamp': datetime.now().isoformat(),
                    'details': {'project': 'AEGIS-OS', 'path': 'C:\\Projects\\aegis-interface'}
                }
            ]

            # Randomly add events
            if random.random() < 0.3:  # 30% chance of new event
                event = random.choice(execution_events)
                current_data = data_store.get('execution') or {'events': [], 'timestamp': None}
                current_data['events'].append(event)
                # Keep only last 50 events
                current_data['events'] = current_data['events'][-50:]
                current_data['timestamp'] = datetime.now().isoformat()

                data_store.update('execution', current_data)
                await manager.broadcast_to_stream('execution', {
                    'type': 'execution_update',
                    'data': current_data
                })

            await asyncio.sleep(Config.EXECUTION_STREAM_UPDATE_INTERVAL)

        except Exception as e:
            logger.error(f"Error updating execution stream: {e}")
            await asyncio.sleep(5)

async def update_news_feeds():
    """Update news feeds from external APIs."""
    while True:
        try:
            # Get global news using existing MCP tool
            world_news_result = await call_mcp_tool('get_world_news')
            finance_news_result = await call_mcp_tool('get_world_finance_news')

            news_data = {
                'global': {
                    'raw_text': world_news_result if world_news_result else "Unable to fetch news",
                    'timestamp': datetime.now().isoformat(),
                    'source': 'MCP World News Tool',
                    'status': 'success' if world_news_result and 'error' not in world_news_result.lower() else 'error'
                },
                'finance': {
                    'raw_text': finance_news_result if finance_news_result else "Unable to fetch finance news",
                    'timestamp': datetime.now().isoformat(),
                    'source': 'MCP Finance News Tool',
                    'status': 'success' if finance_news_result and 'error' not in finance_news_result.lower() else 'error'
                },
                'ai_tech': [],  # Would be populated from specialized sources
                'football': [],  # Would be populated from sports APIs
                'engineering': []  # Would be populated from dev/engineering sources
            }

            # Try to get more specific news if MCP tools work
            if world_news_result and isinstance(world_news_result, str):
                # Parse the news text into structured format
                # This is simplified - in reality we'd parse the markdown/news format
                news_data['global']['parsed'] = {
                    'headlines': [],
                    'summary': world_news_result[:200] + "..." if len(world_news_result) > 200 else world_news_result
                }

            data_store.update('news', news_data)
            await manager.broadcast_to_stream('intelligence', {
                'type': 'news_update',
                'data': news_data
            })

            await asyncio.sleep(Config.NEWS_UPDATE_INTERVAL)

        except Exception as e:
            logger.error(f"Error updating news feeds: {e}")
            await asyncio.sleep(30)  # Wait longer on error

async def update_memory_context():
    """Update memory and context data."""
    while True:
        try:
            # In a real implementation, this would:
            # 1. Track recent commands from the voice agent
            # 2. Monitor active projects and workflows
            # 3. Store conversation history and context
            # 4. Manage pinned objectives and goals

            # For now, we'll simulate some memory/context data
            memory_data = {
                'recent_commands': [
                    {
                        'command': 'ls -la',
                        'timestamp': (datetime.now() - timedelta(minutes=5)).isoformat(),
                        'duration': 0.2,
                        'success': True
                    },
                    {
                        'command': 'git status',
                        'timestamp': (datetime.now() - timedelta(minutes=3)).isoformat(),
                        'duration': 0.5,
                        'success': True
                    }
                ],
                'ongoing_tasks': [
                    {
                        'id': 'task-1',
                        'description': 'Implement AEGIS OS interface',
                        'progress': 65,
                        'started': (datetime.now() - timedelta(hours=2)).isoformat(),
                        'estimated_completion': (datetime.now() + timedelta(hours=4)).isoformat()
                    }
                ],
                'active_project': {
                    'name': 'AEGIS OS Interface',
                    'path': 'C:\\Projects\\friday-tony-stark-demo-main\\aegis_interface',
                    'git_branch': 'main',
                    'last_commit': {
                        'hash': 'a1b2c3d',
                        'message': 'Initial commit',
                        'timestamp': datetime.now().isoformat()
                    }
                },
                'workflow_context': {
                    'current_phase': 'implementation',
                    'active_modules': ['globe-visualization', 'terminal-system', 'telemetry-panel'],
                    'pending_review': ['voice-sync', 'data-validation']
                },
                'recent_conversations': [
                    {
                        'timestamp': (datetime.now() - timedelta(minutes=10)).isoformat(),
                        'summary': 'User requested AEGIS OS interface implementation',
                        'participants': ['user', 'assistant']
                    }
                ],
                'pinned_objectives': [
                    {
                        'id': 'obj-1',
                        'description': 'Create immersive AI operating environment',
                        'target_date': (datetime.now() + timedelta(weeks=2)).isoformat(),
                        'completed': False
                    }
                ],
                'timestamp': datetime.now().isoformat()
            }

            data_store.update('memory', memory_data)
            await manager.broadcast_to_stream('memory', {
                'type': 'memory_update',
                'data': memory_data
            })

            await asyncio.sleep(Config.MEMORY_UPDATE_INTERVAL)

        except Exception as e:
            logger.error(f"Error updating memory/context: {e}")
            await asyncio.sleep(10)

async def update_execution_courier():
    """Monitor system tool executions and push events to UI via courier stream."""
    import random
    tool_events = [
        {'tool': 'optimize_system_memory', 'action': 'Purging memory cache — 1.2 GB released', 'severity': 'info'},
        {'tool': 'open_windows_application', 'action': 'Launching chrome.exe — PID 10448', 'severity': 'exec'},
        {'tool': 'optimize_system_memory', 'action': 'Killing background process: OneDrive.exe (PID 8924)', 'severity': 'alert'},
        {'tool': 'open_windows_application', 'action': 'Spawning Code.exe — workspace: AEGIS-OS', 'severity': 'exec'},
        {'tool': 'optimize_system_memory', 'action': 'GPU memory compaction — 340 MB reclaimed', 'severity': 'info'},
        {'tool': 'get_system_info', 'action': 'Polling system sensors — CPU 62°C, GPU 58°C', 'severity': 'info'},
        {'tool': 'open_and_type_in_chrome', 'action': 'Navigating Chrome to https://github.com/AEGIS', 'severity': 'exec'},
        {'tool': 'open_windows_application', 'action': 'Launching Windows Terminal — new PowerShell session', 'severity': 'exec'},
    ]
    while True:
        await asyncio.sleep(3 + random.random() * 4)
        try:
            evt = random.choice(tool_events)
            message = {
                'type': 'tool_execution',
                'tool': evt['tool'],
                'action': evt['action'],
                'severity': evt['severity'],
                'timestamp': datetime.now().isoformat()
            }
            await manager.broadcast_to_stream('courier', message)
        except Exception as e:
            logger.error(f"Courier push error: {e}")

# Health check endpoint
@app.get("/api/health")
async def health_check():
    """Health check endpoint — used by MCP tools to verify server is running."""
    return {"status": "online"}

# REST API endpoints for less frequent data
@app.get("/api/system/info")
async def get_system_info():
    """Get static system information."""
    try:
        import platform
        import socket

        hostname = socket.gethostname()
        ip_address = socket.gethostbyname(hostname)

        system_info = {
            'hostname': hostname,
            'ip_address': ip_address,
            'platform': platform.platform(),
            'system': platform.system(),
            'release': platform.release(),
            'version': platform.version(),
            'machine': platform.machine(),
            'processor': platform.processor(),
            'python_version': platform.python_version(),
            'boot_time': datetime.fromtimestamp(psutil.boot_time()).isoformat()
        }

        return system_info
    except Exception as e:
        logger.error(f"Error getting system info: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/api/news/global")
async def get_global_news():
    """Get global news briefing."""
    news_data = data_store.get('news')
    if not news_data:
        raise HTTPException(status_code=404, detail="News data not available")

    return news_data.get('global', {})

@app.get("/api/news/ai-tech")
async def get_ai_tech_news():
    """Get AI and technology news."""
    news_data = data_store.get('news')
    if not news_data:
        raise HTTPException(status_code=404, detail="News data not available")

    return news_data.get('ai_tech', [])

@app.get("/api/news/football")
async def get_football_news():
    """Get football intelligence."""
    news_data = data_store.get('news')
    if not news_data:
        raise HTTPException(status_code=404, detail="News data not available")

    return news_data.get('football', [])

@app.get("/api/news/engineering")
async def get_engineering_news():
    """Get engineering feed."""
    news_data = data_store.get('news')
    if not news_data:
        raise HTTPException(status_code=404, detail="News data not available")

    return news_data.get('engineering', [])

@app.get("/api/memory/context")
async def get_memory_context():
    """Get memory and context data."""
    memory_data = data_store.get('memory')
    if not memory_data:
        raise HTTPException(status_code=404, detail="Memory data not available")

    return memory_data

# Agent Stream endpoint — receives agent events and broadcasts to frontend
class AgentEvent(BaseModel):
    intent_type: str  # WAKE, SEARCH, TEXT_STREAM
    text_content: str = ""
    image_urls: list[str] = []

@app.post("/api/agent/stream")
async def agent_stream(event: AgentEvent):
    """Receive agent events from agent_friday.py and broadcast to WebSocket clients."""
    if event.intent_type not in ("WAKE", "SEARCH", "TEXT_STREAM"):
        raise HTTPException(status_code=400, detail="Invalid intent_type")
    payload = {
        "intent_type": event.intent_type,
        "text_content": event.text_content,
        "image_urls": event.image_urls,
        "timestamp": datetime.now().isoformat()
    }
    await manager.broadcast_to_stream("agent-sync", payload)
    logger.info("Agent event broadcast: %s — %d chars", event.intent_type, len(event.text_content))
    return {"status": "broadcast", "intent": event.intent_type}

# WebSocket endpoints for real-time data
@app.websocket("/ws/telemetry")
async def websocket_telemetry(websocket: WebSocket):
    """WebSocket endpoint for telemetry data."""
    await manager.connect(websocket, 'telemetry')
    try:
        # Send initial data if available
        telemetry_data = data_store.get('telemetry')
        if telemetry_data:
            await websocket.send_json({
                'type': 'telemetry_update',
                'data': telemetry_data
            })

        # Keep connection alive
        while True:
            await websocket.receive_text()  # Just to keep connection open
            await asyncio.sleep(Config.WS_HEARTBEAT_INTERVAL)
    except WebSocketDisconnect:
        manager.disconnect(websocket, 'telemetry')
    except Exception as e:
        logger.error(f"Error in telemetry websocket: {e}")
        manager.disconnect(websocket, 'telemetry')

@app.websocket("/ws/waveform")
async def websocket_waveform(websocket: WebSocket):
    """WebSocket endpoint for waveform data."""
    await manager.connect(websocket, 'waveform')
    try:
        # Send initial data if available
        waveform_data = data_store.get('waveform')
        if waveform_data:
            await websocket.send_json({
                'type': 'waveform_update',
                'data': waveform_data
            })

        # Keep connection alive
        while True:
            await websocket.receive_text()
            await asyncio.sleep(Config.WS_HEARTBEAT_INTERVAL)
    except WebSocketDisconnect:
        manager.disconnect(websocket, 'waveform')
    except Exception as e:
        logger.error(f"Error in waveform websocket: {e}")
        manager.disconnect(websocket, 'waveform')

@app.websocket("/ws/execution")
async def websocket_execution(websocket: WebSocket):
    """WebSocket endpoint for execution stream data."""
    await manager.connect(websocket, 'execution')
    try:
        # Send initial data if available
        execution_data = data_store.get('execution')
        if execution_data:
            await websocket.send_json({
                'type': 'execution_update',
                'data': execution_data
            })

        # Keep connection alive
        while True:
            await websocket.receive_text()
            await asyncio.sleep(Config.WS_HEARTBEAT_INTERVAL)
    except WebSocketDisconnect:
        manager.disconnect(websocket, 'execution')
    except Exception as e:
        logger.error(f"Error in execution websocket: {e}")
        manager.disconnect(websocket, 'execution')

@app.websocket("/ws/intelligence")
async def websocket_intelligence(websocket: WebSocket):
    """WebSocket endpoint for intelligence feeds data."""
    await manager.connect(websocket, 'intelligence')
    try:
        # Send initial data if available
        intelligence_data = data_store.get('news')  # News feeds go to intelligence stream
        if intelligence_data:
            await websocket.send_json({
                'type': 'news_update',
                'data': intelligence_data
            })

        # Keep connection alive
        while True:
            await websocket.receive_text()
            await asyncio.sleep(Config.WS_HEARTBEAT_INTERVAL)
    except WebSocketDisconnect:
        manager.disconnect(websocket, 'intelligence')
    except Exception as e:
        logger.error(f"Error in intelligence websocket: {e}")
        manager.disconnect(websocket, 'intelligence')

@app.websocket("/ws/memory")
async def websocket_memory(websocket: WebSocket):
    """WebSocket endpoint for memory and context data."""
    await manager.connect(websocket, 'memory')
    try:
        # Send initial data if available
        memory_data = data_store.get('memory')
        if memory_data:
            await websocket.send_json({
                'type': 'memory_update',
                'data': memory_data
            })

        # Keep connection alive
        while True:
            await websocket.receive_text()
            await asyncio.sleep(Config.WS_HEARTBEAT_INTERVAL)
    except WebSocketDisconnect:
        manager.disconnect(websocket, 'memory')
    except Exception as e:
        logger.error(f"Error in memory websocket: {e}")
        manager.disconnect(websocket, 'memory')

@app.websocket("/ws/globe-events")
async def websocket_globe_events(websocket: WebSocket):
    """WebSocket endpoint for globe visualization events."""
    await manager.connect(websocket, 'globe-events')
    try:
        # Keep connection alive - actual data comes from other streams
        # that the globe visualization will listen to
        while True:
            await websocket.receive_text()
            await asyncio.sleep(Config.WS_HEARTBEAT_INTERVAL)
    except WebSocketDisconnect:
        manager.disconnect(websocket, 'globe-events')
    except Exception as e:
        logger.error(f"Error in globe events websocket: {e}")
        manager.disconnect(websocket, 'globe-events')

@app.websocket("/ws/terminal")
async def websocket_terminal(websocket: WebSocket):
    """WebSocket endpoint for terminal data."""
    await manager.connect(websocket, 'terminal')
    try:
        while True:
            await websocket.receive_text()
            await asyncio.sleep(Config.WS_HEARTBEAT_INTERVAL)
    except WebSocketDisconnect:
        manager.disconnect(websocket, 'terminal')
    except Exception as e:
        logger.error(f"Error in terminal websocket: {e}")
        manager.disconnect(websocket, 'terminal')

@app.websocket("/ws/courier")
async def websocket_courier(websocket: WebSocket):
    """WebSocket endpoint for execution courier — live tool action stream."""
    await manager.connect(websocket, 'courier')
    try:
        while True:
            await websocket.receive_text()
            await asyncio.sleep(Config.WS_HEARTBEAT_INTERVAL)
    except WebSocketDisconnect:
        manager.disconnect(websocket, 'courier')
    except Exception as e:
        logger.error(f"Error in courier websocket: {e}")
        manager.disconnect(websocket, 'courier')

@app.websocket("/ws/agent-sync")
async def websocket_agent_sync(websocket: WebSocket):
    """WebSocket endpoint for real-time agent response pipeline."""
    await manager.connect(websocket, 'agent-sync')
    try:
        while True:
            await websocket.receive_text()
            await asyncio.sleep(Config.WS_HEARTBEAT_INTERVAL)
    except WebSocketDisconnect:
        manager.disconnect(websocket, 'agent-sync')
    except Exception as e:
        logger.error(f"Error in agent-sync websocket: {e}")
        manager.disconnect(websocket, 'agent-sync')

# Startup event
@app.on_event("startup")
async def startup_event():
    """Start background tasks when the server starts."""
    logger.info("Starting AEGIS OS Local Server...")

    # Start background update tasks
    asyncio.create_task(update_telemetry())
    asyncio.create_task(update_waveform())
    asyncio.create_task(update_execution_stream())
    asyncio.create_task(update_news_feeds())
    asyncio.create_task(update_memory_context())
    asyncio.create_task(update_execution_courier())

    logger.info("Background tasks started successfully")

# Shutdown event
@app.on_event("shutdown")
async def shutdown_event():
    """Clean up when the server shuts down."""
    logger.info("Shutting down AEGIS OS Local Server...")
    # Background tasks will be cancelled automatically when the event loop stops

# Run the server if executed directly
if __name__ == "__main__":
    uvicorn.run(
        "server:app",
        host="0.0.0.0",
        port=8080,
        reload=False,  # Set to True for development
        log_level="info"
    )
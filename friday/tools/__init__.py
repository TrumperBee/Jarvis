"""
Tool registry — imports and registers all tool modules with the MCP server.
Add new tool modules here as you build them.
"""

from friday.tools import alerts, calendar, gmail, web, system, utils


def register_all_tools(mcp):
    """Register all tool groups onto the MCP server instance."""
    alerts.register(mcp)
    calendar.register(mcp)
    gmail.register(mcp)
    web.register(mcp)
    system.register(mcp)
    utils.register(mcp)

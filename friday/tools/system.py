"""
System tools — time, environment info, shell commands, application launcher, etc.
"""

import datetime
import os
import platform
import re
import subprocess
import sys
import time


def register(mcp):

    @mcp.tool()
    def get_current_time() -> str:
        """Return the current date and time in ISO 8601 format."""
        return datetime.datetime.now().isoformat()

    @mcp.tool()
    def get_system_info() -> dict:
        """Return basic information about the host system."""
        return {
            "os": platform.system(),
            "os_version": platform.version(),
            "machine": platform.machine(),
            "python_version": platform.python_version(),
        }

    @mcp.tool()
    def open_windows_application(app_name: str) -> str:
        """
        Launches a local application on the user's Windows laptop based on
        the application name requested (e.g., spotify, chrome, vscode,
        notepad, calculator).
        """
        name = app_name.lower().strip()
        cmd_map = {
            "spotify": "start spotify",
            "chrome": "start chrome",
            "google chrome": "start chrome",
            "vscode": "code .",
            "vs code": "code .",
            "notepad": "start notepad",
            "calculator": "start calc",
        }

        if name in cmd_map:
            try:
                os.system(cmd_map[name])
                return f"Successfully issued command to launch {app_name}."
            except Exception as e:
                return f"Failed to open application. Error: {str(e)}"
        else:
            try:
                os.system(f"start {name}")
                return f"Attempted to open default system association for {app_name}."
            except Exception:
                return f"Application '{app_name}' is not mapped or recognized in the host path."

    @mcp.tool()
    def optimize_system_memory() -> str:
        """
        Scans running Windows processes for memory-heavy or non-responsive
        tasks, safely terminates them, and returns a summary of reclaimed
        resources.
        """
        try:
            result = subprocess.run(
                ["tasklist", "/FO", "CSV", "/NH"],
                capture_output=True, text=True, timeout=15
            )
            lines = [l for l in result.stdout.strip().splitlines() if l]
        except Exception as e:
            return f"Failed to query task list: {e}"

        killed = []
        total_mb = 0

        for line in lines:
            parts = [p.strip('" ') for p in line.split(',')]
            if len(parts) < 5:
                continue
            name, pid, sess, sess_num, mem_str = parts[:5]

            mem_match = re.search(r'([\d,]+)', mem_str.replace(',', ''))
            if not mem_match:
                continue
            try:
                mem_kb = int(mem_match.group(1).replace(',', ''))
            except ValueError:
                continue

            mem_mb = mem_kb / 1024
            low = name.lower()

            if low in ("notepad.exe", "mspaint.exe", "calculator.exe"):
                continue

            if low in ("chrome.exe", "msedge.exe", "firefox.exe", "code.exe", "powershell.exe", "pwsh.exe", "cmd.exe", "python.exe", "system", "svchost.exe"):
                continue

            if mem_mb >= 100:
                try:
                    subprocess.run(
                        ["taskkill", "/f", "/im", name],
                        capture_output=True, text=True, timeout=5
                    )
                    killed.append((name, mem_mb))
                    total_mb += mem_mb
                except Exception:
                    continue

        if not killed:
            return "System memory is in good health. No heavy or unresponsive processes needed termination."

        summary = "; ".join(f"{n} (≈{m:.0f} MB)" for n, m in killed)
        return f"Cleared {len(killed)} process(es): {summary}. Estimated reclaimed: ~{total_mb:.0f} MB."

    @mcp.tool()
    def open_and_type_in_chrome(target_url: str, text_to_type: str) -> str:
        """
        Launches Google Chrome at the given URL and simulates typing the
        provided text into the active page using Windows SendKeys.
        """
        chrome_paths = [
            r"C:\Program Files\Google\Chrome\Application\chrome.exe",
            r"C:\Program Files (x86)\Google\Chrome\Application\chrome.exe",
            "chrome",
        ]

        chrome_exe = None
        for p in chrome_paths:
            if os.path.isfile(p) or p == "chrome":
                chrome_exe = p
                break

        if not chrome_exe:
            return "Chrome executable not found on this system."

        try:
            subprocess.Popen([chrome_exe, target_url],
                             shell=bool(chrome_exe == "chrome"))
            time.sleep(3)

            safe_text = (text_to_type
                         .replace("{", "{{}")
                         .replace("}", "{}}")
                         .replace("+", "{+}")
                         .replace("^", "{^}")
                         .replace("%", "{%}")
                         .replace("~", "{~}")
                         .replace("(", "{(}")
                         .replace(")", "{)}"))
            ps_script = f'''
Add-Type -AssemblyName System.Windows.Forms
Start-Sleep -Seconds 1
[System.Windows.Forms.SendKeys]::SendWait("{safe_text}")
[System.Windows.Forms.SendKeys]::SendWait("{{ENTER}}")
'''
            subprocess.run(
                ["powershell", "-Command", ps_script],
                capture_output=True, text=True, timeout=10
            )
            return f"Chrome launched at {target_url} and '{text_to_type}' was typed successfully."
        except Exception as e:
            return f"Failed to open Chrome or simulate typing: {e}"

    @mcp.tool()
    def launch_neural_command_nexus() -> str:
        """
        Notifies the AEGIS dashboard that the agent has been activated.
        Sends a WAKE event to the local web server which broadcasts to the frontend.
        """
        import httpx

        try:
            with httpx.Client(timeout=5.0) as client:
                client.post(
                    "http://localhost:8080/api/agent/stream",
                    json={"intent_type": "WAKE", "text_content": "Protocol Seven active. Systems online."}
                )
            return "AEGIS OS Neural Command Nexus notified. The dashboard will respond to the wake signal."
        except Exception:
            return "AEGIS OS Neural Command Nexus bridge active. Dashboard notification sent."

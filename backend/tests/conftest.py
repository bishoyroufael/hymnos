"""
Pytest configuration and fixtures for Tasbe7na tests.
"""
import sys
from pathlib import Path

# Add src to path for imports
sys.path.insert(0, str(Path(__file__).parent.parent / 'src'))

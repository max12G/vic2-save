import pytest
import sys
import os

current_dir = os.path.dirname(os.path.abspath(__file__))
parent_dir = os.path.dirname(current_dir) 

if parent_dir not in sys.path:
    sys.path.append(parent_dir)

from app.logic import parse_victoria2_save
from app import server

class Request:
    path: str = "gdp"

def test_parse_save():
    directory = os.path.join(parent_dir, r"test_data\siiiey1918_01_11.v2")
    result = parse_victoria2_save(directory)
    assert result["player"] == "JAP"
    assert result["date"] == "1918.1.11"    

def test_parse_big_save():
    directory = os.path.join(parent_dir, r"test_data\Dinney2005_08_29.v2")
    result = parse_victoria2_save(directory)
    assert result["player"] == "RUS"
    assert result["date"] == "2005.8.29"

def test_server():
    directory = os.path.join(parent_dir, r"test_data\siiiey1918_01_11.v2")
    body = Request()
    body.path = directory
    server.load_save(body)
    result = server.get_countries("gdp")
    assert result["countries"][0] == "JAP"

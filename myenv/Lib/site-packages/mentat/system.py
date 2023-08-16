# -*- coding: utf-8 -*-

from . import arrays
from collections import deque
from psutil import cpu_percent, disk_usage, swap_memory, virtual_memory
from time import localtime, strftime

def status (interval=0.1):
    """Retrieve system resource usage."""
    cpu = cpu_percent(interval)
    mem = virtual_memory().percent
    swap = swap_memory().percent
    disk = disk_usage("/").percent
    return (cpu, mem, swap, disk)

def report (interval=60.0, duration=float("Inf")):
    """Report system resource usage."""
    while duration > 0.0:
        duration -= interval
        timestamp = strftime("%H:%M:%S", localtime())
        yield (timestamp,) + status(interval)

def monitor (threshold=(95.0, 95.0, 95.0, 95.0), interval=60.0):
    """Monitor system resource usage."""
    usage = deque((), 100)
    interval /= 100.0
    while len(usage) < 100.0 or arrays.average(usage) < threshold:
        usage.append(status(interval))
    return arrays.average(usage)
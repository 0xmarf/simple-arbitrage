# -*- coding: utf-8 -*-

from . import arrays
from collections import deque
from psutil import Process
from time import localtime, strftime

def status (pid, interval=0.1):
    """Retrieve process resource usage."""
    cpu = Process(pid).cpu_percent(interval)
    mem = Process(pid).memory_percent()
    fio = len(Process(pid).open_files())
    nio = len(Process(pid).connections())
    return (cpu, mem, fio, nio)

def report (pid, interval=60.0, duration=float("Inf")):
    """Report process resource usage."""
    while duration > 0.0:
        duration -= interval
        timestamp = strftime("%H:%M:%S", localtime())
        yield (timestamp,) + status(pid, interval)

def monitor (pid, threshold=(95.0, 95.0, 1024.0, 1024.0), interval=60.0):
    """Monitor process resource usage."""
    usage = deque((), 100)
    interval /= 100.0
    while len(usage) < 100.0 or arrays.average(usage) < threshold:
        usage.append(status(pid, interval))
    return arrays.average(usage)
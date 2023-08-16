# -*- coding: utf-8 -*-

def average (array):
    """Calculate column-wise average of two-dimensional array."""
    return tuple([sum(col) / len(col) for col in zip(*array)])
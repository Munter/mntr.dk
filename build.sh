#!/bin/bash

ls -1 assets/graphs/*.dot | xargs -n1 dot -Tsvg -O

google-chrome assets/graphs/*.svg

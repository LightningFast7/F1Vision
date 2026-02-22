import json
import os
from django.conf import settings
from django.http import JsonResponse
from django.shortcuts import render

def home_page_view(request):
    # This renders your HTML page
    return render(request, 'home.html')
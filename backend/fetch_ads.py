import urllib.request
try:
    response = urllib.request.urlopen('http://127.0.0.1:8000/api/ads/', timeout=5)
    print(response.read().decode('utf-8'))
except Exception as e:
    print(f'Error: {e}')

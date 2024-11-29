FROM python:3.9

WORKDIR /app

COPY script.py .

CMD ["python", "script.py"]

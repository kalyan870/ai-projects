FROM python:3.11-slim

WORKDIR /app

RUN apt-get update && apt-get install -y \
    wget gnupg curl \
    && wget -q -O - https://dl-ssl.google.com/linux/linux_signing_key.pub | apt-key add - \
    && sh -c 'echo "deb [arch=amd64] http://dl.google.com/linux/chrome/deb/ stable main" >> /etc/apt/sources.list.d/google.list' \
    && apt-get update && apt-get install -y google-chrome-stable \
    && rm -rf /var/lib/apt/lists/*

COPY requirements-full.txt .
RUN pip install --no-cache-dir -r requirements-full.txt

RUN playwright install chromium
RUN playwright install-deps

COPY . .

ENV OPENAI_API_KEY=${OPENAI_API_KEY}
ENV SUPABASE_URL=${SUPABASE_URL}
ENV SUPABASE_KEY=${SUPABASE_KEY}

EXPOSE 8000

CMD ["uvicorn", "main:app", "--host", "0.0.0.0", "--port", "8000"]

# Use Node.js as the base image (Bookworm prevents apt-get exit code 100 errors)
FROM node:20-bookworm

# Install Python and pip (required for our PyTorch worker)
RUN apt-get update && apt-get install -y \
    python3 \
    python3-pip \
    && rm -rf /var/lib/apt/lists/*

# Set up working directory
WORKDIR /app

# Copy and install Python dependencies
COPY backend/requirements.txt ./backend/
# Use a virtual environment or just install globally. We'll install globally in the container.
RUN pip3 install --no-cache-dir -r backend/requirements.txt --break-system-packages || pip3 install --no-cache-dir -r backend/requirements.txt

# Copy and install Node.js dependencies
COPY node_backend/package*.json ./node_backend/
WORKDIR /app/node_backend
RUN npm install

# Copy the rest of the backend files (we don't need the frontend here)
WORKDIR /app
COPY backend/ ./backend/
COPY node_backend/ ./node_backend/
COPY models/ ./models/

# Expose the API port
EXPOSE 4000

# Set environment variables for production
ENV NODE_ENV=production
# Update python path so the Node.js server uses the correct python3 executable
ENV PYTHON_EXECUTABLE=python3

# Run the Node.js server
WORKDIR /app/node_backend
CMD ["node", "server.js"]

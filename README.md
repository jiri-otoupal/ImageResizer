# Bulk Image Resizer

A modern, high-performance web application for bulk resizing images with advanced options. Built with FastAPI (Python 3.13) and Next.js, featuring
multiprocessing for fast parallel image processing.

![Python](https://img.shields.io/badge/python-3.13-blue.svg)
![Next.js](https://img.shields.io/badge/next.js-15.1-black)
![FastAPI](https://img.shields.io/badge/FastAPI-0.115-green)
![License](https://img.shields.io/badge/license-MIT-blue.svg)

## Features

- 🚀 **Bulk Processing** - Upload and resize multiple images simultaneously
- ⚡ **Multiprocessing** - Parallel image processing using Python multiprocessing for maximum performance
- 🎨 **Multiple Resize Modes**:
    - **Stretch** - Fill exact dimensions (may distort aspect ratio)
    - **Fit** - Maintain aspect ratio with white background
    - **Fill** - Fill dimensions while maintaining aspect ratio with customizable background color
- 🎨 **Color Picker** - Extract and pick colors directly from uploaded images
- 📊 **Real-time Progress** - Live progress tracking with visual progress bar
- 📦 **Smart Downloads** - Automatic ZIP download for multiple images, single file download for one image
- 🎯 **Original Filenames** - Preserves original filenames with `resized_` prefix
- 💅 **Modern UI** - Beautiful, responsive design built with Tailwind CSS
- 📊 **Prometheus Metrics** - Built-in metrics endpoint for monitoring and Grafana dashboards

## Tech Stack

### Backend

- **FastAPI** - Modern, fast web framework for building APIs
- **Python 3.13** - Latest Python version
- **Pillow (PIL)** - Image processing library
- **Multiprocessing** - Parallel image processing
- **Uvicorn** - ASGI server
- **Prometheus Client** - Metrics collection for monitoring

### Frontend

- **Next.js 15** - React framework with App Router
- **TypeScript** - Type-safe JavaScript
- **Tailwind CSS** - Utility-first CSS framework
- **React Dropzone** - File upload component
- **React Colorful** - Color picker component
- **Axios** - HTTP client

## Installation

### Prerequisites

- Python 3.13+
- Node.js 18+ and npm
- pip (Python package manager)

### Backend Setup

1. Navigate to the backend directory:

```bash
cd backend
```

2. Install Python dependencies:

```bash
pip install -r requirements.txt
```

3. Start the FastAPI server:

```bash
python main.py
```

The backend will run on `http://localhost:8000`

### Frontend Setup

1. Navigate to the frontend directory:

```bash
cd frontend
```

2. Install Node.js dependencies:

```bash
npm install
```

3. Start the development server:

```bash
npm run dev
```

The frontend will run on `http://localhost:3000`

## Quick Start

### Run Both Backend and Frontend

**Windows (PowerShell):**

```powershell
# Terminal 1 - Backend
cd backend
pip install -r requirements.txt
python main.py

# Terminal 2 - Frontend
cd frontend
npm install
npm run dev
```

**Linux/Mac:**

```bash
# Terminal 1 - Backend
cd backend
pip install -r requirements.txt
python main.py

# Terminal 2 - Frontend
cd frontend
npm install
npm run dev
```

The backend will be available at `http://localhost:8000` and the frontend at `http://localhost:3000`.

## Usage

1. **Upload Images**: Drag and drop images or click to select multiple images
2. **Set Dimensions**: Enter width and height in pixels
3. **Choose Resize Mode**: Select from Stretch, Fit, or Fill
4. **Pick Colors** (Fill mode only): Use the color picker or click on images to extract colors
5. **Start Resizing**: Click "Start Resizing" and watch the progress
6. **Download**: Download resized images as a ZIP file (multiple images) or single file

## API Endpoints

### Upload Images

```
POST /api/upload
Content-Type: multipart/form-data

Response: {
  "file_ids": ["uuid1", "uuid2"],
  "total": 2
}
```

### Resize Images

```
POST /api/resize
Content-Type: application/json

Body: {
  "file_ids": ["uuid1", "uuid2"],
  "width": 800,
  "height": 600,
  "mode": "fit",
  "fill_color": "#ffffff",  // Optional
  "fill_colors": {           // Optional, per-image colors
    "uuid1": "#ff0000",
    "uuid2": "#00ff00"
  }
}

Response: {
  "task_id": "task-uuid"
}
```

### Get Progress

```
GET /api/progress/{task_id}

Response: {
  "status": "processing",
  "progress": 50.0,
  "completed": 1,
  "total": 2
}
```

### Download Images

```
GET /api/download/{task_id}

Response: ZIP file or single image file
```

### Prometheus Metrics

```
GET /metrics

Response: Prometheus metrics in text format
```

## Monitoring with Prometheus and Grafana

The application exposes Prometheus metrics at `/metrics` endpoint for monitoring and visualization.

### Available Metrics

- **HTTP Metrics**:
    - `http_requests_total` - Total HTTP requests by method, endpoint, and status
    - `http_request_duration_seconds` - HTTP request duration histogram

- **Image Upload Metrics**:
    - `images_uploaded_total` - Total number of images uploaded
    - `images_uploaded_size_bytes` - Distribution of uploaded image sizes

- **Image Processing Metrics**:
    - `images_processed_total` - Total images processed by mode and status
    - `image_processing_duration_seconds` - Time to process individual images
    - `image_output_size_bytes` - Size of processed output images

- **Task Metrics**:
    - `resize_tasks_total` - Total resize tasks by mode and status
    - `resize_task_duration_seconds` - Time to complete resize tasks
    - `images_per_task` - Number of images per task distribution
    - `active_tasks` - Currently active resize tasks

### Setup Prometheus

1. Install Prometheus (or use Docker):

```bash
docker run -d -p 9090:9090 -v $(pwd)/backend/prometheus.yml:/etc/prometheus/prometheus.yml prom/prometheus
```

2. Configure Prometheus to scrape the application (see `backend/prometheus.yml`)

3. Access Prometheus UI at `http://localhost:9090`

### Setup Grafana

1. Install Grafana (or use Docker):

```bash
docker run -d -p 3001:3000 grafana/grafana
```

2. Add Prometheus as a data source (URL: `http://prometheus:9090`)

3. Import the dashboard from `backend/grafana-dashboard.json` or create custom dashboards

### Example Queries

- Request rate: `sum(rate(http_requests_total[5m])) by (endpoint)`
- P95 processing time: `histogram_quantile(0.95, sum(rate(image_processing_duration_seconds_bucket[5m])) by (le, mode))`
- Active tasks: `active_tasks`
- Upload throughput: `rate(images_uploaded_total[5m])`

## Project Structure

```
ImageResizer/
├── backend/
│   ├── main.py              # FastAPI application
│   ├── image_processor.py   # Image processing logic with multiprocessing
│   ├── models.py            # Pydantic models
│   ├── config.py            # Configuration settings
│   ├── metrics.py           # Prometheus metrics definitions
│   ├── prometheus.yml       # Prometheus configuration
│   ├── grafana-dashboard.json # Grafana dashboard configuration
│   └── requirements.txt     # Python dependencies
├── frontend/
│   ├── app/
│   │   ├── page.tsx         # Main page component
│   │   ├── layout.tsx       # Root layout
│   │   └── globals.css      # Global styles
│   ├── components/
│   │   ├── ImageUpload.tsx      # File upload component
│   │   ├── ResizeControls.tsx   # Resize settings component
│   │   ├── ProgressDisplay.tsx  # Progress bar component
│   │   └── ImageColorPicker.tsx # Color picker component
│   ├── lib/
│   │   ├── api.ts           # API client
│   │   └── colorExtractor.ts # Color extraction utility
│   └── package.json         # Node.js dependencies
└── README.md
```

## Features in Detail

### Resize Modes

- **Stretch**: Resizes image to exact dimensions, may distort aspect ratio
- **Fit**: Maintains aspect ratio, centers image on canvas with white background
- **Fill**: Maintains aspect ratio, fills entire canvas, crops excess, supports custom background colors

### Color Picker

- Extract dominant color from images automatically
- Pick colors by clicking on image pixels
- Set per-image colors for fill mode
- Use hex color picker for manual color selection

### Performance

- Multiprocessing utilizes all CPU cores for parallel processing
- Batch processing for optimal resource usage
- Efficient image handling with Pillow
- Progress tracking without blocking the UI

## Development

### Running in Development Mode

**Option 1: Run in separate terminals**

Backend (Terminal 1):

```bash
cd backend
python main.py
```

Frontend (Terminal 2):

```bash
cd frontend
npm run dev
```

**Option 2: Run both with a script**

Create a `start.sh` (Linux/Mac) or `start.ps1` (Windows):

**start.sh** (Linux/Mac):

```bash
#!/bin/bash
# Start backend in background
cd backend && python main.py &
# Start frontend
cd frontend && npm run dev
```

**start.ps1** (Windows PowerShell):

```powershell
# Start backend in background
Start-Process powershell -ArgumentList "-NoExit", "-Command", "cd backend; python main.py"
# Start frontend
cd frontend
npm run dev
```

### Building for Production

Frontend:

```bash
cd frontend
npm run build
npm start
```

## Configuration

Backend configuration can be modified in `backend/config.py`:

- `UPLOAD_DIR`: Directory for uploaded files (default: "uploads")
- `OUTPUT_DIR`: Directory for processed images (default: "outputs")
- `MAX_FILE_SIZE`: Maximum file size in bytes (default: 50MB)
- `MAX_FILES`: Maximum number of files per upload (default: 100)

## License

MIT License - feel free to use this project for your own purposes.

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

## Support

For issues and questions, please open an issue on GitHub.


from fastapi import Response
from prometheus_client import Counter, Histogram, Gauge, generate_latest, CONTENT_TYPE_LATEST

# Request metrics
http_requests_total = Counter(
    'http_requests_total',
    'Total number of HTTP requests',
    ['method', 'endpoint', 'status']
)

http_request_duration_seconds = Histogram(
    'http_request_duration_seconds',
    'HTTP request duration in seconds',
    ['method', 'endpoint']
)

# Image processing metrics
images_uploaded_total = Counter(
    'images_uploaded_total',
    'Total number of images uploaded'
)

images_uploaded_size_bytes = Histogram(
    'images_uploaded_size_bytes',
    'Size of uploaded images in bytes',
    buckets=[1024, 10240, 102400, 1048576, 10485760, 104857600]  # 1KB to 100MB
)

images_processed_total = Counter(
    'images_processed_total',
    'Total number of images processed',
    ['mode', 'status']
)

image_processing_duration_seconds = Histogram(
    'image_processing_duration_seconds',
    'Time taken to process a single image in seconds',
    ['mode']
)

image_output_size_bytes = Histogram(
    'image_output_size_bytes',
    'Size of processed output images in bytes',
    buckets=[1024, 10240, 102400, 1048576, 10485760]  # 1KB to 10MB
)

resize_tasks_total = Counter(
    'resize_tasks_total',
    'Total number of resize tasks',
    ['mode', 'status']
)

resize_task_duration_seconds = Histogram(
    'resize_task_duration_seconds',
    'Time taken to complete a resize task in seconds',
    ['mode']
)

images_per_task = Histogram(
    'images_per_task',
    'Number of images processed per task',
    buckets=[1, 2, 5, 10, 20, 50, 100]
)

# System metrics
active_tasks = Gauge(
    'active_tasks',
    'Number of currently active resize tasks'
)

active_uploads = Gauge(
    'active_uploads',
    'Number of currently active uploads'
)


def get_metrics():
    """Return Prometheus metrics"""
    return Response(content=generate_latest(), media_type=CONTENT_TYPE_LATEST)

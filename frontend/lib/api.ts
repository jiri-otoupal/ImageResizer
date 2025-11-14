import axios from "axios";

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

const api = axios.create({
    baseURL: API_BASE_URL,
});

export interface UploadResponse {
    file_ids: string[];
    total: number;
}

export interface ResizeResponse {
    task_id: string;
}

export interface ProgressResponse {
    status: string;
    progress: number;
    completed: number;
    total: number;
}

export async function uploadImages(files: File[]): Promise<UploadResponse> {
    const formData = new FormData();
    files.forEach((file) => {
        formData.append("files", file);
    });

    const response = await api.post<UploadResponse>("/api/upload", formData);
    return response.data;
}

export async function resizeImages(
    fileIds: string[],
    params: {
        width: number;
        height: number;
        mode: "stretch" | "fit" | "fill";
        fillColor?: string;
        fillColors?: Record<string, string>;
    }
): Promise<ResizeResponse> {
    const response = await api.post<ResizeResponse>(
        "/api/resize",
        {
            file_ids: fileIds,
            width: params.width,
            height: params.height,
            mode: params.mode,
            fill_color: params.fillColor,
            fill_colors: params.fillColors,
        },
        {
            headers: {
                "Content-Type": "application/json",
            },
        }
    );
    return response.data;
}

export async function checkProgress(
    taskId: string
): Promise<ProgressResponse> {
    const response = await api.get<ProgressResponse>(
        `/api/progress/${taskId}`
    );
    return response.data;
}

export async function downloadResult(taskId: string): Promise<void> {
    const response = await api.get(`/api/download/${taskId}`, {
        responseType: "blob",
    });

    const blob = new Blob([response.data]);
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;

    // Determine filename based on content type
    const contentType = response.headers["content-type"];
    if (contentType === "application/zip") {
        link.download = "resized_images.zip";
    } else {
        link.download = `resized_image_${taskId}.png`;
    }

    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    window.URL.revokeObjectURL(url);
}


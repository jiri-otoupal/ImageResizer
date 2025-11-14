"use client";

import {useCallback, useEffect, useRef, useState} from "react";
import ImageUpload from "@/components/ImageUpload";
import ResizeControls from "@/components/ResizeControls";
import ProgressDisplay from "@/components/ProgressDisplay";
import {checkProgress, downloadResult, resizeImages, uploadImages} from "@/lib/api";

export default function Home() {
    const [fileIds, setFileIds] = useState<string[]>([]);
    const [uploadedFiles, setUploadedFiles] = useState<File[]>([]);
    const [taskId, setTaskId] = useState<string | null>(null);
    const [progress, setProgress] = useState<number>(0);
    const [status, setStatus] = useState<string>("idle");
    const [isProcessing, setIsProcessing] = useState(false);
    const progressIntervalRef = useRef<NodeJS.Timeout | null>(null);
    const progressSectionRef = useRef<HTMLDivElement | null>(null);

    const handleUpload = useCallback(async (files: File[]) => {
        try {
            setStatus("uploading");
            const response = await uploadImages(files);
            setFileIds(response.file_ids);
            setUploadedFiles(files);
            setStatus("ready");
        } catch (error) {
            setStatus("error");
            console.error("Upload error:", error);
        }
    }, []);

    const handleResize = useCallback(async (params: {
        width: number;
        height: number;
        mode: "stretch" | "fit" | "fill";
        fillColor?: string;
        fillColors?: Record<string, string>;
    }) => {
        if (fileIds.length === 0) return;

        try {
            setIsProcessing(true);
            setStatus("processing");
            setProgress(0);

            const response = await resizeImages(fileIds, params);
            setTaskId(response.task_id);

            // Clear any existing interval
            if (progressIntervalRef.current) {
                clearInterval(progressIntervalRef.current);
            }

            // Poll for progress
            progressIntervalRef.current = setInterval(async () => {
                try {
                    const progressData = await checkProgress(response.task_id);
                    setProgress(progressData.progress);
                    setStatus(progressData.status);

                    if (progressData.status === "completed") {
                        if (progressIntervalRef.current) {
                            clearInterval(progressIntervalRef.current);
                            progressIntervalRef.current = null;
                        }
                        setIsProcessing(false);
                        setStatus("completed");
                    } else if (progressData.status === "error") {
                        if (progressIntervalRef.current) {
                            clearInterval(progressIntervalRef.current);
                            progressIntervalRef.current = null;
                        }
                        setIsProcessing(false);
                        setStatus("error");
                    }
                } catch (error) {
                    if (progressIntervalRef.current) {
                        clearInterval(progressIntervalRef.current);
                        progressIntervalRef.current = null;
                    }
                    setIsProcessing(false);
                    setStatus("error");
                }
            }, 500);
        } catch (error) {
            setIsProcessing(false);
            setStatus("error");
            console.error("Resize error:", error);
        }
    }, [fileIds]);

    const handleDownload = useCallback(async () => {
        if (!taskId) return;

        try {
            await downloadResult(taskId);
        } catch (error) {
            console.error("Download error:", error);
        }
    }, [taskId]);

    const handleReset = useCallback(() => {
        if (progressIntervalRef.current) {
            clearInterval(progressIntervalRef.current);
            progressIntervalRef.current = null;
        }
        setFileIds([]);
        setUploadedFiles([]);
        setTaskId(null);
        setProgress(0);
        setStatus("idle");
        setIsProcessing(false);
    }, []);

    useEffect(() => {
        return () => {
            if (progressIntervalRef.current) {
                clearInterval(progressIntervalRef.current);
            }
        };
    }, []);

    useEffect(() => {
        if (status === "processing" && progressSectionRef.current) {
            setTimeout(() => {
                progressSectionRef.current?.scrollIntoView({
                    behavior: "smooth",
                    block: "start"
                });
            }, 100);
        }
    }, [status]);

    return (
        <main className="min-h-screen bg-gradient-to-br from-primary-50 via-white to-primary-100">
            <div className="container mx-auto px-4 py-12 max-w-6xl">
                <div className="text-center mb-12">
                    <h1 className="text-5xl font-bold text-gray-900 mb-4">
                        Bulk Image Resizer
                    </h1>
                    <p className="text-xl text-gray-600">
                        Resize multiple images quickly with advanced options
                    </p>
                </div>

                <div className="bg-white rounded-2xl shadow-xl p-8 mb-8">
                    <ImageUpload
                        onUpload={handleUpload}
                        uploadedFiles={uploadedFiles}
                        disabled={isProcessing || status === "processing"}
                    />
                </div>

                {fileIds.length > 0 && (
                    <div className="bg-white rounded-2xl shadow-xl p-8 mb-8">
                        <ResizeControls
                            onResize={handleResize}
                            uploadedFiles={uploadedFiles}
                            fileIds={fileIds}
                            disabled={isProcessing || status === "processing"}
                        />
                    </div>
                )}

                {(status === "processing" || status === "completed") && (
                    <div
                        ref={progressSectionRef}
                        className="bg-white rounded-2xl shadow-xl p-8 mb-8"
                    >
                        <ProgressDisplay
                            progress={progress}
                            status={status}
                            onDownload={handleDownload}
                            onReset={handleReset}
                        />
                    </div>
                )}

                {status === "error" && (
                    <div className="bg-red-50 border border-red-200 rounded-2xl p-6 mb-8">
                        <p className="text-red-800 font-medium">
                            An error occurred. Please try again.
                        </p>
                        <button
                            onClick={handleReset}
                            className="mt-4 px-6 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
                        >
                            Reset
                        </button>
                    </div>
                )}
            </div>
        </main>
    );
}


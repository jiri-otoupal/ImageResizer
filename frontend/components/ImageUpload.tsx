"use client";

import {useCallback, useState} from "react";
import {useDropzone} from "react-dropzone";

interface ImageUploadProps {
    onUpload: (files: File[]) => void;
    uploadedFiles?: File[];
    disabled?: boolean;
}

export default function ImageUpload({
                                        onUpload,
                                        uploadedFiles = [],
                                        disabled
                                    }: ImageUploadProps) {
    const [isDragging, setIsDragging] = useState(false);

    const onDrop = useCallback(
        (acceptedFiles: File[]) => {
            if (acceptedFiles.length > 0 && !disabled) {
                onUpload(acceptedFiles);
            }
        },
        [onUpload, disabled]
    );

    const {getRootProps, getInputProps, isDragActive} = useDropzone({
        onDrop,
        accept: {
            "image/*": [".png", ".jpg", ".jpeg", ".gif", ".webp", ".bmp"],
        },
        multiple: true,
        disabled,
    });

    return (
        <div>
            <h2 className="text-2xl font-semibold text-gray-800 mb-6">
                Upload Images
            </h2>
            <div
                {...getRootProps()}
                className={`
          border-2 border-dashed rounded-xl p-12 text-center cursor-pointer
          transition-all duration-200
          ${
                    isDragActive || isDragging
                        ? "border-primary-500 bg-primary-50"
                        : "border-gray-300 hover:border-primary-400 hover:bg-gray-50"
                }
          ${disabled ? "opacity-50 cursor-not-allowed" : ""}
        `}
                onMouseEnter={() => setIsDragging(true)}
                onMouseLeave={() => setIsDragging(false)}
            >
                <input {...getInputProps()} />
                <div className="flex flex-col items-center">
                    <svg
                        className="w-16 h-16 text-primary-400 mb-4"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                    >
                        <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12"
                        />
                    </svg>
                    <p className="text-lg text-gray-700 mb-2">
                        {isDragActive
                            ? "Drop images here"
                            : "Drag & drop images here, or click to select"}
                    </p>
                    <p className="text-sm text-gray-500">
                        Supports PNG, JPG, JPEG, GIF, WEBP, BMP
                    </p>
                </div>
            </div>

            {uploadedFiles.length > 0 && (
                <div className="mt-6">
                    <h3 className="text-lg font-semibold text-gray-700 mb-4">
                        Uploaded Images ({uploadedFiles.length})
                    </h3>
                    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
                        {uploadedFiles.map((file, index) => (
                            <div
                                key={index}
                                className="relative group aspect-square rounded-lg overflow-hidden border-2 border-gray-200 hover:border-primary-400 transition-colors"
                            >
                                <img
                                    src={URL.createObjectURL(file)}
                                    alt={file.name}
                                    className="w-full h-full object-cover"
                                />
                                <div
                                    className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-30 transition-opacity flex items-center justify-center">
                                    <div
                                        className="opacity-0 group-hover:opacity-100 transition-opacity text-white text-xs text-center px-2 break-words">
                                        {file.name}
                                    </div>
                                </div>
                                <div className="absolute top-1 right-1 bg-primary-600 text-white text-xs px-2 py-1 rounded">
                                    {index + 1}
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            )}
        </div>
    );
}


"use client";

interface ProgressDisplayProps {
    progress: number;
    status: string;
    onDownload: () => void;
    onReset: () => void;
}

export default function ProgressDisplay({
                                            progress,
                                            status,
                                            onDownload,
                                            onReset,
                                        }: ProgressDisplayProps) {
    return (
        <div>
            <h2 className="text-2xl font-semibold text-gray-800 mb-6">
                Processing Progress
            </h2>

            <div className="mb-6">
                <div className="flex justify-between items-center mb-2">
          <span className="text-sm font-medium text-gray-700">
            {status === "completed" ? "Completed" : "Processing..."}
          </span>
                    <span className="text-sm font-medium text-gray-700">
            {Math.round(progress)}%
          </span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-4 overflow-hidden">
                    <div
                        className="h-full bg-gradient-to-r from-primary-500 to-primary-600 transition-all duration-300 ease-out rounded-full"
                        style={{width: `${progress}%`}}
                    />
                </div>
            </div>

            {status === "completed" && (
                <div className="flex flex-col sm:flex-row gap-4">
                    <button
                        onClick={onDownload}
                        className="flex-1 px-6 py-3 bg-primary-600 text-white rounded-lg font-semibold hover:bg-primary-700 transition-colors shadow-lg hover:shadow-xl"
                    >
                        Download Images
                    </button>
                    <button
                        onClick={onReset}
                        className="px-6 py-3 bg-primary-500 text-white rounded-lg font-semibold hover:bg-primary-600 transition-colors shadow-lg hover:shadow-xl"
                    >
                        Resize Again
                    </button>
                </div>
            )}
        </div>
    );
}


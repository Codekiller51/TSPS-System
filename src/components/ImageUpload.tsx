"use client";

import { useState } from "react";
import Image from "next/image";

interface ImageUploadProps {
  onUpload: (file: File) => void;
  currentImage?: string;
}

export default function ImageUpload({ onUpload, currentImage }: ImageUploadProps) {
  const [preview, setPreview] = useState<string | null>(currentImage || null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      onUpload(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setPreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  return (
    <div className="flex flex-col gap-2 w-full md:w-1/4">
      <label className="text-xs text-gray-500 flex items-center gap-2 cursor-pointer">
        <Image src="/upload.png" alt="" width={28} height={28} />
        <span>Upload a photo</span>
      </label>
      <input
        type="file"
        accept="image/*"
        onChange={handleFileChange}
        className="hidden"
        id="imageUpload"
      />
      <label htmlFor="imageUpload" className="cursor-pointer">
        {preview ? (
          <div className="relative w-24 h-24">
            <Image
              src={preview}
              alt="Preview"
              fill
              className="object-cover rounded-full"
            />
          </div>
        ) : (
          <div className="w-24 h-24 bg-gray-200 rounded-full flex items-center justify-center">
            <span className="text-gray-400">No image</span>
          </div>
        )}
      </label>
    </div>
  );
}

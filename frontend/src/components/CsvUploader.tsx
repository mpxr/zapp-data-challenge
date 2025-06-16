import React, { useState } from "react";
import type { ChangeEvent } from "react";

type CsvRow = Record<string, string | number>;

interface CsvUploaderProps {
  onUploadSuccess: () => void;
}

const CsvUploader: React.FC<CsvUploaderProps> = ({ onUploadSuccess }) => {
  const [file, setFile] = useState<File | null>(null);
  const [message, setMessage] = useState<string>("");

  const handleFileChange = (event: ChangeEvent<HTMLInputElement>) => {
    if (event.target.files && event.target.files[0]) {
      setFile(event.target.files[0]);
      setMessage("");
    } else {
      setFile(null);
    }
  };

  const parseCSV = (csvText: string): CsvRow[] => {
    const lines = csvText.trim().split("\n");
    if (lines.length < 2) {
      throw new Error("CSV must have a header row and at least one data row.");
    }
    const headers = lines[0].split(",").map((header) => header.trim());
    const dataRows = lines.slice(1);

    return dataRows.map((line) => {
      const values = line.split(",").map((value) => value.trim());
      const entry: CsvRow = {};
      headers.forEach((header, index) => {
        const value = values[index];
        entry[header] =
          !isNaN(Number(value)) && value !== "" ? Number(value) : value;
      });
      return entry;
    });
  };

  const handleUpload = async () => {
    if (!file) {
      setMessage("Please select a CSV file first.");
      return;
    }

    setMessage(`Selected file: ${file.name}`);
    console.log("Uploading file:", file);

    const reader = new FileReader();
    reader.onload = async (e) => {
      const text = e.target?.result as string;
      if (!text) {
        setMessage("Failed to read file content.");
        return;
      }
      try {
        const jsonData = parseCSV(text);
        console.log("Parsed JSON data:", jsonData);

        const response = await fetch("/api/items", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(jsonData),
        });

        if (response.ok) {
          setMessage(`File uploaded successfully!`);
          setFile(null);
          const fileInput = document.getElementById(
            "csv-file-input"
          ) as HTMLInputElement;
          if (fileInput) {
            fileInput.value = "";
          }
          onUploadSuccess();
        } else {
          const errorText = await response.text();
          setMessage(
            `Upload failed. Server responded with ${response.status}: ${errorText}`
          );
        }
      } catch (error) {
        console.error("Error processing or uploading file:", error);
        setMessage(
          `Error: ${
            error instanceof Error ? error.message : "An unknown error occurred"
          }`
        );
      }
    };
    reader.onerror = () => {
      setMessage("Failed to read file.");
      console.error("FileReader error");
    };
    reader.readAsText(file);
  };

  return (
    <div>
      <h2>Upload Stock Items CSV</h2>
      <input
        type="file"
        id="csv-file-input"
        accept=".csv"
        onChange={handleFileChange}
      />
      <button onClick={handleUpload} disabled={!file}>
        Upload CSV
      </button>
      {message && <p>{message}</p>}
    </div>
  );
};

export default CsvUploader;

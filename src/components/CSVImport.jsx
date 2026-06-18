import { useState, useRef } from 'react';
import Papa from 'papaparse';
import { HiOutlineArrowUpTray } from 'react-icons/hi2';

export default function CSVImport({ onImport, expectedColumns = [], title = 'Import CSV' }) {
  const [state, setState] = useState('idle'); // 'idle' | 'preview'
  const [parsed, setParsed] = useState([]);
  const [headers, setHeaders] = useState([]);
  const [error, setError] = useState('');
  const [dragover, setDragover] = useState(false);
  const fileRef = useRef(null);

  const handleFile = (file) => {
    if (!file) return;
    setError('');
    Papa.parse(file, {
      header: true,
      skipEmptyLines: true,
      complete: (results) => {
        if (results.errors.length > 0) {
          setError('CSV parsing error: ' + results.errors[0].message);
          return;
        }
        if (results.data.length === 0) {
          setError('CSV file is empty.');
          return;
        }
        setHeaders(results.meta.fields || []);
        setParsed(results.data);
        setState('preview');
      },
      error: (err) => {
        setError('Failed to parse CSV: ' + err.message);
      },
    });
  };

  const handleDrop = (e) => {
    e.preventDefault();
    setDragover(false);
    const file = e.dataTransfer.files[0];
    if (file && file.name.endsWith('.csv')) {
      handleFile(file);
    } else {
      setError('Please drop a .csv file');
    }
  };

  const handleConfirm = () => {
    // Map parsed data to expected column keys
    const mapped = parsed.map((row) => {
      const obj = {};
      expectedColumns.forEach((col) => {
        // Try exact match first, then case-insensitive
        const matchedKey = headers.find(
          (h) => h === col.key || h === col.label
        ) || headers.find(
          (h) => h.toLowerCase() === col.key.toLowerCase() || h.toLowerCase() === col.label.toLowerCase()
        );
        obj[col.key] = matchedKey ? row[matchedKey] : '';
      });
      return obj;
    });
    onImport(mapped);
    setState('idle');
    setParsed([]);
    setHeaders([]);
  };

  const handleCancel = () => {
    setState('idle');
    setParsed([]);
    setHeaders([]);
    setError('');
  };

  if (state === 'preview') {
    const previewRows = parsed.slice(0, 5);
    return (
      <div className="csv-preview animate-fade-in">
        <div className="csv-preview-header">
          <h3>{parsed.length} rows parsed</h3>
          <div className="flex gap-8">
            <button className="btn btn-secondary btn-sm" onClick={handleCancel}>
              Cancel
            </button>
            <button className="btn btn-primary btn-sm" onClick={handleConfirm}>
              Confirm Import ({parsed.length} rows)
            </button>
          </div>
        </div>

        <div className="mb-16">
          <h4 className="mb-8">Column Mapping</h4>
          <div className="flex gap-8" style={{ flexWrap: 'wrap' }}>
            {expectedColumns.map((col) => {
              const found = headers.some(
                (h) =>
                  h === col.key ||
                  h === col.label ||
                  h.toLowerCase() === col.key.toLowerCase() ||
                  h.toLowerCase() === col.label.toLowerCase()
              );
              return (
                <span
                  key={col.key}
                  className={`badge ${found ? 'badge-success' : col.required ? 'badge-danger' : 'badge-warning'}`}
                >
                  {col.label}: {found ? '✓ Matched' : col.required ? '✗ Missing' : '– Optional'}
                </span>
              );
            })}
          </div>
        </div>

        <div className="data-table-container">
          <div style={{ overflowX: 'auto' }}>
            <table className="data-table">
              <thead>
                <tr>
                  {headers.map((h) => (
                    <th key={h}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {previewRows.map((row, i) => (
                  <tr key={i}>
                    {headers.map((h) => (
                      <td key={h}>{row[h]}</td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          {parsed.length > 5 && (
            <div className="table-pagination">
              <span className="text-muted">
                Showing 5 of {parsed.length} rows (preview)
              </span>
            </div>
          )}
        </div>
      </div>
    );
  }

  return (
    <div>
      {title && <h3 className="mb-16">{title}</h3>}
      <div
        className={`csv-dropzone ${dragover ? 'dragover' : ''}`}
        onClick={() => fileRef.current?.click()}
        onDragOver={(e) => { e.preventDefault(); setDragover(true); }}
        onDragLeave={() => setDragover(false)}
        onDrop={handleDrop}
      >
        <div className="csv-dropzone-icon">
          <HiOutlineArrowUpTray />
        </div>
        <h3>Drop CSV file here or click to browse</h3>
        <p className="text-muted mt-4">
          Export student data from ERP as CSV and import here
        </p>
        <input
          ref={fileRef}
          type="file"
          accept=".csv"
          style={{ display: 'none' }}
          onChange={(e) => handleFile(e.target.files[0])}
        />
      </div>
      {error && <p className="text-danger mt-8">{error}</p>}
    </div>
  );
}

import React, { useState, useEffect, useRef } from 'react';
import { marked } from 'marked';
import DOMPurify from 'dompurify';
import './App.css';
import Alert from './components/Alert';
import ContinuousTabs from './components/ContinuousTabs';
import ShufflePinnedList from './components/ShufflePinnedList';
import Landing from './components/Landing';

const SAMPLE_PRESETS = [
  {
    code: 'HTTP-404',
    name: 'Sample 1: Route Error',
    file: '/samples/sample1_404.png',
    context: 'Navigated to billing settings; received 404 route error from API cluster.',
  },
  {
    code: 'CRASH-ERR',
    name: 'Sample 2: TypeError Crash',
    file: '/samples/sample2_crash.png',
    context: 'Opened cart drawer while browsing products; page crashed with undefined items error.',
  },
  {
    code: 'UI-COLLISION',
    name: 'Sample 3: Button Overlap',
    file: '/samples/sample3_overlap.png',
    context: 'Viewed cart on mobile; the Checkout button is overlapping the Empty Cart button.',
  },
  {
    code: 'SECRET-LEAK',
    name: 'Sample 4: Exposed API Key',
    file: '/samples/sample4_secret.png',
    context: 'Screenshot of a settings page; I think a key is visible.',
  },
  {
    code: 'CI-FAIL',
    name: 'Sample 5: CI Pipeline Failure',
    file: '/samples/sample5_ci.png',
    context: 'GitHub Actions run failed after my latest commit.',
  },
  {
    code: 'CONSOLE-ERR',
    name: 'Sample 6: Console Error',
    file: '/samples/sample6_console.png',
    context: 'Page loads blank; console shows a red error.',
  },
  {
    code: 'FORM-VALID',
    name: 'Sample 7: Form Validation Bug',
    file: '/samples/sample7_form.png',
    context: 'Submitted the signup form with a valid email but got an invalid error.',
  },
];

const CONTEXT_QUICK_CHIPS = [
  'On page load',
  'After clicking a button',
  'Only on mobile',
  'Started after an update',
  'Happens intermittently',
];

const SEVERITY_OPTIONS = [
  'Low (Suggested)',
  'Medium (Suggested)',
  'High (Suggested)',
  'Critical (Suggested)',
];

const CATEGORY_OPTIONS = [
  'UI/Layout (Suggested)',
  'Functional (Suggested)',
  'Crash/Exception (Suggested)',
  'Network/API (Suggested)',
  'Performance (Suggested)',
];

const STORAGE_KEY = 'bugsnap_draft_history';

function loadStoredDrafts() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

function saveDraftToStorage(draftToSave) {
  try {
    const current = loadStoredDrafts();
    const newEntry = {
      id: 'draft_' + Date.now(),
      savedAt: new Date().toLocaleTimeString([], {
        hour: '2-digit',
        minute: '2-digit',
        month: 'short',
        day: 'numeric',
      }),
      title: draftToSave.title || 'Untitled Bug Draft',
      severity: draftToSave.suggested_severity || 'Medium (Suggested)',
      category: draftToSave.suggested_category || 'Functional (Suggested)',
      draft: draftToSave,
    };
    const deduped = [newEntry, ...current.filter((c) => c.draft?.title !== draftToSave.title)].slice(0, 15);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(deduped));
    return deduped;
  } catch {
    return [];
  }
}

function removeDraftFromStorage(id) {
  try {
    const current = loadStoredDrafts();
    const updated = current.filter((c) => c.id !== id);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
    return updated;
  } catch {
    return [];
  }
}

function clearAllDraftsFromStorage() {
  try {
    localStorage.removeItem(STORAGE_KEY);
  } catch {
    // Ignore storage issues
  }
}

function drawArrow(ctx, fromX, fromY, toX, toY, color = '#f43f5e', lineWidth = 4) {
  const headLen = Math.max(14, lineWidth * 3.5);
  const angle = Math.atan2(toY - fromY, toX - fromX);
  ctx.save();
  ctx.strokeStyle = color;
  ctx.fillStyle = color;
  ctx.lineWidth = lineWidth;
  ctx.lineCap = 'round';
  ctx.lineJoin = 'round';

  ctx.beginPath();
  ctx.moveTo(fromX, fromY);
  ctx.lineTo(toX, toY);
  ctx.stroke();

  ctx.beginPath();
  ctx.moveTo(toX, toY);
  ctx.lineTo(toX - headLen * Math.cos(angle - Math.PI / 6), toY - headLen * Math.sin(angle - Math.PI / 6));
  ctx.lineTo(toX - headLen * Math.cos(angle + Math.PI / 6), toY - headLen * Math.sin(angle + Math.PI / 6));
  ctx.closePath();
  ctx.fill();
  ctx.restore();
}

function drawRectangle(ctx, x1, y1, x2, y2, color = '#f43f5e', lineWidth = 4) {
  const x = Math.min(x1, x2);
  const y = Math.min(y1, y2);
  const w = Math.abs(x2 - x1);
  const h = Math.abs(y2 - y1);
  if (w < 2 || h < 2) return;
  ctx.save();
  ctx.strokeStyle = color;
  ctx.lineWidth = lineWidth;
  ctx.strokeRect(x, y, w, h);
  ctx.fillStyle = 'rgba(244, 63, 94, 0.12)';
  ctx.fillRect(x, y, w, h);
  ctx.restore();
}

function applyPixelate(ctx, x1, y1, x2, y2, pixelSize = 10) {
  const x = Math.floor(Math.min(x1, x2));
  const y = Math.floor(Math.min(y1, y2));
  const w = Math.floor(Math.abs(x2 - x1));
  const h = Math.floor(Math.abs(y2 - y1));
  if (w <= 4 || h <= 4) return;

  const offCanvas = document.createElement('canvas');
  const scaledW = Math.max(1, Math.floor(w / pixelSize));
  const scaledH = Math.max(1, Math.floor(h / pixelSize));
  offCanvas.width = scaledW;
  offCanvas.height = scaledH;
  const offCtx = offCanvas.getContext('2d');
  if (!offCtx) return;

  offCtx.drawImage(ctx.canvas, x, y, w, h, 0, 0, scaledW, scaledH);

  ctx.save();
  ctx.imageSmoothingEnabled = false;
  ctx.drawImage(offCanvas, 0, 0, scaledW, scaledH, x, y, w, h);
  ctx.restore();
}

function resolveEnvironment(env) {
  if (typeof env === 'string' && env.trim() && env.trim().toLowerCase() !== 'unknown') {
    return env;
  }
  const nav = typeof navigator !== 'undefined' ? navigator : {};
  const win = typeof window !== 'undefined' ? window : {};
  const ua = nav.userAgent || 'Unknown UserAgent';
  const platform = nav.userAgentData?.platform || nav.platform || 'Unknown Platform';
  const screenSize = win.screen ? `${win.screen.width}x${win.screen.height}` : 'Unknown Screen';
  return `Reporter browser (auto-detected): Platform: ${platform}, Screen: ${screenSize}, User-Agent: ${ua}`;
}

export default function App() {
  const [images, setImages] = useState([]);
  const [activeImageIndex, setActiveImageIndex] = useState(0);
  const [analyzingStep, setAnalyzingStep] = useState(null);
  const [annotatingIndex, setAnnotatingIndex] = useState(null);
  const [activeTool, setActiveTool] = useState('arrow'); // 'arrow' | 'rectangle' | 'blur'
  const [canUndo, setCanUndo] = useState(false);
  const [context, setContext] = useState('');
  const [isDragActive, setIsDragActive] = useState(false);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [beginnerMode, setBeginnerMode] = useState(false);
  const [elapsedSeconds, setElapsedSeconds] = useState(0);
  const [lastRunTime, setLastRunTime] = useState(null);
  const [isOnline, setIsOnline] = useState(typeof navigator !== 'undefined' ? (navigator.onLine ?? true) : true);
  const [alertInfo, setAlertInfo] = useState(null);
  const [health, setHealth] = useState(null);
  const [draft, setDraft] = useState(null);
  const [viewMode, setViewMode] = useState('editor'); // 'editor' | 'preview' | 'raw'
  const [copied, setCopied] = useState(false);
  const [draftHistory, setDraftHistory] = useState([]);
  const [showHistory, setShowHistory] = useState(false);
  const [showLanding, setShowLanding] = useState(true);

  const fileInputRef = useRef(null);
  const currentImage = images[activeImageIndex] || images[0] || null;
  const selectedFile = currentImage?.file || null;
  const previewUrl = currentImage?.previewUrl || null;
  const fileDetails = currentImage?.details || null;

  const canvasRef = useRef(null);
  const baseImageRef = useRef(null);
  const historyStackRef = useRef([]);
  const isDrawingRef = useRef(false);
  const startPosRef = useRef({ x: 0, y: 0 });
  const snapshotRef = useRef(null);

  // Initialize canvas when modal opens
  useEffect(() => {
    if (annotatingIndex === null) {
      historyStackRef.current = [];
      baseImageRef.current = null;
      setCanUndo(false);
      return;
    }

    const currentImg = images[annotatingIndex];
    if (!currentImg?.previewUrl) return;

    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => {
      baseImageRef.current = img;
      const canvas = canvasRef.current;
      if (!canvas) return;
      canvas.width = img.naturalWidth;
      canvas.height = img.naturalHeight;
      const ctx = canvas.getContext('2d');
      if (!ctx) return;
      ctx.drawImage(img, 0, 0);
      const initialData = ctx.getImageData(0, 0, canvas.width, canvas.height);
      historyStackRef.current = [initialData];
      setCanUndo(false);
    };
    img.src = currentImg.previewUrl;
  }, [annotatingIndex]);

  const getCanvasCoords = (e) => {
    const canvas = canvasRef.current;
    if (!canvas) return { x: 0, y: 0 };
    const rect = canvas.getBoundingClientRect();
    const scaleX = canvas.width / rect.width;
    const scaleY = canvas.height / rect.height;
    return {
      x: (e.clientX - rect.left) * scaleX,
      y: (e.clientY - rect.top) * scaleY,
    };
  };

  const handleCanvasMouseDown = (e) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const coords = getCanvasCoords(e);
    startPosRef.current = coords;
    isDrawingRef.current = true;
    snapshotRef.current = ctx.getImageData(0, 0, canvas.width, canvas.height);
  };

  const handleCanvasMouseMove = (e) => {
    if (!isDrawingRef.current || !snapshotRef.current) return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    ctx.putImageData(snapshotRef.current, 0, 0);
    const coords = getCanvasCoords(e);
    const start = startPosRef.current;
    const strokeWidth = Math.max(3, Math.round(canvas.width / 320));

    if (activeTool === 'arrow') {
      drawArrow(ctx, start.x, start.y, coords.x, coords.y, '#f43f5e', strokeWidth);
    } else if (activeTool === 'rectangle') {
      drawRectangle(ctx, start.x, start.y, coords.x, coords.y, '#f43f5e', strokeWidth);
    } else if (activeTool === 'blur') {
      const x = Math.min(start.x, coords.x);
      const y = Math.min(start.y, coords.y);
      const w = Math.abs(coords.x - start.x);
      const h = Math.abs(coords.y - start.y);
      ctx.save();
      ctx.setLineDash([6, 6]);
      ctx.strokeStyle = '#8b70e6';
      ctx.lineWidth = Math.max(2, Math.round(canvas.width / 400));
      ctx.strokeRect(x, y, w, h);
      ctx.fillStyle = 'rgba(139, 112, 230, 0.2)';
      ctx.fillRect(x, y, w, h);
      ctx.restore();
    }
  };

  const handleCanvasMouseUp = (e) => {
    if (!isDrawingRef.current || !snapshotRef.current) return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const coords = getCanvasCoords(e);
    const start = startPosRef.current;

    ctx.putImageData(snapshotRef.current, 0, 0);
    const strokeWidth = Math.max(3, Math.round(canvas.width / 320));
    const dist = Math.hypot(coords.x - start.x, coords.y - start.y);

    if (dist >= 3) {
      if (activeTool === 'arrow') {
        drawArrow(ctx, start.x, start.y, coords.x, coords.y, '#f43f5e', strokeWidth);
      } else if (activeTool === 'rectangle') {
        drawRectangle(ctx, start.x, start.y, coords.x, coords.y, '#f43f5e', strokeWidth);
      } else if (activeTool === 'blur') {
        applyPixelate(ctx, start.x, start.y, coords.x, coords.y, Math.max(8, Math.round(canvas.width / 120)));
      }

      const finalState = ctx.getImageData(0, 0, canvas.width, canvas.height);
      historyStackRef.current.push(finalState);
      if (historyStackRef.current.length > 25) {
        historyStackRef.current.shift();
      }
      setCanUndo(historyStackRef.current.length > 1);
    }

    isDrawingRef.current = false;
    snapshotRef.current = null;
  };

  const handleUndo = () => {
    const canvas = canvasRef.current;
    if (!canvas || historyStackRef.current.length <= 1) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    historyStackRef.current.pop();
    const prev = historyStackRef.current[historyStackRef.current.length - 1];
    ctx.putImageData(prev, 0, 0);
    setCanUndo(historyStackRef.current.length > 1);
  };

  const handleClearCanvas = () => {
    const canvas = canvasRef.current;
    if (!canvas || !baseImageRef.current) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    ctx.drawImage(baseImageRef.current, 0, 0);
    const resetState = ctx.getImageData(0, 0, canvas.width, canvas.height);
    historyStackRef.current = [resetState];
    setCanUndo(false);
  };

  const handleSaveAnnotation = () => {
    const canvas = canvasRef.current;
    if (!canvas || annotatingIndex === null) return;

    canvas.toBlob((blob) => {
      if (!blob) return;
      const targetImg = images[annotatingIndex];
      if (!targetImg) return;

      const originalName = targetImg.details?.name || targetImg.file.name || 'screenshot.png';
      const safeBaseName = originalName.replace(/\.[^/.]+$/, '').replace(/-annotated$/, '');
      const newFileName = `${safeBaseName}-annotated.png`;
      const newFile = new File([blob], newFileName, { type: 'image/png' });
      const newPreviewUrl = URL.createObjectURL(blob);

      setImages((prev) => {
        return prev.map((item, idx) => {
          if (idx !== annotatingIndex) return item;
          return {
            ...item,
            originalFile: item.originalFile || item.file,
            originalPreviewUrl: item.originalPreviewUrl || item.previewUrl,
            originalDetails: item.originalDetails || item.details,
            file: newFile,
            previewUrl: newPreviewUrl,
            details: {
              name: newFileName,
              size: (blob.size / 1024).toFixed(1) + ' KB',
              dimensions: `${canvas.width} × ${canvas.height}px`,
              type: 'PNG',
            },
          };
        });
      });

      setAlertInfo({
        variant: 'success',
        title: 'Annotation Saved',
        message: "Replaced image with annotated screenshot. Note: GitHub can't attach images via API; drag the downloaded image in manually.",
        autoCloseMs: 6500,
      });

      setAnnotatingIndex(null);
    }, 'image/png');
  };

  const handleDownloadAnnotation = () => {
    const canvas = canvasRef.current;
    if (!canvas || annotatingIndex === null) return;
    const targetImg = images[annotatingIndex];
    const originalName = targetImg?.details?.name || targetImg?.file?.name || 'screenshot.png';
    const baseName = originalName.replace(/\.[^/.]+$/, '').replace(/-annotated$/, '');
    const link = document.createElement('a');
    link.download = `${baseName}-annotated.png`;
    link.href = canvas.toDataURL('image/png');
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    setAlertInfo({
      variant: 'info',
      title: 'Screenshot Exported',
      message: "Downloaded annotated PNG. Note: GitHub can't attach images via API; drag the downloaded image in manually.",
      autoCloseMs: 5000,
    });
  };

  const handleRevertAnnotation = (indexToRevert) => {
    setImages((prev) => {
      return prev.map((item, idx) => {
        if (idx !== indexToRevert || !item.originalFile) return item;
        if (item.previewUrl && item.previewUrl !== item.originalPreviewUrl) {
          try {
            URL.revokeObjectURL(item.previewUrl);
          } catch {}
        }
        return {
          ...item,
          file: item.originalFile,
          previewUrl: item.originalPreviewUrl,
          details: item.originalDetails || item.details,
          originalFile: undefined,
          originalPreviewUrl: undefined,
          originalDetails: undefined,
        };
      });
    });
    setAlertInfo({
      variant: 'info',
      title: 'Annotations Reverted',
      message: 'Restored original screenshot.',
      autoCloseMs: 3500,
    });
  };

  // Online / Offline network listeners
  useEffect(() => {
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);
    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  // Live timer for elapsed inference seconds
  useEffect(() => {
    if (!isAnalyzing) {
      setElapsedSeconds(0);
      return;
    }
    const startTime = Date.now();
    const timer = setInterval(() => {
      setElapsedSeconds((Date.now() - startTime) / 1000);
    }, 100);
    return () => clearInterval(timer);
  }, [isAnalyzing]);

  const checkHealth = async (options = {}) => {
    const isSilent = options?.silent === true;
    try {
      const res = await fetch('/health');
      if (res.ok) {
        const data = await res.json();
        setHealth(data);
        if (!isSilent && data.status !== 'ok') {
          if (!data.ollama_reachable) {
            setAlertInfo({
              variant: 'error',
              title: 'Ollama Unreachable',
              message: "Could not connect to Ollama at http://127.0.0.1:11434. Ensure Ollama is running ('ollama serve').",
              action: (
                <button type="button" className="alert-action-btn" onClick={() => checkHealth()}>
                  Retry Connection
                </button>
              ),
            });
          } else if (!data.model_available) {
            setAlertInfo({
              variant: 'warning',
              title: 'Model Not Found',
              message: `Target model '${data.target_model}' is not present in local Ollama. Run 'ollama pull ${data.target_model}' in your terminal.`,
              action: (
                <button type="button" className="alert-action-btn" onClick={() => checkHealth()}>
                  Re-check Models
                </button>
              ),
            });
          }
        }
      } else {
        setHealth({ status: 'degraded', message: 'Backend returned an error' });
      }
    } catch {
      setHealth({ status: 'degraded', message: 'Could not connect to backend server on :8000' });
      if (!isSilent) {
        setAlertInfo({
          variant: 'error',
          title: 'Backend Offline',
          message: 'Could not connect to FastAPI backend on port 8000. Start it with uvicorn app:app --port 8000.',
          action: (
            <button type="button" className="alert-action-btn" onClick={() => checkHealth()}>
              Retry Backend
            </button>
          ),
        });
      }
    }
  };

  const processFiles = (incomingFiles) => {
    setAlertInfo(null);
    if (!incomingFiles || incomingFiles.length === 0) return;

    const validTypes = ['image/png', 'image/jpeg', 'image/webp'];
    const remainingSlots = 4 - images.length;

    if (remainingSlots <= 0) {
      setAlertInfo({
        variant: 'warning',
        title: 'Maximum Limit Reached',
        message: 'You have reached the maximum limit of 4 screenshots. Remove one to add another.',
        autoCloseMs: 4000,
      });
      return;
    }

    let filesToAdd = Array.from(incomingFiles);
    if (filesToAdd.length > remainingSlots) {
      setAlertInfo({
        variant: 'warning',
        title: 'Maximum 4 Screenshots',
        message: `BugSnap accepts up to 4 screenshots. Kept the first ${remainingSlots} image(s).`,
        autoCloseMs: 4500,
      });
      filesToAdd = filesToAdd.slice(0, remainingSlots);
    }

    filesToAdd.forEach((file) => {
      if (!validTypes.includes(file.type)) {
        setAlertInfo({
          variant: 'error',
          title: 'Upload Validation: Unsupported Format',
          message: `File '${file.name}' format '${file.type || 'unknown'}' is not supported. Please upload a PNG, JPEG, or WebP screenshot.`,
        });
        return;
      }

      if (file.size > 10 * 1024 * 1024) {
        setAlertInfo({
          variant: 'warning',
          title: 'Upload Validation: File Limit Exceeded',
          message: `File '${file.name}' is ${(file.size / (1024 * 1024)).toFixed(1)} MB. The maximum supported upload limit is 10 MB.`,
        });
        return;
      }

      const objectUrl = URL.createObjectURL(file);
      const img = new Image();
      img.onload = () => {
        if (img.width < 10 || img.height < 10) {
          setAlertInfo({
            variant: 'warning',
            title: 'Upload Validation: Dimensions Too Small',
            message: `Image '${file.name}' dimensions (${img.width}×${img.height}px) are too small to be a valid bug screenshot.`,
          });
          URL.revokeObjectURL(objectUrl);
          return;
        }

        const newEntry = {
          id: 'img_' + Math.random().toString(36).slice(2, 9) + '_' + Date.now(),
          file,
          previewUrl: objectUrl,
          details: {
            name: file.name,
            size: (file.size / 1024).toFixed(1) + ' KB',
            dimensions: `${img.width} × ${img.height}px`,
            type: file.type.replace('image/', '').toUpperCase(),
          },
        };

        setImages((prev) => {
          if (prev.length >= 4) {
            URL.revokeObjectURL(objectUrl);
            return prev;
          }
          return [...prev, newEntry];
        });
      };
      img.onerror = () => {
        URL.revokeObjectURL(objectUrl);
      };
      img.src = objectUrl;
    });
  };

  const processFile = (file) => {
    if (file) processFiles([file]);
  };

  const removeImage = (indexToRemove) => {
    setImages((prev) => {
      const target = prev[indexToRemove];
      if (target?.previewUrl) {
        try {
          URL.revokeObjectURL(target.previewUrl);
        } catch {}
      }
      return prev.filter((_, i) => i !== indexToRemove);
    });
    setActiveImageIndex((prevIndex) => {
      if (prevIndex >= indexToRemove && prevIndex > 0) {
        return prevIndex - 1;
      }
      return 0;
    });
  };

  const moveImageLeft = (index) => {
    if (index <= 0) return;
    setImages((prev) => {
      if (index >= prev.length) return prev;
      const copy = [...prev];
      const temp = copy[index - 1];
      copy[index - 1] = copy[index];
      copy[index] = temp;
      return copy;
    });
    setActiveImageIndex((prev) => {
      if (prev === index) return index - 1;
      if (prev === index - 1) return index;
      return prev;
    });
  };

  const moveImageRight = (index) => {
    setImages((prev) => {
      if (index >= prev.length - 1) return prev;
      const copy = [...prev];
      const temp = copy[index + 1];
      copy[index + 1] = copy[index];
      copy[index] = temp;
      return copy;
    });
    setActiveImageIndex((prev) => {
      if (prev === index) return index + 1;
      if (prev === index + 1) return index;
      return prev;
    });
  };

  // Health check on mount, load history, and 10-second silent polling interval
  useEffect(() => {
    checkHealth();
    setDraftHistory(loadStoredDrafts());
    const pollTimer = setInterval(() => {
      checkHealth({ silent: true });
    }, 10000);
    return () => clearInterval(pollTimer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Listen for clipboard image paste (Ctrl+V)
  useEffect(() => {
    const handlePaste = (e) => {
      const activeTag = document.activeElement?.tagName?.toLowerCase();
      if (activeTag === 'textarea' || activeTag === 'input') {
        return;
      }

      const items = e.clipboardData?.items;
      if (!items || items.length === 0) return;

      const pastedFiles = [];
      for (let i = 0; i < items.length; i++) {
        if (items[i].type && items[i].type.indexOf('image') !== -1) {
          const file = items[i].getAsFile();
          if (file) {
            pastedFiles.push(file);
          }
        }
      }

      if (pastedFiles.length > 0) {
        processFiles(pastedFiles);
        setAlertInfo({
          variant: 'info',
          title: 'Screenshot Ingested',
          message: `Captured ${pastedFiles.length} image(s) from clipboard.`,
          autoCloseMs: 3500,
        });
      } else {
        setAlertInfo({
          variant: 'info',
          title: 'No Image in Clipboard',
          message: 'Clipboard contains non-image data. Copy a screenshot (e.g. Snipping Tool) or drag and drop an image file here.',
          autoCloseMs: 4000,
        });
      }
    };

    window.addEventListener('paste', handlePaste);
    return () => window.removeEventListener('paste', handlePaste);
  }, [images.length]);

  const handleDrop = (e) => {
    e.preventDefault();
    setIsDragActive(false);
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      processFiles(Array.from(e.dataTransfer.files));
    }
  };

  const loadSample = async (preset) => {
    try {
      setAlertInfo(null);
      const res = await fetch(preset.file);
      const blob = await res.blob();
      const file = new File([blob], preset.file.split('/').pop(), { type: 'image/png' });
      images.forEach((img) => {
        if (img.previewUrl) {
          try {
            URL.revokeObjectURL(img.previewUrl);
          } catch {}
        }
      });
      setImages([]);
      setActiveImageIndex(0);
      processFiles([file]);
      setContext(preset.context);
    } catch (err) {
      setAlertInfo({
        variant: 'error',
        title: 'Sample Load Failed',
        message: 'Could not load benchmark sample: ' + err.message,
      });
    }
  };

  const handleQuickFillChip = (chipText) => {
    setContext((prev) => {
      const trimmed = (prev || '').trim();
      if (!trimmed) {
        return chipText.slice(0, 500);
      }
      const separator = /[.;,]$/.test(trimmed) ? ' ' : '; ';
      const nextText = `${trimmed}${separator}${chipText}`;
      return nextText.slice(0, 500);
    });
  };

  const buildMarkdownFromDraft = (d) => {
    const steps = (d.steps_to_reproduce || []).map((s, i) => `${i + 1}. ${s}`).join('\n') || '1. Unknown - exact reproduction steps not supplied';
    const evidence = (d.visible_evidence || []).map((e) => `- ${e}`).join('\n') || '- No explicit text/evidence extracted.';
    const hypotheses = (d.hypotheses || []).map((h) => `- ${h}`).join('\n') || '- None formulated.';
    const fixHints = (d.fix_hints || []).map((h) => `- ${h}`).join('\n') || '- None formulated.';
    const missing = (d.missing_information || []).map((m) => `- ${m}`).join('\n') || '- None identified.';
    const contextSection = d.user_context ? `## Reporter Context\n${d.user_context}\n\n` : '';
    const beginnerSection = d.beginner_notes ? `## Contributor Notes (Good First Issue)\n${d.beginner_notes}\n\n` : '';
    const sev = d.suggested_severity || 'Medium (Suggested)';
    const cat = d.suggested_category || 'Functional (Suggested)';
    const actual = d.actual_behavior || '';
    const expected = d.expected_behavior || '';
    const env = resolveEnvironment(d.environment);

    return (
      `# ${d.title || '[Bug]: Screenshot Issue Draft'}\n\n` +
      `> **Suggested Severity:** ${sev} | **Suggested Category:** ${cat}\n` +
      `> *(Note: Severity and Category are automated model suggestions requiring maintainer triage.)*\n\n` +
      `## Summary\n${d.summary || ''}\n\n` +
      `## Visible Evidence (Directly Observed)\n${evidence}\n\n` +
      contextSection +
      beginnerSection +
      `## Actual Behavior (Observed)\n${actual}\n\n` +
      `## Expected Behavior\n${expected}\n\n` +
      `## Suggested Reproduction Steps (Requires Verification)\n${steps}\n\n` +
      `## Environment\n${env}\n\n` +
      `## Hypotheses (Unverified Possible Causes)\n${hypotheses}\n\n` +
      `## Suggested Fix Hints (Unverified)\n${fixHints}\n\n` +
      `## Missing Information / Follow-up Questions\n${missing}\n\n` +
      `---\n` +
      `> **Note:** Drafted locally by BugSnap AI using Gemma 4 E2B. Screenshot analysis is an unverified draft, not proof that the bug has been confirmed or reproduced.\n`
    );
  };

  const handleAnalyze = async () => {
    if (images.length === 0) return;

    setIsAnalyzing(true);
    setAlertInfo(null);
    const analysisStartTimestamp = Date.now();
    const totalImages = images.length;
    const successfulDrafts = [];
    const failedNames = [];
    let hadRetry = false;

    try {
      for (let i = 0; i < totalImages; i++) {
        const currentItem = images[i];
        const stepNum = i + 1;
        setAnalyzingStep({ current: stepNum, total: totalImages });

        try {
          const formData = new FormData();
          formData.append('file', currentItem.file);
          if (context && context.trim()) {
            formData.append('context', context.trim());
          }
          formData.append('mode', beginnerMode ? 'beginner' : 'standard');

          const res = await fetch('/analyze', {
            method: 'POST',
            body: formData,
          });

          const data = await res.json();
          if (!res.ok) {
            const errorMsg = data.detail || `HTTP ${res.status}`;
            failedNames.push(`${currentItem.details?.name || currentItem.file.name || `Screenshot ${stepNum}`} (${errorMsg})`);
            continue;
          }

          if (data.retried) {
            hadRetry = true;
          }

          successfulDrafts.push({
            draft: data.draft,
            index: stepNum,
            name: currentItem.details?.name || currentItem.file.name || `Screenshot ${stepNum}`,
          });
        } catch (itemErr) {
          failedNames.push(`${currentItem.details?.name || currentItem.file.name || `Screenshot ${stepNum}`} (${itemErr.message || 'Network error'})`);
        }
      }

      if (successfulDrafts.length === 0) {
        setAlertInfo({
          variant: 'error',
          title: 'Analysis Failed',
          message: `Failed to analyze: ${failedNames.join(', ')}. Please verify backend connection and retry.`,
          action: (
            <button type="button" className="alert-action-btn" onClick={handleAnalyze}>
              Retry Analysis
            </button>
          ),
        });
        return;
      }

      if (failedNames.length > 0) {
        setAlertInfo({
          variant: 'warning',
          title: 'Analysis Warning',
          message: `Failed to analyze ${failedNames.join(', ')}. Continuing with remaining ${successfulDrafts.length} screenshot(s).`,
          autoCloseMs: 8000,
        });
      }

      const duration = ((Date.now() - analysisStartTimestamp) / 1000).toFixed(1);
      setLastRunTime(duration);

      // Single-image behavior must stay unchanged
      if (totalImages === 1 && successfulDrafts.length === 1 && failedNames.length === 0) {
        const singleDraft = { ...successfulDrafts[0].draft };
        if (!singleDraft.environment || singleDraft.environment.trim().toLowerCase() === 'unknown') {
          singleDraft.environment = resolveEnvironment(singleDraft.environment);
          singleDraft.markdown_draft = buildMarkdownFromDraft(singleDraft);
        }
        setDraft(singleDraft);
        setViewMode('editor');
        const updatedHistory = saveDraftToStorage(singleDraft);
        setDraftHistory(updatedHistory);

        if (hadRetry) {
          setAlertInfo({
            variant: 'warning',
            title: 'Model Output Retried',
            message: 'Model output was malformed, retried automatically.',
            autoCloseMs: 6000,
          });
        } else {
          setAlertInfo({
            variant: 'success',
            title: 'Issue Draft Formulated',
            message: `Gemma 4 E2B analyzed visible evidence in ${duration}s. Review, edit, and export your GitHub issue draft below.`,
            autoCloseMs: 7000,
          });
        }
        return;
      }

      // Multi-image merge rules:
      // - title, summary, expected_behavior: first draft
      // - actual_behavior: last draft
      // - steps_to_reproduce: concatenated, prefixed "(Screenshot N)", deduped
      // - visible_evidence, hypotheses, missing_information, sensitive_data: concatenated, deduped
      // - suggested_severity: highest seen
      // - beginner_notes: first non-empty
      // Regenerate markdown_draft with buildMarkdownFromDraft after merging.

      const firstDraft = successfulDrafts[0].draft;
      const lastDraft = successfulDrafts[successfulDrafts.length - 1].draft;

      const mergedSteps = [];
      successfulDrafts.forEach(({ draft: d, index }) => {
        (d.steps_to_reproduce || []).forEach((step) => {
          if (!step) return;
          const cleanStep = step.replace(/^\(Screenshot\s+\d+\)\s*/i, '').trim();
          if (cleanStep) {
            mergedSteps.push(`(Screenshot ${index}) ${cleanStep}`);
          }
        });
      });
      const dedupedSteps = Array.from(new Set(mergedSteps));

      const mergeArrayField = (fieldName) => {
        const combined = [];
        successfulDrafts.forEach(({ draft: d }) => {
          if (Array.isArray(d[fieldName])) {
            d[fieldName].forEach((val) => {
              if (typeof val === 'string' && val.trim().length > 0) {
                combined.push(val.trim());
              }
            });
          }
        });
        return Array.from(new Set(combined));
      };

      const severityRank = {
        critical: 4,
        high: 3,
        medium: 2,
        low: 1,
      };
      const getRank = (sev) => {
        if (!sev) return 0;
        const lower = String(sev).toLowerCase();
        for (const [key, rank] of Object.entries(severityRank)) {
          if (lower.includes(key)) return rank;
        }
        return 0;
      };

      let highestDraftSev = firstDraft.suggested_severity || 'Medium (Suggested)';
      let maxRank = getRank(highestDraftSev);
      successfulDrafts.forEach(({ draft: d }) => {
        const r = getRank(d.suggested_severity);
        if (r > maxRank) {
          maxRank = r;
          highestDraftSev = d.suggested_severity;
        }
      });

      let firstBeginnerNotes = null;
      for (const { draft: d } of successfulDrafts) {
        if (d.beginner_notes && d.beginner_notes.trim()) {
          firstBeginnerNotes = d.beginner_notes.trim();
          break;
        }
      }

      const mergedDraft = {
        title: firstDraft.title || '[Bug]: Multi-Image Issue Draft',
        summary: firstDraft.summary || '',
        expected_behavior: firstDraft.expected_behavior || '',
        actual_behavior: lastDraft.actual_behavior || '',
        steps_to_reproduce: dedupedSteps,
        visible_evidence: mergeArrayField('visible_evidence'),
        hypotheses: mergeArrayField('hypotheses'),
        fix_hints: mergeArrayField('fix_hints').slice(0, 3),
        missing_information: mergeArrayField('missing_information'),
        sensitive_data: mergeArrayField('sensitive_data'),
        suggested_severity: highestDraftSev,
        suggested_category: firstDraft.suggested_category || 'Functional (Suggested)',
        beginner_notes: firstBeginnerNotes,
        user_context: context?.trim() || firstDraft.user_context || '',
        environment: resolveEnvironment(firstDraft.environment || lastDraft.environment || 'Unknown'),
      };

      mergedDraft.markdown_draft = buildMarkdownFromDraft(mergedDraft);

      setDraft(mergedDraft);
      setViewMode('editor');

      const updatedHistory = saveDraftToStorage(mergedDraft);
      setDraftHistory(updatedHistory);

      if (failedNames.length === 0) {
        setAlertInfo({
          variant: 'success',
          title: 'Multi-Image Issue Draft Formulated',
          message: `Gemma 4 E2B analyzed ${successfulDrafts.length} screenshots sequentially in ${duration}s. Review and edit below.`,
          autoCloseMs: 7000,
        });
      }
    } catch (err) {
      setAlertInfo({
        variant: 'error',
        title: 'Analysis Error',
        message: err.message || 'An unexpected error occurred during multi-image analysis.',
      });
    } finally {
      setIsAnalyzing(false);
      setAnalyzingStep(null);
    }
  };

  const updateDraftField = (field, value) => {
    setDraft((prev) => {
      const updated = { ...prev, [field]: value };
      updated.markdown_draft = buildMarkdownFromDraft(updated);
      return updated;
    });
  };

  const updateArrayFieldItem = (field, index, value) => {
    setDraft((prev) => {
      const list = [...(prev[field] || [])];
      list[index] = value;
      const updated = { ...prev, [field]: list };
      updated.markdown_draft = buildMarkdownFromDraft(updated);
      return updated;
    });
  };

  const removeArrayFieldItem = (field, index) => {
    setDraft((prev) => {
      const list = (prev[field] || []).filter((_, i) => i !== index);
      const updated = { ...prev, [field]: list };
      updated.markdown_draft = buildMarkdownFromDraft(updated);
      return updated;
    });
  };

  const addArrayFieldItem = (field, defaultValue = '') => {
    setDraft((prev) => {
      const currentList = prev[field] || [];
      if (field === 'fix_hints' && currentList.length >= 3) {
        return prev;
      }
      const list = [...currentList, defaultValue];
      const updated = { ...prev, [field]: list };
      updated.markdown_draft = buildMarkdownFromDraft(updated);
      return updated;
    });
  };

  const handleCopyMarkdown = async () => {
    const textToCopy = draft?.markdown_draft || '';
    if (!textToCopy) return;
    try {
      await navigator.clipboard.writeText(textToCopy);
      setCopied(true);
      setAlertInfo({
        variant: 'success',
        title: 'Copied to Clipboard',
        message: 'GitHub issue Markdown has been copied to your clipboard.',
        autoCloseMs: 3500,
      });
      setTimeout(() => setCopied(false), 2500);
    } catch (err) {
      setAlertInfo({
        variant: 'error',
        title: 'Clipboard Write Failed',
        message: 'Could not access clipboard: ' + (err.message || 'Permission denied'),
      });
    }
  };

  const handleDownloadMarkdown = () => {
    const text = draft?.markdown_draft || '';
    if (!text) return;
    const blob = new Blob([text], { type: 'text/markdown;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    const safeTitle = (draft.title || 'bug-report').toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
    link.href = url;
    link.download = `${safeTitle || 'bug-report'}.md`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    setAlertInfo({
      variant: 'info',
      title: 'File Downloaded',
      message: `Saved ${safeTitle || 'bug-report'}.md locally.`,
      autoCloseMs: 3500,
    });
  };

  const handleClear = () => {
    images.forEach((img) => {
      if (img.previewUrl) {
        try {
          URL.revokeObjectURL(img.previewUrl);
        } catch {}
      }
    });
    setImages([]);
    setActiveImageIndex(0);
    setDraft(null);
    setAlertInfo(null);
    setContext('');
  };

  const handleLoadDraft = (savedDraft) => {
    const loaded = { ...savedDraft };
    if (!loaded.environment || loaded.environment.trim().toLowerCase() === 'unknown') {
      loaded.environment = resolveEnvironment(loaded.environment);
      loaded.markdown_draft = buildMarkdownFromDraft(loaded);
    }
    setDraft(loaded);
    setViewMode('editor');
    setAlertInfo({
      variant: 'info',
      title: 'Draft Restored',
      message: `Restored "${savedDraft.title}" from local storage history.`,
      autoCloseMs: 4000,
    });
  };

  const handleDeleteDraft = (id) => {
    const updated = removeDraftFromStorage(id);
    setDraftHistory(updated);
  };

  const handleClearAllHistory = () => {
    clearAllDraftsFromStorage();
    setDraftHistory([]);
    setAlertInfo({
      variant: 'info',
      title: 'History Cleared',
      message: 'All local draft history removed from browser storage.',
      autoCloseMs: 3500,
    });
  };

  // Inference is a single /analyze call, so progress stages are time-based estimates.
  const progressStage = elapsedSeconds < 1.5 ? 1 : elapsedSeconds < 6.0 ? 2 : 3;

  if (showLanding) {
    return <Landing onLaunch={() => setShowLanding(false)} />;
  }

  return (
    <div className="app-container">
      {/* Developer Workbench Header */}
      <header className="workbench-header">
        <div className="brand-section">
          <div className="brand-logo-mark" aria-hidden="true">
            {/* Custom geometric bug & viewfinder crosshair */}
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75">
              <rect x="3" y="3" width="18" height="18" rx="3" strokeDasharray="2 3" />
              <circle cx="12" cy="12" r="3.5" />
              <line x1="12" y1="5" x2="12" y2="8.5" />
              <line x1="12" y1="15.5" x2="12" y2="19" />
              <line x1="5" y1="12" x2="8.5" y2="12" />
              <line x1="15.5" y1="12" x2="19" y2="12" />
            </svg>
          </div>
          <div className="brand-text">
            <div className="brand-title-row">
              <h1>BugSnap</h1>
              <span className="brand-badge">WORKBENCH v0.2</span>
            </div>
            <p>LOCAL SCREENSHOT TO ISSUE SPECIFICATION // GEMMA 4 E2B</p>
          </div>
        </div>

        <div className="header-telemetry">
          {/* Online/Offline status indicator */}
          {isOnline ? (
            <span className="telemetry-chip chip-privacy" title="No external telemetry or cloud uploads">
              <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5">
                <rect x="3" y="7" width="10" height="7" rx="1.5" />
                <path d="M5.5 7V4.5C5.5 3.12 6.62 2 8 2C9.38 2 10.5 3.12 10.5 4.5V7" />
              </svg>
              LOCAL ISOLATION
            </span>
          ) : (
            <span className="telemetry-chip chip-offline" title="Network offline. Local Gemma vision inference works 100% offline.">
              <span className="status-dot"></span>
              OFFLINE — STILL WORKING
            </span>
          )}

          {/* Last run execution time */}
          {lastRunTime && (
            <span className="telemetry-chip chip-last-run" title="Duration of last local vision inference">
              LAST RUN {lastRunTime}s
            </span>
          )}

          {/* Ollama health status */}
          <button
            type="button"
            className={`telemetry-chip chip-health ${health?.status === 'ok' ? 'health-ok' : 'health-degraded'}`}
            onClick={() => checkHealth()}
            title="Click to re-verify backend and Ollama status"
          >
            <span className="status-dot"></span>
            {health?.status === 'ok'
              ? `OLLAMA READY (${health.target_model})`
              : health?.ollama_reachable
              ? 'MODEL MISSING'
              : 'OLLAMA OFFLINE'}
          </button>

          {/* Return to Landing Page */}
          <button
            type="button"
            className="telemetry-chip chip-home"
            onClick={() => setShowLanding(true)}
            title="Return to BugSnap Landing page"
            style={{
              cursor: 'pointer',
              background: 'var(--bg-surface-raised)',
              color: 'var(--text-primary)',
              border: '1px solid var(--border-default)',
              display: 'inline-flex',
              alignItems: 'center',
              gap: '4px',
              padding: '4px 10px',
              fontSize: '11px',
              fontWeight: 600,
              borderRadius: 'var(--radius-sm)',
            }}
          >
            ← Home
          </button>

          {/* GitHub repo icon button */}
          <a
            href="https://github.com"
            target="_blank"
            rel="noreferrer"
            className="header-github-btn"
            title="View BugSnap on GitHub"
            aria-label="GitHub Repository"
          >
            <svg viewBox="0 0 24 24" fill="currentColor">
              <path fillRule="evenodd" clipRule="evenodd" d="M12 2C6.477 2 2 6.484 2 12.017c0 4.425 2.865 8.18 6.839 9.504.5.092.682-.217.682-.483 0-.237-.008-.868-.013-1.703-2.782.605-3.369-1.343-3.369-1.343-.454-1.158-1.11-1.466-1.11-1.466-.908-.62.069-.608.069-.608 1.003.07 1.53 1.032 1.53 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.029-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.026A9.564 9.564 0 0112 6.844c.85.004 1.705.115 2.504.337 1.909-1.296 2.747-1.027 2.747-1.027.546 1.379.202 2.398.1 2.651.64.7 1.028 1.595 1.028 2.688 0 3.848-2.339 4.695-4.566 4.943.359.309.678.92.678 1.855 0 1.338-.012 2.419-.012 2.747 0 .268.18.58.688.482A10.019 10.019 0 0022 12.017C22 6.484 17.522 2 12 2z" />
            </svg>
          </a>
        </div>
      </header>

      {/* Global / Status Alert Notification */}
      {alertInfo && (
        <Alert
          variant={alertInfo.variant}
          title={alertInfo.title}
          message={alertInfo.message}
          action={alertInfo.action}
          autoCloseMs={alertInfo.autoCloseMs}
          onClose={() => setAlertInfo(null)}
        />
      )}

      {/* Main Two-Pane Workbench Layout */}
      <main className="workbench-layout">
        {/* Left Pane: Source Input & Inference Trigger */}
        <section className="source-pane">
          <div className="panel-block">
            <div className="panel-block-header">
              <span className="panel-section-title">
                <span className="section-index">[ 01 ]</span>
                Source Evidence
              </span>
              {images.length > 0 && (
                <div className="header-action-links">
                  {images.length < 4 && (
                    <button
                      type="button"
                      className="text-btn"
                      onClick={() => fileInputRef.current?.click()}
                      title="Add more screenshot images"
                    >
                      + Add Screenshot
                    </button>
                  )}
                  <button
                    type="button"
                    className="text-btn danger-link"
                    onClick={handleClear}
                    title="Remove all screenshots"
                  >
                    Clear All
                  </button>
                </div>
              )}
            </div>

            <input
              type="file"
              ref={fileInputRef}
              style={{ display: 'none' }}
              accept="image/png,image/jpeg,image/webp"
              multiple
              onChange={(e) => {
                if (e.target.files && e.target.files.length > 0) {
                  processFiles(Array.from(e.target.files));
                  e.target.value = '';
                }
              }}
            />

            {images.length === 0 ? (
              <div
                className={`dropzone-container ${isDragActive ? 'drag-active' : ''}`}
                onDragOver={(e) => {
                  e.preventDefault();
                  setIsDragActive(true);
                }}
                onDragLeave={() => setIsDragActive(false)}
                onDrop={handleDrop}
                onClick={() => fileInputRef.current?.click()}
              >
                {/* Viewfinder corner ticks */}
                <span className="reticle-corner top-left" aria-hidden="true" />
                <span className="reticle-corner top-right" aria-hidden="true" />
                <span className="reticle-corner bottom-left" aria-hidden="true" />
                <span className="reticle-corner bottom-right" aria-hidden="true" />

                <div className="dropzone-graphic">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                    <path d="M4 8V5a1 1 0 0 1 1-1h3" />
                    <path d="M16 4h3a1 1 0 0 1 1 1v3" />
                    <path d="M20 16v3a1 1 0 0 1-1 1h-3" />
                    <path d="M8 20H5a1 1 0 0 1-1-1v-3" />
                    <circle cx="12" cy="12" r="3" />
                    <path d="M12 9v6" strokeDasharray="1 1" />
                    <path d="M9 12h6" strokeDasharray="1 1" />
                  </svg>
                </div>
                <p className="dropzone-primary-text">Drop bug screenshot(s) or click to browse</p>
                <p className="dropzone-subtext">PNG, JPEG, WebP • Max 4 images • Up to 10 MB each</p>
                <span className="dropzone-kbd-shortcut">Ctrl+V to paste from clipboard</span>
              </div>
            ) : (
              <div className="preview-card animate-fade-in">
                <div className="preview-media-box">
                  <img src={previewUrl} alt={`Screenshot ${activeImageIndex + 1} preview`} className="preview-img" />
                  {isAnalyzing && <div className="scan-line-overlay" aria-hidden="true" />}
                </div>
                <div className="preview-hud-bar">
                  <div className="preview-meta-chips">
                    <span className="meta-chip meta-type">{fileDetails?.type || 'IMG'}</span>
                    <span className="meta-chip">{fileDetails?.dimensions}</span>
                    <span className="meta-chip">{fileDetails?.size}</span>
                  </div>
                  <div className="preview-actions">
                    <span className="meta-chip">
                      Screenshot {activeImageIndex + 1} of {images.length}
                    </span>
                    <button
                      type="button"
                      className="text-btn text-btn-accent"
                      onClick={() => setAnnotatingIndex(activeImageIndex)}
                      title="Annotate this screenshot"
                    >
                      Annotate
                    </button>
                    {images[activeImageIndex]?.originalFile && (
                      <button
                        type="button"
                        className="text-btn"
                        onClick={() => handleRevertAnnotation(activeImageIndex)}
                        title="Revert annotations to original image"
                      >
                        Revert
                      </button>
                    )}
                    <button
                      type="button"
                      className="text-btn danger-link"
                      onClick={() => removeImage(activeImageIndex)}
                      title="Remove this screenshot"
                    >
                      Remove
                    </button>
                  </div>
                </div>

                {/* Multi-Image Thumbnail Strip */}
                <div className="thumbnail-strip" role="region" aria-label="Screenshot thumbnails">
                  {images.map((img, idx) => (
                    <div
                      key={img.id}
                      className={`thumbnail-item ${idx === activeImageIndex ? 'active' : ''}`}
                      onClick={() => setActiveImageIndex(idx)}
                      title={img.details?.name || `Screenshot ${idx + 1}`}
                    >
                      <span className="thumbnail-badge">{idx + 1}</span>
                      <img src={img.previewUrl} alt={`Thumbnail ${idx + 1}`} className="thumbnail-img" />
                      <div className="thumbnail-controls" onClick={(e) => e.stopPropagation()}>
                        <button
                          type="button"
                          className="btn-thumb-nav"
                          disabled={isAnalyzing}
                          onClick={() => setAnnotatingIndex(idx)}
                          title="Annotate screenshot"
                          aria-label="Annotate"
                        >
                          ✎
                        </button>
                        <button
                          type="button"
                          className="btn-thumb-nav"
                          disabled={idx === 0 || isAnalyzing}
                          onClick={() => moveImageLeft(idx)}
                          title="Move screenshot left"
                          aria-label="Move left"
                        >
                          ‹
                        </button>
                        <button
                          type="button"
                          className="btn-thumb-nav"
                          disabled={idx === images.length - 1 || isAnalyzing}
                          onClick={() => moveImageRight(idx)}
                          title="Move screenshot right"
                          aria-label="Move right"
                        >
                          ›
                        </button>
                        <button
                          type="button"
                          className="btn-thumb-del"
                          disabled={isAnalyzing}
                          onClick={() => removeImage(idx)}
                          title="Remove screenshot"
                          aria-label="Remove"
                        >
                          ✕
                        </button>
                      </div>
                    </div>
                  ))}
                  {images.length < 4 && (
                    <button
                      type="button"
                      className="btn-add-thumb"
                      disabled={isAnalyzing}
                      onClick={() => fileInputRef.current?.click()}
                      title={`Add screenshot (${images.length}/4)`}
                    >
                      <span className="btn-add-thumb-icon">+</span>
                      <span className="btn-add-thumb-text">Add ({images.length}/4)</span>
                    </button>
                  )}
                </div>
              </div>
            )}

            {/* Reporter Context */}
            <div className="field-container">
              <div className="field-label-row">
                <label className="field-label" htmlFor="reporter-context-input">
                  [ 02 ] Reporter Context (Optional)
                </label>
                <span className="field-hint">{context.length}/500</span>
              </div>
              <div className="quick-chips-row" role="group" aria-label="Quick-fill context chips">
                {CONTEXT_QUICK_CHIPS.map((chip) => (
                  <button
                    key={chip}
                    type="button"
                    className="quick-chip-btn"
                    onClick={() => handleQuickFillChip(chip)}
                  >
                    + {chip}
                  </button>
                ))}
              </div>
              <textarea
                id="reporter-context-input"
                className="workbench-textarea"
                placeholder={
                  "1. What you did (actions or steps taken)\n" +
                  "2. What you expected to happen\n" +
                  "3. What actually happened or error message"
                }
                maxLength={500}
                value={context}
                onChange={(e) => setContext(e.target.value.slice(0, 500))}
              />
              <p className="field-tip">
                Tip: Clear actions and expected results help differentiate screen evidence from speculative causes.
              </p>
            </div>

            {/* Beginner-friendly mode toggle */}
            <div className="beginner-toggle-row">
              <label className="beginner-toggle-label">
                <input
                  type="checkbox"
                  className="workbench-checkbox"
                  checked={beginnerMode}
                  onChange={(e) => setBeginnerMode(e.target.checked)}
                />
                <span>Beginner-friendly (good first issue)</span>
              </label>
              <span className="beginner-toggle-hint">Guidance & fix hints</span>
            </div>

            {/* Execution Button */}
            <button
              className="btn-execute"
              disabled={!selectedFile || isAnalyzing}
              onClick={handleAnalyze}
            >
              {isAnalyzing ? (
                <>
                  <span className="status-dot animate-spin"></span>
                  {analyzingStep
                    ? `ANALYZING ${analyzingStep.current} OF ${analyzingStep.total}...`
                    : 'ANALYZING LOCALLY WITH GEMMA 4 E2B...'}
                </>
              ) : (
                <>
                  <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.75">
                    <polygon points="9 1 3 9 8 9 7 15 13 7 8 7 9 1" fill="currentColor" stroke="none" />
                  </svg>
                  EXECUTE SCREENSHOT TRIAGE
                </>
              )}
            </button>

            {/* Indeterminate Loading Progress */}
            {isAnalyzing && (
              <div className="inference-progress-box animate-fade-in">
                <div className="progress-header">
                  <span className="progress-status-label">
                    <span className="status-dot animate-spin"></span>
                    {analyzingStep
                      ? `ANALYZING ${analyzingStep.current} OF ${analyzingStep.total}`
                      : 'LOCAL VISION INFERENCE'}
                  </span>
                  <span className="progress-time-tag">{elapsedSeconds.toFixed(1)}s</span>
                </div>
                <div className="scan-track">
                  <div className="scan-beam"></div>
                </div>
                <div className="progress-steps-list">
                  <div className={`progress-step-item ${progressStage > 1 ? 'completed' : 'active'}`}>
                    <span>{progressStage > 1 ? '[✓]' : '[●]'}</span> Ingesting image buffer & dimensions
                  </div>
                  <div className={`progress-step-item ${progressStage > 2 ? 'completed' : progressStage === 2 ? 'active' : ''}`}>
                    <span>{progressStage > 2 ? '[✓]' : progressStage === 2 ? '[●]' : '[○]'}</span> Querying local Gemma 4 E2B via Ollama
                  </div>
                  <div className={`progress-step-item ${progressStage >= 3 ? 'active' : ''}`}>
                    <span>{progressStage >= 3 ? '[●]' : '[○]'}</span> Synthesizing structured bug schema
                  </div>
                </div>
                <p className="inference-subtext">
                  Strict local execution. No telemetry or images leave your machine.
                </p>
              </div>
            )}

            {/* Benchmark Sample Presets */}
            <div className="benchmark-section">
              <span className="benchmark-title">Benchmark Presets</span>
              <div className="benchmark-grid">
                {SAMPLE_PRESETS.map((preset, idx) => (
                  <button
                    key={idx}
                    type="button"
                    className="benchmark-btn"
                    onClick={() => loadSample(preset)}
                  >
                    <span>
                      <span className="sample-code">[{preset.code}]</span>
                      {preset.name}
                    </span>
                    <span className="sample-chevron">→</span>
                  </button>
                ))}
              </div>
            </div>

            {/* Local Drafts List (ShufflePinnedList) */}
            <div className="local-drafts-section" style={{ marginTop: '14px' }}>
              <ShufflePinnedList
                draftHistory={draftHistory}
                onLoadDraft={handleLoadDraft}
                onDeleteDraft={handleDeleteDraft}
                onClearAll={handleClearAllHistory}
              />
            </div>
          </div>
        </section>

        {/* Right Pane: Triage & Issue Specification */}
        <section className="triage-pane">
          {draft ? (
            <div className="animate-fade-in" style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
              {/* Output Toolbar & Segment Tabs */}
              <div className="triage-toolbar">
                <ContinuousTabs
                  activeId={viewMode}
                  onChange={setViewMode}
                  tabs={[
                    { id: 'editor', label: 'Structured Editor' },
                    { id: 'preview', label: 'Markdown Preview' },
                    { id: 'raw', label: 'Raw Markdown' },
                  ]}
                />

                <div className="triage-toolbar-actions">
                  {/* Task 5: REGENERATE button */}
                  <button
                    className="btn-tool btn-tool-regenerate"
                    disabled={!selectedFile || isAnalyzing}
                    onClick={handleAnalyze}
                    title="Re-run local vision analysis with current context"
                  >
                    <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5">
                      <path d="M13.5 8A5.5 5.5 0 1 1 8 2.5c2.4 0 4.5 1.5 5.2 3.7" />
                      <polyline points="13.5 2.5 13.5 6.5 9.5 6.5" />
                    </svg>
                    REGENERATE
                  </button>

                  <button
                    className={`btn-tool ${copied ? 'btn-tool-success' : 'btn-tool-primary'}`}
                    onClick={handleCopyMarkdown}
                  >
                    {copied ? (
                      <>
                        <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="2">
                          <polyline points="3 8.5 6.5 12 13 4.5" />
                        </svg>
                        COPIED!
                      </>
                    ) : (
                      <>
                        <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5">
                          <rect x="5" y="5" width="8" height="8" rx="1.5" />
                          <path d="M3 11V3.5C3 3.22 3.22 3 3.5 3H11" />
                        </svg>
                        COPY MARKDOWN
                      </>
                    )}
                  </button>
                  <button className="btn-tool btn-tool-secondary" onClick={handleDownloadMarkdown}>
                    <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5">
                      <path d="M8 2v9m0 0l-3-3m3 3l3-3" />
                      <path d="M2 13h12" />
                    </svg>
                    DOWNLOAD .MD
                  </button>
                </div>
              </div>

              {/* View Mode 1: Structured Interactive Editor */}
              {viewMode === 'editor' && (
                <div className="spec-editor-container">
                  {/* Task 6: Sensitive-Data Warning Card (if draft.sensitive_data is a non-empty array) */}
                  {Array.isArray(draft.sensitive_data) && draft.sensitive_data.length > 0 && (
                    <div className="sensitive-data-warning animate-fade-in" role="alert">
                      <div className="sensitive-data-header">
                        <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.75">
                          <path d="M8 2.5L14 13H2L8 2.5Z" strokeLinejoin="round" />
                          <line x1="8" y1="6.5" x2="8" y2="9.5" />
                          <circle cx="8" cy="11.5" r="0.75" fill="currentColor" />
                        </svg>
                        <span>Sensitive Data Detected in Screenshot</span>
                      </div>
                      <p className="sensitive-data-msg">
                        Redact before posting publicly:
                      </p>
                      <div className="sensitive-data-list">
                        {draft.sensitive_data.map((item, idx) => (
                          <span key={idx} className="sensitive-data-item">
                            {item}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Issue Specification: Title & Summary */}
                  <div className="spec-section-card">
                    <div className="spec-section-header">
                      <span className="spec-title-tag">
                        Issue Specification
                      </span>
                      <span className="spec-badge badge-observed">Gemma 4 E2B Synthesized</span>
                    </div>

                    <div className="field-container">
                      <label className="field-label">Issue Title</label>
                      <input
                        type="text"
                        className="issue-title-input"
                        value={draft.title || ''}
                        onChange={(e) => updateDraftField('title', e.target.value)}
                      />
                    </div>

                    <div className="field-container">
                      <label className="field-label">Summary</label>
                      <textarea
                        className="workbench-textarea"
                        style={{ minHeight: '68px' }}
                        value={draft.summary || ''}
                        onChange={(e) => updateDraftField('summary', e.target.value)}
                      />
                    </div>
                  </div>

                  {/* Model Triage Strip */}
                  <div className="spec-section-card">
                    <div className="spec-section-header">
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <span className="spec-title-tag">Model Triage Suggestions</span>
                        {draft.beginner_notes && (
                          <span className="chip-good-first-issue">good first issue</span>
                        )}
                      </div>
                      <span className="spec-badge badge-warning">Requires Human Review</span>
                    </div>
                    <div className="triage-strip">
                      <div className="field-container">
                        <label className="field-label">Suggested Severity</label>
                        <select
                          className="triage-select"
                          value={draft.suggested_severity || 'Medium (Suggested)'}
                          onChange={(e) => updateDraftField('suggested_severity', e.target.value)}
                        >
                          {SEVERITY_OPTIONS.map((opt) => (
                            <option key={opt} value={opt}>
                              {opt}
                            </option>
                          ))}
                        </select>
                      </div>
                      <div className="field-container">
                        <label className="field-label">Suggested Category</label>
                        <select
                          className="triage-select"
                          value={draft.suggested_category || 'Functional (Suggested)'}
                          onChange={(e) => updateDraftField('suggested_category', e.target.value)}
                        >
                          {CATEGORY_OPTIONS.map((opt) => (
                            <option key={opt} value={opt}>
                              {opt}
                            </option>
                          ))}
                        </select>
                      </div>
                    </div>
                  </div>

                  {/* Contributor Notes (Good First Issue) */}
                  {draft.beginner_notes && (
                    <div className="spec-section-card animate-fade-in">
                      <div className="spec-section-header">
                        <span className="spec-title-tag">Contributor Notes (Good First Issue)</span>
                        <span className="chip-good-first-issue">good first issue</span>
                      </div>
                      <textarea
                        className="workbench-textarea"
                        style={{ minHeight: '60px' }}
                        value={draft.beginner_notes || ''}
                        onChange={(e) => updateDraftField('beginner_notes', e.target.value)}
                      />
                    </div>
                  )}

                  {/* Evidence vs Hypotheses Divergence Split */}
                  <div className="divergence-grid">
                    {/* Visible Evidence Column */}
                    <div className="divergence-col">
                      <div className="spec-section-header">
                        <span className="spec-title-tag">Direct Observation</span>
                        <span className="spec-badge badge-observed">Verified On Screen</span>
                      </div>
                      <div className="bullet-item-list">
                        {(draft.visible_evidence || []).map((item, i) => (
                          <div key={i} className="bullet-item-row">
                            <span className="bullet-prefix">•</span>
                            <input
                              type="text"
                              className="bullet-input"
                              value={item}
                              onChange={(e) => updateArrayFieldItem('visible_evidence', i, e.target.value)}
                            />
                            <button
                              type="button"
                              className="btn-bullet-del"
                              onClick={() => removeArrayFieldItem('visible_evidence', i)}
                              title="Delete observation"
                            >
                              ✕
                            </button>
                          </div>
                        ))}
                        <button
                          type="button"
                          className="btn-add-bullet"
                          onClick={() => addArrayFieldItem('visible_evidence', 'Observed screen text or element')}
                        >
                          + Add Observed Evidence
                        </button>
                      </div>
                    </div>

                    {/* Hypotheses Column */}
                    <div className="divergence-col hypotheses-col">
                      <div className="spec-section-header">
                        <span className="spec-title-tag">Root Cause Hypotheses</span>
                        <span className="spec-badge badge-speculation">Model Speculation</span>
                      </div>
                      <div className="bullet-item-list">
                        {(draft.hypotheses || []).map((item, i) => (
                          <div key={i} className="bullet-item-row">
                            <span className="bullet-prefix">?</span>
                            <input
                              type="text"
                              className="bullet-input"
                              value={item}
                              onChange={(e) => updateArrayFieldItem('hypotheses', i, e.target.value)}
                            />
                            <button
                              type="button"
                              className="btn-bullet-del"
                              onClick={() => removeArrayFieldItem('hypotheses', i)}
                              title="Delete hypothesis"
                            >
                              ✕
                            </button>
                          </div>
                        ))}
                        <button
                          type="button"
                          className="btn-add-bullet"
                          onClick={() => addArrayFieldItem('hypotheses', 'Unverified speculative cause')}
                        >
                          + Add Hypothesis
                        </button>
                      </div>
                    </div>
                  </div>

                  {/* Suggested Fix Hints (Unverified) */}
                  <div className="spec-section-card animate-fade-in">
                    <div className="spec-section-header">
                      <span className="spec-title-tag">Suggested fix hints (unverified)</span>
                      <span className="spec-badge badge-speculation">Model Speculation (Max 3)</span>
                    </div>
                    <div className="bullet-item-list">
                      {(draft.fix_hints || []).map((item, i) => (
                        <div key={i} className="bullet-item-row">
                          <span className="bullet-prefix">?</span>
                          <input
                            type="text"
                            className="bullet-input"
                            value={item}
                            onChange={(e) => updateArrayFieldItem('fix_hints', i, e.target.value)}
                          />
                          <button
                            type="button"
                            className="btn-bullet-del"
                            onClick={() => removeArrayFieldItem('fix_hints', i)}
                            title="Delete fix hint"
                          >
                            ✕
                          </button>
                        </div>
                      ))}
                      {(!draft.fix_hints || draft.fix_hints.length < 3) && (
                        <button
                          type="button"
                          className="btn-add-bullet"
                          onClick={() => addArrayFieldItem('fix_hints', 'Unverified speculative fix hint')}
                        >
                          + Add Fix Hint
                        </button>
                      )}
                    </div>
                  </div>

                  {/* Reporter Context (User Provided) */}
                  <div className="spec-section-card">
                    <div className="spec-section-header">
                      <span className="spec-title-tag">Reporter Context</span>
                      <span className="spec-badge" style={{ background: 'var(--bg-surface-inset)', color: 'var(--text-secondary)' }}>
                        Explicit Notes
                      </span>
                    </div>
                    <textarea
                      className="workbench-textarea"
                      style={{ minHeight: '60px' }}
                      placeholder="Notes explicitly provided by the bug reporter..."
                      value={draft.user_context || ''}
                      onChange={(e) => updateDraftField('user_context', e.target.value)}
                    />
                  </div>

                  {/* Behavior Comparison */}
                  <div className="behavior-comparison-grid">
                    <div className="spec-section-card">
                      <div className="spec-section-header">
                        <span className="spec-title-tag">Actual Behavior</span>
                        <span className="spec-badge badge-observed">Observed</span>
                      </div>
                      <textarea
                        className="workbench-textarea"
                        style={{ minHeight: '72px' }}
                        value={draft.actual_behavior || ''}
                        onChange={(e) => updateDraftField('actual_behavior', e.target.value)}
                      />
                    </div>

                    <div className="spec-section-card">
                      <div className="spec-section-header">
                        <span className="spec-title-tag">Expected Behavior</span>
                        <span className="spec-badge badge-speculation">Intended</span>
                      </div>
                      <textarea
                        className="workbench-textarea"
                        style={{ minHeight: '72px' }}
                        value={draft.expected_behavior || ''}
                        onChange={(e) => updateDraftField('expected_behavior', e.target.value)}
                      />
                    </div>
                  </div>

                  {/* Suggested Reproduction Steps */}
                  <div className="spec-section-card">
                    <div className="spec-section-header">
                      <span className="spec-title-tag">Suggested Reproduction Steps</span>
                      <span className="spec-badge badge-warning">Verification Required</span>
                    </div>
                    <div className="bullet-item-list">
                      {(draft.steps_to_reproduce || []).map((step, i) => (
                        <div key={i} className="bullet-item-row">
                          <span className="bullet-prefix">{(i + 1).toString().padStart(2, '0')}.</span>
                          <input
                            type="text"
                            className="bullet-input"
                            value={step}
                            onChange={(e) => updateArrayFieldItem('steps_to_reproduce', i, e.target.value)}
                          />
                          <button
                            type="button"
                            className="btn-bullet-del"
                            onClick={() => removeArrayFieldItem('steps_to_reproduce', i)}
                            title="Delete step"
                          >
                            ✕
                          </button>
                        </div>
                      ))}
                      <button
                        type="button"
                        className="btn-add-bullet"
                        onClick={() => addArrayFieldItem('steps_to_reproduce', 'Reproduction action')}
                      >
                        + Add Reproduction Step
                      </button>
                    </div>
                  </div>

                  {/* Environment & Missing Information */}
                  <div className="behavior-comparison-grid">
                    <div className="spec-section-card">
                      <div className="spec-section-header">
                        <span className="spec-title-tag">Environment Details</span>
                        {draft.environment?.includes('Reporter browser (auto-detected)') ? (
                          <span className="spec-badge badge-observed">Reporter browser (auto-detected)</span>
                        ) : (
                          <button
                            type="button"
                            className="text-btn"
                            onClick={() => updateDraftField('environment', resolveEnvironment('Unknown'))}
                            title="Auto-fill environment from current browser"
                          >
                            Auto-fill
                          </button>
                        )}
                      </div>
                      <input
                        type="text"
                        className="workbench-input"
                        value={draft.environment || 'Unknown'}
                        onChange={(e) => updateDraftField('environment', e.target.value)}
                      />
                    </div>

                    <div className="spec-section-card">
                      <div className="spec-section-header">
                        <span className="spec-title-tag">Missing Information / Questions</span>
                      </div>
                      <div className="bullet-item-list">
                        {(draft.missing_information || []).map((item, i) => (
                          <div key={i} className="bullet-item-row">
                            <span className="bullet-prefix">?</span>
                            <input
                              type="text"
                              className="bullet-input"
                              value={item}
                              onChange={(e) => updateArrayFieldItem('missing_information', i, e.target.value)}
                            />
                            <button
                              type="button"
                              className="btn-bullet-del"
                              onClick={() => removeArrayFieldItem('missing_information', i)}
                            >
                              ✕
                            </button>
                          </div>
                        ))}
                        <button
                          type="button"
                          className="btn-add-bullet"
                          onClick={() => addArrayFieldItem('missing_information', 'Missing browser or runtime version?')}
                        >
                          + Add Question
                        </button>
                      </div>
                    </div>
                  </div>

                  {/* Hackathon Guardrail Callout */}
                  <div className="guardrail-callout">
                    <div className="guardrail-icon" aria-hidden="true">
                      <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5">
                        <path d="M8 1.5L2.5 4V8C2.5 11.5 5 13.8 8 14.5C11 13.8 13.5 11.5 13.5 8V4L8 1.5Z" />
                        <polyline points="6 8 7.5 9.5 10 6.5" />
                      </svg>
                    </div>
                    <span>
                      <strong>Hackathon Guardrail:</strong> Screenshot analysis produces an unverified draft for developer triage, not proof that the issue is confirmed. Always audit observed evidence before submitting to GitHub.
                    </span>
                  </div>
                </div>
              )}

              {/* View Mode 2: Formatted Markdown Preview with marked & DOMPurify */}
              {viewMode === 'preview' && (
                <div
                  className="markdown-workbench-render animate-fade-in"
                  dangerouslySetInnerHTML={{
                    __html: DOMPurify.sanitize(marked.parse(draft.markdown_draft || '')),
                  }}
                />
              )}

              {/* View Mode 3: Raw Markdown Editor */}
              {viewMode === 'raw' && (
                <div className="animate-fade-in">
                  <textarea
                    className="raw-markdown-workbench"
                    value={draft.markdown_draft}
                    onChange={(e) => setDraft({ ...draft, markdown_draft: e.target.value })}
                  />
                </div>
              )}
            </div>
          ) : isAnalyzing ? (
            /* Task 2: 3 Shimmer Skeleton Cards while analyzing and no draft exists */
            <div className="skeleton-cards-container animate-fade-in" aria-label="Synthesizing issue draft">
              <div className="skeleton-card">
                <div className="skeleton-line skeleton-title"></div>
                <div className="skeleton-line skeleton-body-lg"></div>
              </div>
              <div className="skeleton-card">
                <div className="skeleton-line skeleton-title"></div>
                <div className="skeleton-grid">
                  <div className="skeleton-line" style={{ height: '36px' }}></div>
                  <div className="skeleton-line" style={{ height: '36px' }}></div>
                </div>
              </div>
              <div className="skeleton-card">
                <div className="skeleton-line skeleton-title"></div>
                <div className="skeleton-grid">
                  <div className="skeleton-line" style={{ height: '64px' }}></div>
                  <div className="skeleton-line" style={{ height: '64px' }}></div>
                </div>
              </div>
            </div>
          ) : (
            /* Technical Blueprint Empty State */
            <div className="empty-workbench-state animate-fade-in">
              <div className="blueprint-illustration" aria-hidden="true">
                <svg viewBox="0 0 32 32" fill="none" stroke="currentColor" strokeWidth="1.5">
                  <rect x="4" y="4" width="24" height="24" rx="2" strokeDasharray="3 3" />
                  <path d="M4 11h24" />
                  <path d="M11 4v24" />
                  <circle cx="11" cy="11" r="2" fill="currentColor" />
                  <path d="M18 18l6 6" />
                  <path d="M24 18l-6 6" />
                </svg>
              </div>
              <h3 className="empty-title">Awaiting Screenshot Input</h3>
              <p className="empty-desc">
                Select an input source on the left to extract structured visible evidence, reproduction steps, and root-cause hypotheses using local Gemma 4 E2B.
              </p>
              <div className="empty-quick-actions">
                <span className="quick-action-pill">Ctrl+V Clipboard Paste</span>
                <span className="quick-action-pill">Drag & Drop Image</span>
                <span className="quick-action-pill">1-Click Benchmark Samples</span>
              </div>
            </div>
          )}
        </section>
      </main>
      {/* Annotation Canvas Modal */}
      {annotatingIndex !== null && images[annotatingIndex] && (
        <div
          className="annotation-modal-backdrop"
          role="dialog"
          aria-modal="true"
          aria-label="Annotate Screenshot"
          onClick={() => setAnnotatingIndex(null)}
        >
          <div className="annotation-modal-window" onClick={(e) => e.stopPropagation()}>
            <div className="annotation-modal-header">
              <div className="annotation-modal-title">
                <span className="modal-tag">[ ANNOTATE ]</span>
                <span>
                  Screenshot {annotatingIndex + 1}: {images[annotatingIndex].details?.name || 'Image'}
                </span>
              </div>
              <button
                type="button"
                className="annotation-modal-close"
                onClick={() => setAnnotatingIndex(null)}
                title="Close annotator"
                aria-label="Close"
              >
                ✕
              </button>
            </div>

            <div className="annotation-modal-toolbar">
              <div className="annotation-tool-group">
                <button
                  type="button"
                  className={`btn-annotation-tool ${activeTool === 'arrow' ? 'active' : ''}`}
                  onClick={() => setActiveTool('arrow')}
                  title="Draw arrow pointing to issue"
                >
                  <span aria-hidden="true">↗</span> Arrow
                </button>
                <button
                  type="button"
                  className={`btn-annotation-tool ${activeTool === 'rectangle' ? 'active' : ''}`}
                  onClick={() => setActiveTool('rectangle')}
                  title="Draw rectangle around issue"
                >
                  <span aria-hidden="true">□</span> Rectangle
                </button>
                <button
                  type="button"
                  className={`btn-annotation-tool ${activeTool === 'blur' ? 'active' : ''}`}
                  onClick={() => setActiveTool('blur')}
                  title="Pixelate / Blur dragged area"
                >
                  <span aria-hidden="true">▒</span> Blur Area
                </button>
              </div>

              <div className="annotation-tool-group">
                <button
                  type="button"
                  className="btn-annotation-tool"
                  disabled={!canUndo}
                  onClick={handleUndo}
                  title="Undo last annotation"
                >
                  ↶ Undo
                </button>
                <button
                  type="button"
                  className="btn-annotation-tool danger-tool"
                  onClick={handleClearCanvas}
                  title="Clear all annotations"
                >
                  ✕ Clear
                </button>
              </div>
            </div>

            <div className="annotation-canvas-container">
              <canvas
                ref={canvasRef}
                className="annotation-canvas"
                onMouseDown={handleCanvasMouseDown}
                onMouseMove={handleCanvasMouseMove}
                onMouseUp={handleCanvasMouseUp}
                onMouseLeave={handleCanvasMouseUp}
              />
            </div>

            <div className="annotation-modal-footer">
              <div className="annotation-note">
                <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5">
                  <circle cx="8" cy="8" r="6.5" />
                  <line x1="8" y1="5" x2="8" y2="8" />
                  <circle cx="8" cy="11" r="0.75" fill="currentColor" />
                </svg>
                <span>GitHub can't attach images via API; drag the downloaded image in manually.</span>
              </div>
              <div className="annotation-footer-actions">
                <button
                  type="button"
                  className="btn-modal-secondary"
                  onClick={() => setAnnotatingIndex(null)}
                >
                  Close
                </button>
                <button
                  type="button"
                  className="btn-modal-secondary"
                  onClick={handleDownloadAnnotation}
                >
                  Download PNG
                </button>
                <button
                  type="button"
                  className="btn-modal-primary"
                  onClick={handleSaveAnnotation}
                >
                  Save & Replace
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

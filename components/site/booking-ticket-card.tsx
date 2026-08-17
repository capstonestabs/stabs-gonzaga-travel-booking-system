"use client";

import { useEffect, useState } from "react";
import { Download, MapPin, ShieldCheck, Ticket } from "lucide-react";
import QRCode from "qrcode";

import { Button } from "@/components/ui/button";

type BookingTicketCardProps = {
  destinationTitle: string;
  locationText: string;
  ticketCode: string;
  serviceTitle: string;
  guestName: string;
  serviceDate: string;
  guestCount: number;
  guestNumber: number;
  guestType: "adult" | "child";
  verificationUrl: string;
  totalPaid: string;
  referenceCode: string;
  isExpired?: boolean;
};

function roundRectPath(
  context: CanvasRenderingContext2D,
  x: number,
  y: number,
  width: number,
  height: number,
  radius: number
) {
  const safeRadius = Math.min(radius, width / 2, height / 2);

  context.beginPath();
  context.moveTo(x + safeRadius, y);
  context.lineTo(x + width - safeRadius, y);
  context.quadraticCurveTo(x + width, y, x + width, y + safeRadius);
  context.lineTo(x + width, y + height - safeRadius);
  context.quadraticCurveTo(x + width, y + height, x + width - safeRadius, y + height);
  context.lineTo(x + safeRadius, y + height);
  context.quadraticCurveTo(x, y + height, x, y + height - safeRadius);
  context.lineTo(x, y + safeRadius);
  context.quadraticCurveTo(x, y, x + safeRadius, y);
  context.closePath();
}

function fillRoundedRect(
  context: CanvasRenderingContext2D,
  x: number,
  y: number,
  width: number,
  height: number,
  radius: number,
  fillStyle: string
) {
  roundRectPath(context, x, y, width, height, radius);
  context.fillStyle = fillStyle;
  context.fill();
}

function strokeRoundedRect(
  context: CanvasRenderingContext2D,
  x: number,
  y: number,
  width: number,
  height: number,
  radius: number,
  strokeStyle: string,
  lineWidth: number
) {
  roundRectPath(context, x, y, width, height, radius);
  context.lineWidth = lineWidth;
  context.strokeStyle = strokeStyle;
  context.stroke();
}

function wrapCanvasText(
  context: CanvasRenderingContext2D,
  text: string,
  maxWidth: number,
  maxLines?: number
) {
  const words = text.trim().split(/\s+/).filter(Boolean);
  const lines: string[] = [];
  let currentLine = "";

  for (const word of words) {
    const candidate = currentLine ? `${currentLine} ${word}` : word;

    if (context.measureText(candidate).width <= maxWidth) {
      currentLine = candidate;
      continue;
    }

    if (currentLine) {
      lines.push(currentLine);
      currentLine = word;
    } else {
      lines.push(word);
      currentLine = "";
    }

    if (maxLines && lines.length >= maxLines) {
      break;
    }
  }

  if (currentLine && (!maxLines || lines.length < maxLines)) {
    lines.push(currentLine);
  }

  if (maxLines && lines.length > maxLines) {
    return lines.slice(0, maxLines);
  }

  if (maxLines && lines.length === maxLines && words.length > 0) {
    const truncated = [...lines];
    const lastIndex = truncated.length - 1;

    while (
      truncated[lastIndex].length > 0 &&
      context.measureText(`${truncated[lastIndex]}...`).width > maxWidth
    ) {
      truncated[lastIndex] = truncated[lastIndex].slice(0, -1).trimEnd();
    }

    if (truncated[lastIndex] !== lines[lastIndex]) {
      truncated[lastIndex] = `${truncated[lastIndex]}...`;
    }

    return truncated;
  }

  return lines;
}

function loadCanvasImage(source: string) {
  return new Promise<HTMLImageElement>((resolve, reject) => {
    const image = new Image();
    image.onload = () => resolve(image);
    image.onerror = () => reject(new Error("Unable to prepare the ticket QR code."));
    image.src = source;
  });
}

async function renderTicketCanvas(props: BookingTicketCardProps) {
  const width = 1600;
  const height = 980;
  const canvas = document.createElement("canvas");
  canvas.width = width;
  canvas.height = height;

  const context = canvas.getContext("2d");
  if (!context) {
    throw new Error("Unable to prepare the ticket download.");
  }

  const gradient = context.createLinearGradient(0, 0, width, height);
  gradient.addColorStop(0, "#0f4b33");
  gradient.addColorStop(0.6, "#156545");
  gradient.addColorStop(1, "#1c7a53");
  context.fillStyle = gradient;
  context.fillRect(0, 0, width, height);

  strokeRoundedRect(context, 26, 26, width - 52, height - 52, 36, "rgba(255,255,255,0.18)", 3);
  fillRoundedRect(context, 1094, 86, 410, 808, 34, "rgba(255,255,255,0.10)");
  strokeRoundedRect(context, 1094, 86, 410, 808, 34, "rgba(255,255,255,0.12)", 2);

  fillRoundedRect(context, 76, 82, 258, 58, 29, "rgba(255,255,255,0.10)");
  strokeRoundedRect(context, 76, 82, 258, 58, 29, "rgba(255,255,255,0.22)", 2);
  context.fillStyle = "#f8fffb";
  context.font = "700 24px system-ui, -apple-system, sans-serif";
  context.fillText(props.isExpired ? "Expired pass" : "Verified booking", 126, 120);
  context.fillStyle = "rgba(255,255,255,0.82)";
  context.font = "700 16px system-ui, -apple-system, sans-serif";
  context.fillText("STABS Gonzaga Travel Bookings", 76, 175);

  fillRoundedRect(context, 1220, 82, 212, 88, 24, "rgba(255,255,255,0.10)");
  strokeRoundedRect(context, 1220, 82, 212, 88, 24, "rgba(255,255,255,0.18)", 2);
  context.fillStyle = "rgba(255,255,255,0.74)";
  context.font = "700 16px system-ui, -apple-system, sans-serif";
  context.fillText("Reference", 1256, 117);
  context.fillStyle = "#ffffff";
  context.font = "700 33px ui-monospace, SFMono-Regular, Menlo, monospace";
  context.fillText(`#${props.referenceCode}`, 1256, 151);

  context.fillStyle = "#ffffff";
  context.font = "700 66px Georgia, 'Times New Roman', serif";
  const titleLines = wrapCanvasText(context, props.destinationTitle, 900, 2);
  titleLines.forEach((line, index) => {
    context.fillText(line, 76, 280 + index * 78);
  });

  context.fillStyle = "rgba(255,255,255,0.94)";
  context.font = "600 30px system-ui, -apple-system, sans-serif";
  const serviceLine = wrapCanvasText(context, props.serviceTitle, 835, 1)[0] ?? props.serviceTitle;
  context.fillText(serviceLine, 76, 410);

  context.fillStyle = "rgba(255,255,255,0.82)";
  context.font = "500 24px system-ui, -apple-system, sans-serif";
  const locationLine =
    wrapCanvasText(context, props.locationText, 835, 1)[0] ?? props.locationText;
  context.fillText(locationLine, 76, 458);

  fillRoundedRect(context, 76, 515, 412, 134, 28, "rgba(0,0,0,0.14)");
  fillRoundedRect(context, 516, 515, 412, 134, 28, "rgba(0,0,0,0.14)");
  strokeRoundedRect(context, 76, 515, 412, 134, 28, "rgba(255,255,255,0.10)", 2);
  strokeRoundedRect(context, 516, 515, 412, 134, 28, "rgba(255,255,255,0.10)", 2);

  context.fillStyle = "rgba(255,255,255,0.76)";
  context.font = "700 18px system-ui, -apple-system, sans-serif";
  context.fillText("Visit date", 116, 560);
  context.fillText("Guest pass", 556, 560);

  context.fillStyle = "#ffffff";
  context.font = "700 34px system-ui, -apple-system, sans-serif";
  context.fillText(props.serviceDate, 116, 610);
  context.fillText(
    `${props.guestNumber} of ${props.guestCount}`,
    556,
    610
  );

  context.fillStyle = "rgba(255,255,255,0.74)";
  context.font = "700 18px system-ui, -apple-system, sans-serif";
  context.fillText("Guest name", 76, 744);
  const guestLines = wrapCanvasText(context, props.guestName, 650, 2);
  context.fillStyle = "#ffffff";
  context.font = "700 34px system-ui, -apple-system, sans-serif";
  guestLines.forEach((line, index) => {
    context.fillText(line, 76, 796 + index * 42);
  });

  context.fillStyle = "rgba(255,255,255,0.74)";
  context.font = "700 18px system-ui, -apple-system, sans-serif";
  context.fillText("Paid", 832, 744);
  context.fillStyle = "#ffffff";
  context.font = "700 38px ui-monospace, SFMono-Regular, Menlo, monospace";
  const paidLine = wrapCanvasText(context, props.totalPaid, 180, 1)[0] ?? props.totalPaid;
  context.fillText(paidLine, 832, 796);

  fillRoundedRect(context, 1176, 170, 246, 246, 30, "#ffffff");
  const qrDataUrl = await QRCode.toDataURL(props.verificationUrl, {
    errorCorrectionLevel: "M",
    margin: 1,
    width: 220,
    color: { dark: "#0f4b33", light: "#ffffff" }
  });
  const qrImage = await loadCanvasImage(qrDataUrl);
  context.drawImage(qrImage, 1189, 183, 220, 220);

  context.fillStyle = "rgba(255,255,255,0.74)";
  context.font = "700 18px system-ui, -apple-system, sans-serif";
  context.fillText("Ticket code", 1176, 504);
  context.fillStyle = "#ffffff";
  context.font = "700 58px Georgia, 'Times New Roman', serif";
  context.fillText(props.ticketCode.split("-").pop() ?? props.ticketCode, 1176, 575);
  context.fillStyle = "rgba(255,255,255,0.68)";
  context.font = "500 18px ui-monospace, SFMono-Regular, Menlo, monospace";
  const fullCodeLines = wrapCanvasText(context, props.ticketCode, 290, 2);
  fullCodeLines.forEach((line, index) => {
    context.fillText(line, 1176, 614 + index * 28);
  });

  return canvas;
}

async function downloadTicketImage(props: BookingTicketCardProps, fileName: string) {
  const canvas = await renderTicketCanvas(props);

  const pngBlob = await new Promise<Blob | null>((resolve) =>
    canvas.toBlob(resolve, "image/png", 1)
  );

  if (!pngBlob) {
    throw new Error("Unable to generate the ticket image.");
  }

  const downloadUrl = URL.createObjectURL(pngBlob);
  const link = document.createElement("a");
  link.href = downloadUrl;
  link.download = fileName;
  document.body.appendChild(link);
  link.click();
  link.remove();
  window.setTimeout(() => URL.revokeObjectURL(downloadUrl), 1500);
}

export function BookingTicketCard(props: BookingTicketCardProps) {
  const [isDownloading, setIsDownloading] = useState(false);
  const [downloadError, setDownloadError] = useState<string | null>(null);
  const [qrDataUrl, setQrDataUrl] = useState<string | null>(null);

  useEffect(() => {
    let isActive = true;
    QRCode.toDataURL(props.verificationUrl, {
      errorCorrectionLevel: "M",
      margin: 1,
      width: 256,
      color: { dark: "#0f4b33", light: "#ffffff" }
    })
      .then((url) => {
        if (isActive) setQrDataUrl(url);
      })
      .catch(() => {
        if (isActive) setDownloadError("Unable to generate this ticket's QR code.");
      });
    return () => {
      isActive = false;
    };
  }, [props.verificationUrl]);

  async function handleDownload() {
    setIsDownloading(true);
    setDownloadError(null);

    try {
      await downloadTicketImage(props, `gonzaga-booking-pass-${props.ticketCode.toLowerCase()}.png`);
    } catch (error) {
      console.error(error);
      setDownloadError("Unable to download the ticket right now. Please try again.");
    } finally {
      setIsDownloading(false);
    }
  }

  return (
    <div className="mx-auto w-full max-w-sm space-y-4">
      <div className="relative overflow-hidden rounded-[1.6rem] border border-border bg-card p-6 text-card-foreground shadow-md text-center flex flex-col items-center justify-center gap-4">
        <div className="rounded-[1rem] bg-[#f8fffb] border border-primary/10 p-4 shadow-inner">
          {qrDataUrl ? (
            <img
              src={qrDataUrl}
              alt={`Verification QR code for ${props.guestName}`}
              className="h-48 w-48 mx-auto"
            />
          ) : (
            <div className="flex h-48 w-48 items-center justify-center text-xs text-primary font-semibold">
              Preparing QR…
            </div>
          )}
        </div>

        <div className="space-y-1.5 w-full">
          <p className="text-[11px] uppercase tracking-[0.16em] text-muted-foreground">Ticket code</p>
          <h2 className="font-display text-3xl font-bold leading-none tracking-[0.04em] text-primary">
            {props.ticketCode.split("-").pop() ?? props.ticketCode}
          </h2>
          <p className="font-mono text-xs text-muted-foreground truncate w-full px-4">
            {props.ticketCode}
          </p>
        </div>
      </div>

      <Button
        type="button"
        onClick={() => void handleDownload()}
        className="w-full min-h-11 rounded-xl font-semibold"
        disabled={props.isExpired}
      >
        <Download className="h-4 w-4" />
        {props.isExpired
          ? "Expired pass"
          : isDownloading
            ? "Preparing image..."
            : "Download ticket image"}
      </Button>
      {downloadError ? (
        <p className="text-center text-sm text-destructive">{downloadError}</p>
      ) : null}
    </div>
  );
}

"use client";

import { useState } from "react";
import { Download, MapPin, ShieldCheck, Ticket } from "lucide-react";

import { Button } from "@/components/ui/button";

type BookingTicketCardProps = {
  destinationTitle: string;
  locationText: string;
  ticketCode: string;
  serviceTitle: string;
  guestName: string;
  serviceDate: string;
  guestCount: number;
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

function renderTicketCanvas(props: BookingTicketCardProps) {
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
  context.fillText("Guests", 556, 560);

  context.fillStyle = "#ffffff";
  context.font = "700 34px system-ui, -apple-system, sans-serif";
  context.fillText(props.serviceDate, 116, 610);
  context.fillText(
    `${props.guestCount} ${props.guestCount === 1 ? "guest" : "guests"}`,
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
  for (let row = 0; row < 7; row += 1) {
    for (let column = 0; column < 7; column += 1) {
      const index = row * 7 + column;
      const isFilled =
        index % 3 === 0 ||
        index % 7 === 0 ||
        index === 0 ||
        index === 6 ||
        index === 42 ||
        index === 48;

      fillRoundedRect(
        context,
        1204 + column * 30,
        198 + row * 30,
        18,
        18,
        4,
        isFilled ? "#0f4b33" : "#d9efe4"
      );
    }
  }

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
  const canvas = renderTicketCanvas(props);

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
    <div className="mx-auto w-full max-w-5xl space-y-4">
      <div
        className="relative overflow-hidden rounded-[1.6rem] border border-primary/15 bg-[linear-gradient(135deg,#0f4b33_0%,#156545_62%,#1c7a53_100%)] p-4 text-white shadow-[0_26px_50px_-20px_rgba(15,75,51,0.5)] sm:p-5 lg:p-6"
      >
        <div className="absolute inset-[0.45rem] rounded-[1.2rem] border border-white/14" />

        <div className="relative grid gap-4 lg:grid-cols-[minmax(0,1fr)_17rem] lg:gap-5">
          <div className="flex min-w-0 flex-col gap-4 lg:min-h-[25rem]">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
              <div className="min-w-0 space-y-2">
                <div className="inline-flex min-h-11 items-center gap-2 rounded-full border border-white/24 bg-white/8 px-3.5 py-2 text-[11px] font-semibold uppercase tracking-[0.16em] text-white/95">
                  <ShieldCheck className="h-4 w-4" />
                  {props.isExpired ? "Expired pass" : "Verified booking"}
                </div>
                <p className="text-[11px] uppercase tracking-[0.16em] text-white/84">
                  Gonzaga Travel Bookings
                </p>
              </div>
              <div className="w-full rounded-[1rem] border border-white/18 bg-white/10 px-3 py-2 text-left sm:w-auto sm:min-w-[8.5rem] sm:text-right">
                <p className="text-[11px] uppercase tracking-[0.14em] text-white/74">Ref</p>
                <p className="font-mono text-[15px] font-semibold text-white sm:text-[16px]">
                  #{props.referenceCode}
                </p>
              </div>
            </div>

            <div className="min-w-0 space-y-2">
              <h2 className="break-words font-display text-[clamp(1.7rem,1.3rem+1vw,2.45rem)] font-semibold leading-tight tracking-tight text-white">
                {props.destinationTitle}
              </h2>
              <p className="inline-flex items-start gap-2 text-sm font-medium text-white/92 sm:text-base">
                <Ticket className="mt-0.5 h-4 w-4 shrink-0" />
                <span className="break-words">{props.serviceTitle}</span>
              </p>
              <p className="inline-flex items-start gap-2 text-[13px] text-white/82 sm:text-sm">
                <MapPin className="mt-0.5 h-4 w-4 shrink-0" />
                <span className="break-words">{props.locationText}</span>
              </p>
            </div>

            <div className="grid gap-3 text-white/80 sm:grid-cols-2">
              <div className="rounded-[1rem] bg-black/14 px-4 py-3 ring-1 ring-white/10">
                <p className="text-[11px] uppercase tracking-[0.14em]">Visit date</p>
                <p className="mt-1.5 break-words text-base font-semibold text-white sm:text-lg">
                  {props.serviceDate}
                </p>
              </div>
              <div className="rounded-[1rem] bg-black/14 px-4 py-3 ring-1 ring-white/10">
                <p className="text-[11px] uppercase tracking-[0.14em]">Guests</p>
                <p className="mt-1.5 break-words text-base font-semibold text-white sm:text-lg">
                  {props.guestCount} {props.guestCount === 1 ? "guest" : "guests"}
                </p>
              </div>
            </div>

            <div className="mt-auto grid gap-4 border-t border-white/12 pt-4 sm:grid-cols-[minmax(0,1fr),auto] sm:items-end">
              <div className="min-w-0">
                <p className="text-[11px] uppercase tracking-[0.14em] text-white/74">Guest name</p>
                <p className="mt-1.5 break-words text-base font-semibold leading-tight text-white sm:text-lg">
                  {props.guestName}
                </p>
              </div>
              <div className="sm:text-right">
                <p className="text-[11px] uppercase tracking-[0.14em] text-white/74">Paid</p>
                <p className="mt-1.5 break-words font-mono text-base font-semibold text-white sm:text-lg">
                  {props.totalPaid}
                </p>
              </div>
            </div>
          </div>

          <div className="flex min-w-0 flex-col rounded-[1.2rem] bg-white/8 px-4 py-4 ring-1 ring-white/12">
            <div className="mx-auto rounded-[1rem] bg-white p-3 shadow-sm">
              <div className="grid h-[5.25rem] w-[5.25rem] grid-cols-5 gap-1.5">
                {Array.from({ length: 25 }).map((_, index) => (
                  <div
                    key={index}
                    className={
                      index % 3 === 0 ||
                      index % 7 === 0 ||
                      index === 0 ||
                      index === 4 ||
                      index === 20 ||
                      index === 24
                        ? "rounded-[2px] bg-primary"
                        : "rounded-[2px] bg-secondary"
                    }
                  />
                ))}
              </div>
            </div>

            <div className="mt-4 min-w-0">
              <p className="text-[11px] uppercase tracking-[0.14em] text-white/74">Ticket code</p>
              <p className="mt-1.5 break-all font-display text-[2rem] font-semibold leading-none tracking-[0.04em] text-white sm:text-[2.2rem]">
                {props.ticketCode.split("-").pop() ?? props.ticketCode}
              </p>
              <p className="mt-2 break-all font-mono text-[11px] text-white/62">
                {props.ticketCode}
              </p>
            </div>
          </div>
        </div>
      </div>

      <Button
        type="button"
        onClick={() => void handleDownload()}
        className="w-full"
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

"use client";

import { useRef, useState } from "react";
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

function inlineStyles(source: HTMLElement, target: HTMLElement) {
  const computed = window.getComputedStyle(source);

  for (const property of Array.from(computed)) {
    target.style.setProperty(
      property,
      computed.getPropertyValue(property),
      computed.getPropertyPriority(property)
    );
  }

  const sourceChildren = Array.from(source.children) as HTMLElement[];
  const targetChildren = Array.from(target.children) as HTMLElement[];

  for (let index = 0; index < sourceChildren.length; index += 1) {
    const sourceChild = sourceChildren[index];
    const targetChild = targetChildren[index];

    if (!sourceChild || !targetChild) {
      continue;
    }

    inlineStyles(sourceChild, targetChild);
  }
}

async function downloadNodeAsImage(node: HTMLElement, fileName: string) {
  const clone = node.cloneNode(true) as HTMLElement;
  const rect = node.getBoundingClientRect();
  const width = Math.ceil(rect.width);
  const height = Math.ceil(rect.height);
  const scale = Math.max(2, Math.min(3, Math.ceil(window.devicePixelRatio || 2)));

  clone.setAttribute("xmlns", "http://www.w3.org/1999/xhtml");
  clone.style.margin = "0";
  clone.style.width = `${width}px`;
  clone.style.height = `${height}px`;

  inlineStyles(node, clone);

  const serialized = new XMLSerializer().serializeToString(clone);
  const svg = `
    <svg xmlns="http://www.w3.org/2000/svg" width="${width * scale}" height="${height * scale}" viewBox="0 0 ${width} ${height}">
      <foreignObject x="0" y="0" width="100%" height="100%">
        ${serialized}
      </foreignObject>
    </svg>
  `;

  const svgBlob = new Blob([svg], { type: "image/svg+xml;charset=utf-8" });
  const svgUrl = URL.createObjectURL(svgBlob);
  const image = new Image();

  await new Promise<void>((resolve, reject) => {
    image.onload = () => resolve();
    image.onerror = () => reject(new Error("Unable to prepare the ticket image."));
    image.src = svgUrl;
  });

  const canvas = document.createElement("canvas");
  canvas.width = width * scale;
  canvas.height = height * scale;

  const context = canvas.getContext("2d");
  if (!context) {
    URL.revokeObjectURL(svgUrl);
    throw new Error("Unable to prepare the ticket download.");
  }

  context.drawImage(image, 0, 0, canvas.width, canvas.height);

  const pngBlob = await new Promise<Blob | null>((resolve) =>
    canvas.toBlob(resolve, "image/png", 1)
  );

  URL.revokeObjectURL(svgUrl);

  if (!pngBlob) {
    throw new Error("Unable to generate the ticket image.");
  }

  const downloadUrl = URL.createObjectURL(pngBlob);
  const link = document.createElement("a");
  link.href = downloadUrl;
  link.download = fileName;
  link.click();
  URL.revokeObjectURL(downloadUrl);
}

export function BookingTicketCard(props: BookingTicketCardProps) {
  const [isDownloading, setIsDownloading] = useState(false);
  const cardRef = useRef<HTMLDivElement | null>(null);

  async function handleDownload() {
    if (!cardRef.current) {
      return;
    }

    setIsDownloading(true);

    try {
      await downloadNodeAsImage(
        cardRef.current,
        `gonzaga-booking-pass-${props.ticketCode.toLowerCase()}.png`
      );
    } catch (error) {
      console.error(error);
    } finally {
      setIsDownloading(false);
    }
  }

  return (
    <div className="mx-auto w-full max-w-[31.5rem] space-y-4">
      <div
        ref={cardRef}
        className="relative aspect-[1.586/1] overflow-hidden rounded-[1.6rem] border border-primary/15 bg-[linear-gradient(135deg,#0f4b33_0%,#156545_62%,#1c7a53_100%)] p-3.5 text-white shadow-[0_26px_50px_-20px_rgba(15,75,51,0.5)] sm:p-4"
      >
        <div className="absolute inset-[0.45rem] rounded-[1.2rem] border border-white/14" />

        <div className="relative grid h-full grid-cols-[1.54fr,0.46fr] gap-2.5">
          <div className="flex h-full min-w-0 flex-col pr-0.5">
            <div className="flex items-start justify-between gap-2">
              <div className="min-w-0 space-y-1">
                <div className="inline-flex items-center gap-1.5 rounded-full border border-white/24 bg-white/8 px-2.5 py-1 text-[9px] font-semibold uppercase tracking-[0.16em] text-white/95">
                  <ShieldCheck className="h-3.5 w-3.5" />
                  {props.isExpired ? "Expired pass" : "Verified booking"}
                </div>
                <p className="truncate text-[8.5px] uppercase tracking-[0.12em] text-white/84">
                  Gonzaga Travel Bookings
                </p>
              </div>
              <div className="rounded-[0.9rem] border border-white/18 bg-white/10 px-2.5 py-1.5 text-right">
                <p className="text-[8.5px] uppercase tracking-[0.12em] text-white/74">Ref</p>
                <p className="font-mono text-[12px] font-semibold text-white">
                  #{props.referenceCode}
                </p>
              </div>
            </div>

            <div className="mt-2.5 min-w-0 space-y-1.25">
              <h2 className="line-clamp-2 font-display text-[1.38rem] font-semibold leading-tight tracking-tight text-white sm:text-[1.5rem]">
                {props.destinationTitle}
              </h2>
              <p className="inline-flex items-center gap-2 text-[0.9rem] font-medium text-white/92">
                <Ticket className="h-3.5 w-3.5 shrink-0" />
                <span className="line-clamp-1">{props.serviceTitle}</span>
              </p>
              <p className="inline-flex items-center gap-2 text-[12px] text-white/82">
                <MapPin className="h-3.5 w-3.5 shrink-0" />
                <span className="line-clamp-1">{props.locationText}</span>
              </p>
            </div>

            <div className="mt-2.5 grid grid-cols-2 gap-2 text-[10px] text-white/80">
              <div className="rounded-[0.95rem] bg-black/14 px-3 py-2.25 ring-1 ring-white/10">
                <p className="uppercase tracking-[0.12em]">Visit date</p>
                <p className="mt-1 text-[14px] font-semibold text-white">{props.serviceDate}</p>
              </div>
              <div className="rounded-[0.95rem] bg-black/14 px-3 py-2.25 ring-1 ring-white/10">
                <p className="uppercase tracking-[0.12em]">Guests</p>
                <p className="mt-1 text-[14px] font-semibold text-white">
                  {props.guestCount} {props.guestCount === 1 ? "guest" : "guests"}
                </p>
              </div>
            </div>

            <div className="mt-auto grid grid-cols-[minmax(0,1fr),auto] items-end gap-2.5 border-t border-white/12 pt-2.5">
              <div className="min-w-0">
                <p className="text-[10px] uppercase tracking-[0.12em] text-white/74">
                  Guest name
                </p>
                <p className="mt-1 break-words text-[13px] font-semibold leading-[1.25] text-white">
                  {props.guestName}
                </p>
              </div>
              <div className="text-right">
                <p className="text-[9.5px] uppercase tracking-[0.12em] text-white/74">
                  Paid
                </p>
                <p className="mt-1 font-mono text-[13px] font-semibold text-white">
                  {props.totalPaid}
                </p>
              </div>
            </div>
          </div>

          <div className="flex h-full flex-col rounded-[1.2rem] bg-white/8 px-2.5 py-2.5 ring-1 ring-white/12">
            <div className="mx-auto rounded-[0.95rem] bg-white p-2.5 shadow-sm">
              <div className="grid h-[3.35rem] w-[3.35rem] grid-cols-5 gap-1">
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

            <div className="mt-2.5">
              <p className="text-[9.5px] uppercase tracking-[0.12em] text-white/74">Ticket code</p>
              <p className="mt-1 font-display text-[1.36rem] font-semibold leading-none tracking-[0.04em] text-white">
                {props.ticketCode.split("-").pop() ?? props.ticketCode}
              </p>
              <p className="mt-1 break-all font-mono text-[9px] text-white/62">
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
    </div>
  );
}
